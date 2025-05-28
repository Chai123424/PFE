import React, { useState, useEffect } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router"

import Header from "../components/Header"
import SearchBar from "../components/SearchBar"
import AppointmentCard from "../components/AppointmentCard"
import BottomNavigation from "../components/BottomNavigation"
import { fetchOdooTasks, fetchOdooUserInfo } from '../utils/odooApi.js'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { category: initialCategory } = useLocalSearchParams();

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState(initialCategory || "today");
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [username, setUsername] = useState("Loading...");
  const [userId, setUserId] = useState(null);

  // ADD THESE FUNCTIONS HERE - INSIDE THE COMPONENT
  const mapOdooTaskStatus = (task) => {
    if (task.stage_id) {
      const stageName = task.stage_id[1];
      if (stageName.toLowerCase().includes('done') || stageName.toLowerCase().includes('terminé')) {
        return 'Terminé';
      } else if (stageName.toLowerCase().includes('progress') || stageName.toLowerCase().includes('cours')) {
        return 'En cours';
      }
    }
    return 'À faire';
  };

  const transformTasksToAppointments = (tasks) => {
    return tasks.map(task => {
  const clientName = task.partner_name || (task.partner_id && task.partner_id[1]) || 'Client';
  const clientId = task.partner_id?.[0]; 

  return {
    id: task.id,
    clientId, 
    clientName,
    referenceAndDescription: task.name || 'Unnamed Task',
    type: task.project_id ? task.project_id[1] : 'Task',
    time: task.date_deadline
      ? new Date(task.date_deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : "--:--",
    status: mapOdooTaskStatus(task),
  };
});

  };

  // Function to fetch user info
  const fetchUserInfo = async () => {
    try {
      const userInfo = await fetchOdooUserInfo();
      if (userInfo && userInfo.name) {
        setUsername(userInfo.name);
        setUserId(userInfo.id); 
      } else {
        setUsername("User");
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUsername("User");
    }
  };

  // UPDATE THIS FUNCTION
  const updateAppointments = async () => {
    setLoading(true);
    try {
      const tasks = await fetchOdooTasks(searchQuery, activeTab);
      console.log('Fetched tasks:', tasks);
      const myTasks = tasks.filter(task => task.user_id?.[0] === userId);
      setTasks(tasks);
      const transformedTasks = transformTasksToAppointments(tasks);
      console.log('Transformed tasks:', transformedTasks); // For debugging
      setFilteredAppointments(transformedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  
  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (userId !== null) {
      updateAppointments();
    }
  }, [searchQuery, activeTab, userId]);

  
  useFocusEffect(
    React.useCallback(() => {
      if (userId !== null) {
        updateAppointments();
      }
    }, [userId])
  );

  const handleAppointmentPress = (id, clientId) => {
  router.push(`/DetailScreen?id=${id}&clientId=${clientId}&category=${activeTab}`);
};


  

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />
      <Header username={username} showTransferIcon={false} onTransfer={null} />
      <SearchBar onChangeText={setSearchQuery} />

      <FlatList
        data={filteredAppointments}
        renderItem={({ item }) => (
          <AppointmentCard 
            appointment={item} 
            onPress={() => handleAppointmentPress(item.id, item.clientId)} 
          />

        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  )
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
})