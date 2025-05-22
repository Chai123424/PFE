import React, { useState, useEffect } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router"

import Header from "../components/Header"
import SearchBar from "../components/SearchBar"
import AppointmentCard from "../components/AppointmentCard"
import BottomNavigation from "../components/BottomNavigation"
import { allAppointments, filterAppointments } from "../data/appointments"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { category: initialCategory } = useLocalSearchParams();

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState(initialCategory || "today");
  const [filteredAppointments, setFilteredAppointments] = useState([])

  const updateAppointments = () => {
    setFilteredAppointments(filterAppointments(allAppointments, searchQuery, activeTab))
  }

  // Update appointments when search or tab changes
  useEffect(() => {
    updateAppointments()
  }, [searchQuery, activeTab])

  // Update appointments when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      updateAppointments()
    }, [])
  )

  const handleAppointmentPress = (id) => {
    router.push(`/DetailScreen?id=${id}&category=${activeTab}`)
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />
      <Header username="Mohammed Tazi" showTransferIcon={false} onTransfer={null} />
      <SearchBar onChangeText={setSearchQuery} />

      <FlatList
        data={filteredAppointments}
        renderItem={({ item }) => (
          <AppointmentCard 
            appointment={item} 
            onPress={() => handleAppointmentPress(item.id)} 
          />
        )}
        keyExtractor={(item) => item.id}
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