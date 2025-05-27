import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
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

  const transformTasksToAppointments = useCallback((tasks) => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    return tasks
      .filter(task => 
        task.is_stop_maintenance === false && 
        task.state === "01_in_progress"
      )
      .map(task => ({
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
        status: "à faire",
        date_deadline: task.date_deadline,
        formattedDate: task.date_deadline 
          ? new Date(task.date_deadline).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            }) 
          : null,
        is_stop_maintenance: task.is_stop_maintenance || false,
      }));
  }, []);

  const fetchUserInfo = useCallback(async () => {
    try {
      const userInfo = await fetchOdooUserInfo();
      setUsername(userInfo?.name || "User");
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUsername("User");
    }
  }, []);

  const fetchAndStoreTasks = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = await fetchOdooTasks("", activeTab);
      setTasks(tasks);
      const transformed = transformTasksToAppointments(tasks);
      setFilteredAppointments(transformed);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, transformTasksToAppointments]);

  const applySearchFilter = useCallback(() => {
    if (!tasks.length) return;
    
    const filtered = transformTasksToAppointments(tasks).filter(appointment => {
      const searchLower = searchQuery.toLowerCase();
      return appointment.clientName.toLowerCase().includes(searchLower);
    });
    
    setFilteredAppointments(filtered);
  }, [tasks, searchQuery, transformTasksToAppointments]);

  useEffect(() => {
    fetchUserInfo();
    fetchAndStoreTasks();
  }, []);

  useEffect(() => {
    fetchAndStoreTasks();
  }, [activeTab]);

  useEffect(() => {
    applySearchFilter();
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchAndStoreTasks();
    }, [fetchAndStoreTasks])
  );

  const handleAppointmentPress = (id) => {
    router.push(`/DetailScreen?id=${id}&category=${activeTab}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />
      <Header username={username} showTransferIcon={false} onTransfer={null} />
      <SearchBar 
        onChangeText={setSearchQuery} 
        value={searchQuery}
        placeholder="Rechercher par nom de client"
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
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
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
});