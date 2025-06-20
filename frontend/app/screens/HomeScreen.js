import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from "react-native";
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
  
  return tasks
    .filter(task => 
      task.is_stop_maintenance === false && 
      task.state === "01_in_progress" &&
      task.timer_state !== "reported" 
    )
    .map(task => {
      
      let status = "à faire"; 
      let statusColor = "#FFC107"; 
      
      if (task.timer_state === "start" && task.is_stop_maintenance === false) {
        status = "en cours";
        statusColor = "#d62c1a"; 
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
      };
    });
}, []);
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
      const tasks = await fetchOdooTasks("", activeTab);
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
  }, [activeTab, transformTasksToAppointments, isConnected]);

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

  // In HomeScreen.js - Replace the handleAppointmentPress function

  const handleAppointmentPress = (id) => {
    if (!isConnected) {
      return; 
    }
    
    const task = tasks.find(t => t.id === id);
    
    if (task && task.timer_state === "start" && task.is_stop_maintenance === false) {
      // Pass the current activeTab to maintain navigation context
      router.push(`./InfoScreen?id=${id}&category=${activeTab}&status=ongoing`);
    } else {
      // Pass the current activeTab to maintain navigation context
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
      
      {/* N'afficher la barre de recherche que si connecté */}
      {isConnected && (
        <SearchBar 
          onChangeText={setSearchQuery} 
          value={searchQuery}
          placeholder="Rechercher par nom de client"
        />
      )}

      {renderContent()}

      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        disabled={!isConnected}
      />
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