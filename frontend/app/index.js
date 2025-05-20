"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native"
import { Link } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { User, Wrench, Search, ChevronLeft, ChevronDown, ChevronRight } from "lucide-react-native"

// Sample data with dates for filtering and status
const allAppointments = [
  {
    id: "1",
    name: "Msefer Chakir",
    code: "500139",
    type: "Entretien Piscine",
    time: "9:00:00",
    status: "En cours",
    date: new Date(2025, 4, 20), // Today
  },
  {
    id: "2",
    name: "Haj Benseid",
    code: "500124",
    type: "Entretien Piscine",
    time: "11:30:00",
    status: "À faire",
    date: new Date(2025, 4, 20), // Today
  },
  {
    id: "3",
    name: "Bensaid",
    code: "500004",
    type: "Entretien Piscine",
    time: "11:30:00",
    status: "Terminé",
    date: new Date(2025, 4, 19), // Yesterday (past)
  },
  {
    id: "4",
    name: "Zouine",
    code: "500109",
    type: "Entretien Piscine",
    time: "16:00:00",
    status: "À faire",
    date: new Date(2025, 4, 21), // Tomorrow (upcoming)
  },
  {
    id: "5",
    name: "Said",
    code: "500009",
    type: "Entretien Piscine",
    time: "18:00:00",
    status: "À faire",
    date: new Date(2025, 4, 22), // Upcoming
  },
  {
    id: "6",
    name: "Bennani",
    code: "500039",
    type: "Entretien Piscine",
    time: "20:00:00",
    status: "Terminé",
    date: new Date(2025, 4, 18), // Past
  },
  {
    id: "7",
    name: "",
    code: "500039",
    type: "Entretien Piscine",
    time: "20:00:00",
    status: "À faire",
    date: new Date(2025, 4, 23), // Upcoming
  },
]

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("today")
  const [filteredAppointments, setFilteredAppointments] = useState([])

  // Filter appointments based on search query and active tab
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // First filter by date category
    let dateFiltered = []

    if (activeTab === "today") {
      dateFiltered = allAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate.getTime() === today.getTime()
      })
    } else if (activeTab === "past") {
      dateFiltered = allAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate < today
      })
    } else if (activeTab === "upcoming") {
      dateFiltered = allAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate > today
      })
    }

    // Then filter by search query
    if (searchQuery.trim() === "") {
      setFilteredAppointments(dateFiltered)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredAppointments(
        dateFiltered.filter(
          (appointment) => appointment.name.toLowerCase().includes(query) || appointment.code.includes(query),
        ),
      )
    }
  }, [searchQuery, activeTab])

  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case "En cours":
        return "#4CAF50" // Green
      case "Terminé":
        return "#2196F3" // Blue
      case "À faire":
        return "#FFC107" // Yellow/Amber
      default:
        return "#FFC107"
    }
  }

  // Format date to display
  const formatDate = (date) => {
    const options = { day: "numeric", month: "long" }
    return date.toLocaleDateString("fr-FR", options)
  }

  const renderAppointment = ({ item }) => (
    <Link href={{ pathname: "/details", params: { id: item.id } }} asChild>
      <TouchableOpacity style={styles.appointmentCard}>
        <View style={styles.appointmentContent}>
          <Text style={styles.appointmentName}>{item.name || "----------"}</Text>
          <Text style={styles.appointmentDetails}>
            {item.code}-{item.type}
          </Text>
        </View>
        <View style={styles.appointmentTimeContainer}>
          <Text style={styles.appointmentTime}>{item.time}</Text>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  )

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <User size={20} color="#fff" />
          </View>
          <Text style={styles.userName}>Mohammed Tazi</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Wrench size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Search size={20} color="#999" style={styles.searchIcon} />
      </View>

      {/* Appointments List */}
      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune tâche trouvée</Text>
          </View>
        }
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton, activeTab === "past" && styles.activeNavButton]}
          onPress={() => setActiveTab("past")}
        >
          <ChevronLeft size={18} color="#fff" />
          <Text style={activeTab === "past" ? styles.activeNavText : styles.navText}>Passées</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, activeTab === "today" && styles.activeNavButton]}
          onPress={() => setActiveTab("today")}
        >
          <ChevronDown size={18} color="#fff" />
          <Text style={activeTab === "today" ? styles.activeNavText : styles.navText}>Aujourd'hui</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, activeTab === "upcoming" && styles.activeNavButton]}
          onPress={() => setActiveTab("upcoming")}
        >
          <ChevronRight size={18} color="#fff" />
          <Text style={activeTab === "upcoming" ? styles.activeNavText : styles.navText}>Prévues</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f6fa",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f0f6fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4ba3da",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#e6f2f7",
    borderRadius: 20,
    paddingHorizontal: 16,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    height: 40,
    fontSize: 16,
    flex: 1,
    paddingLeft: 30,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  appointmentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#e6f2f7",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#add8e6",
  },
  appointmentContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0066cc",
    marginBottom: 4,
  },
  appointmentDetails: {
    fontSize: 14,
    color: "#666",
  },
  appointmentTimeContainer: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#4ba3da",
    height: 60,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  navButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeNavButton: {
    backgroundColor: "#3a8bc2",
  },
  navText: {
    fontSize: 12,
    color: "#fff",
    marginTop: 2,
  },
  activeNavText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    marginTop: 2,
  },
})
