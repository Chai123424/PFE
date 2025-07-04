import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Text, Keyboard } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import NetInfo from '@react-native-community/netinfo';
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import AppointmentCard from "../components/AppointmentCard";
import BottomNavigation from "../components/BottomNavigation";
import { fetchOdooTasks, fetchOdooUserInfo } from '../utils/odooApi.js';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { category: initialCategory } = useLocalSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(initialCategory || "today");
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [username, setUsername] = useState("Loading...");
  const [userId, setUserId] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  // Add keyboard visibility state
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const normalizeDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const getTodayNormalized = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Network state:', state);
      setIsConnected(state.isConnected);
      
      if (state.isConnected && !isConnected) {
        setNetworkError(false);
        fetchUserInfo();
        fetchAndStoreTasks();
      }
    });

    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, [isConnected]);

  const transformTasksToAppointments = useCallback((tasks) => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    const now = new Date(); // Current date and time
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    return tasks
      .filter(task => {
        const isValidTask = task.is_stop_maintenance === false && 
                           task.state === "01_in_progress" &&
                           task.timer_state !== "reported";
        
        if (!isValidTask) return false;
        
        if (!task.date_deadline) {
          return activeTab === "today";
        }
        
        const taskDateTime = new Date(task.date_deadline);
        if (isNaN(taskDateTime)) return false;
        
        switch (activeTab) {
          case "previous":
            // All tasks before now (past due)
            return taskDateTime < now;
            
          case "today":
            // Tasks scheduled for today (regardless of time)
            // OR tasks that are overdue from previous days
            return (taskDateTime >= today && taskDateTime < tomorrow);
            
          case "upcoming":
            // Tasks scheduled for future dates (tomorrow and beyond)
            return taskDateTime >= tomorrow;
            
          default:
            return true;
        }
      })
      .map(task => {
        let status = "à faire"; 
        let statusColor = "#FFC107"; 
        
        if (task.timer_state === "start" && task.is_stop_maintenance === false) {
          status = "en cours";
          statusColor = "#00853E"; 
        } else if (task.date_deadline) {
          const taskDateTime = new Date(task.date_deadline);
          const now = new Date();
          
          // Mark as overdue if past the deadline
          if (taskDateTime < now) {
            status = "en retard";
            statusColor = "#e74c3c"; // Red for overdue
          }
        }
        
        return {
          id: task.id,
          clientName: task.partner_name || (task.partner_id?.[1]) || 'Client',
          referenceAndDescription: task.name || 'Unnamed Task',
          type: task.project_id?.[1] || 'Task',
          time: task.date_deadline 
            ? new Date(task.date_deadline).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) 
            : "--:--",
          status: status,
          statusColor: statusColor,
          date_deadline: task.date_deadline,
          formattedDate: task.date_deadline 
            ? new Date(task.date_deadline).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              }) 
            : null,
          is_stop_maintenance: task.is_stop_maintenance || false,
          isOverdue: task.date_deadline && new Date(task.date_deadline) < new Date(),
        };
      })
      .sort((a, b) => {
        // Handle tasks without dates - put them at the end
        if (!a.date_deadline && !b.date_deadline) return 0;
        if (!a.date_deadline) return 1;
        if (!b.date_deadline) return -1;
        
        const dateA = new Date(a.date_deadline);
        const dateB = new Date(b.date_deadline);
        
        // Get date parts for grouping by day
        const dayA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
        const dayB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
        
        if (activeTab === "previous") {
          // For previous tab: Group by day (most recent day first), then by time (earliest first within each day)
          if (dayA.getTime() !== dayB.getTime()) {
            return dayB.getTime() - dayA.getTime(); // Most recent day first
          }
          return dateA.getTime() - dateB.getTime(); // Earliest time first within the day
        }
        
        // For "today" and "upcoming": Group by day (earliest day first), then by time (earliest first within each day)
        if (dayA.getTime() !== dayB.getTime()) {
          return dayA.getTime() - dayB.getTime(); // Earliest day first
        }
        return dateA.getTime() - dateB.getTime();
      });
  }, [activeTab]);
  

  const fetchUserInfo = useCallback(async () => {
    if (!isConnected) {
      setUsername("Hors ligne");
      return;
    }

    try {
      const userInfo = await fetchOdooUserInfo();
      setUsername(userInfo?.name || "User");
      setNetworkError(false);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUsername("User");
      setNetworkError(true);
    }
  }, [isConnected]);

  const fetchAndStoreTasks = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      setFilteredAppointments([]);
      setTasks([]);
      return;
    }

    setLoading(true);
    try {
      const tasks = await fetchOdooTasks("");
      setTasks(tasks);
      const transformed = transformTasksToAppointments(tasks);
      setFilteredAppointments(transformed);
      setNetworkError(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setFilteredAppointments([]);
      setTasks([]);
      setNetworkError(true);
    } finally {
      setLoading(false);
    }
  }, [transformTasksToAppointments, isConnected]);

  const applySearchFilter = useCallback(() => {
    if (!tasks.length) return;
    
    const filtered = transformTasksToAppointments(tasks).filter(appointment => {
      const searchLower = searchQuery.toLowerCase();
      return appointment.clientName.toLowerCase().includes(searchLower);
    });
    
    setFilteredAppointments(filtered);
  }, [tasks, searchQuery, transformTasksToAppointments]);

  useEffect(() => {
    if (isConnected) {
      fetchUserInfo();
      fetchAndStoreTasks();
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      fetchAndStoreTasks();
    }
  }, [activeTab]);

  useEffect(() => {
    applySearchFilter();
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      if (isConnected) {
        fetchAndStoreTasks();
      }
    }, [fetchAndStoreTasks, isConnected])
  );

  const handleAppointmentPress = (id) => {
    if (!isConnected) {
      return; 
    }
    
    const task = tasks.find(t => t.id === id);
    
    if (task && task.timer_state === "start" && task.is_stop_maintenance === false) {
      router.push(`./InfoScreen?id=${id}&category=${activeTab}&status=ongoing`);
    } else {
      router.push(`/DetailScreen?id=${id}&category=${activeTab}`);
    }
  };

  const renderContent = () => {
    if (!isConnected) {
      return (
        <View style={styles.noConnectionContainer}>
          <Text style={styles.noConnectionTitle}>Pas de connexion</Text>
          <Text style={styles.noConnectionMessage}>
            Vérifiez votre connexion internet pour accéder aux tâches
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Chargement des tâches...</Text>
        </View>
      );
    }

    if (networkError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erreur de connexion</Text>
          <Text style={styles.errorMessage}>
            Impossible de charger les tâches. Vérifiez votre connexion.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredAppointments}
        renderItem={({ item }) => (
          <AppointmentCard 
            appointment={item} 
            onPress={() => handleAppointmentPress(item.id)} 
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>Aucun rendez-vous trouvé</Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />
      <Header 
        username={username} 
        showTransferIcon={false} 
        onTransfer={null}
        isOffline={!isConnected}
      />
      
      {isConnected && (
        <SearchBar 
          onChangeText={setSearchQuery} 
          value={searchQuery}
          placeholder="Rechercher par nom de client"
        />
      )}

      {renderContent()}

      {/* Hide bottom navigation when keyboard is visible */}
      {!keyboardVisible && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          disabled={!isConnected}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noConnectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noConnectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  noConnectionMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 50,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
});