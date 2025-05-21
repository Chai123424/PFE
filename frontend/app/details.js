"use client"

import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

// Sample data for appointment details with dates and status
const allAppointments = [
  {
    id: "1",
    name: "Msefer Chakir",
    code: "500139",
    type: "Entretien Piscine",
    time: "9:00:00",
    status: "En cours",
    date: new Date(2025, 4, 20), // Today
    details: {
      numero: "500139",
      adresse: "rue 23",
      telephone: "06-66 66 66 66",
      heure: "9:00:00",
      date: "Mardi 23 juin 2024",
    },
  },
  {
    id: "2",
    name: "Haj Benseid",
    code: "500124",
    type: "Entretien Piscine",
    time: "11:30:00",
    status: "À faire",
    date: new Date(2025, 4, 20), // Today
    details: {
      numero: "500124",
      adresse: "rue 45",
      telephone: "06-77 77 77 77",
      heure: "11:30:00",
      date: "Mardi 23 juin 2024",
    },
  },
  {
    id: "3",
    name: "Bensaid",
    code: "500004",
    type: "Entretien Piscine",
    time: "11:30:00",
    status: "Terminé",
    date: new Date(2025, 4, 19), // Yesterday (past)
    details: {
      numero: "500004",
      adresse: "rue 12",
      telephone: "06-88 88 88 88",
      heure: "11:30:00",
      date: "Lundi 22 juin 2024",
    },
  },
  {
    id: "4",
    name: "Zouine",
    code: "500109",
    type: "Entretien Piscine",
    time: "16:00:00",
    status: "À faire",
    date: new Date(2025, 4, 21), // Tomorrow (upcoming)
    details: {
      numero: "500109",
      adresse: "rue 78",
      telephone: "06-99 99 99 99",
      heure: "16:00:00",
      date: "Mercredi 24 juin 2024",
    },
  },
  {
    id: "5",
    name: "Said",
    code: "500009",
    type: "Entretien Piscine",
    time: "18:00:00",
    status: "À faire",
    date: new Date(2025, 4, 22), // Upcoming
    details: {
      numero: "500009",
      adresse: "rue 34",
      telephone: "06-55 55 55 55",
      heure: "18:00:00",
      date: "Jeudi 25 juin 2024",
    },
  },
  {
    id: "6",
    name: "Bennani",
    code: "500039",
    type: "Entretien Piscine",
    time: "20:00:00",
    status: "Terminé",
    date: new Date(2025, 4, 18), // Past
    details: {
      numero: "500039",
      adresse: "rue 56",
      telephone: "06-44 44 44 44",
      heure: "20:00:00",
      date: "Dimanche 21 juin 2024",
    },
  },
  {
    id: "7",
    name: "Client Sans Nom",
    code: "500039",
    type: "Entretien Piscine",
    time: "20:00:00",
    status: "À faire",
    date: new Date(2025, 4, 23), // Upcoming
    details: {
      numero: "500039",
      adresse: "rue 90",
      telephone: "06-33 33 33 33",
      heure: "20:00:00",
      date: "Vendredi 26 juin 2024",
    },
  },
]

export default function Details() {
  const { id } = useLocalSearchParams()
  const router = useRouter()

  // Find the appointment by ID
  const appointment = allAppointments.find((app) => app.id === id) || allAppointments[0]
  const details = appointment.details

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

  // Get the category of the appointment (past, today, upcoming)
  const getAppointmentCategory = (appointmentDate) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const appDate = new Date(appointmentDate)
    appDate.setHours(0, 0, 0, 0)

    if (appDate.getTime() === today.getTime()) return "today"
    if (appDate < today) return "past"
    return "upcoming"
  }

  // Find the next appointment in the same category
  const findNextAppointment = (currentId, direction) => {
    const currentIndex = allAppointments.findIndex((app) => app.id === currentId)
    if (currentIndex === -1) return currentId

    const currentCategory = getAppointmentCategory(appointment.date)

    let nextIndex = currentIndex
    do {
      nextIndex = direction === "next" ? nextIndex + 1 : nextIndex - 1

      // Loop back if we reach the end or beginning
      if (nextIndex >= allAppointments.length) nextIndex = 0
      if (nextIndex < 0) nextIndex = allAppointments.length - 1

      // Stop if we've checked all appointments
      if (nextIndex === currentIndex) break

      const nextAppCategory = getAppointmentCategory(allAppointments[nextIndex].date)

      // If we found an appointment in the same category, return its ID
      if (nextAppCategory === currentCategory) {
        return allAppointments[nextIndex].id
      }
    } while (nextIndex !== currentIndex)

    return currentId
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tâche</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* Appointment Name and Status */}
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentName}>{appointment.name}</Text>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Text style={styles.statusText}>{appointment.status}</Text>
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Numero :</Text>
          <Text style={styles.detailValue}>{details.numero}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Entretien Piscine</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Adresse :</Text>
          <Text style={styles.detailValue}>{details.adresse}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Telephone :</Text>
          <Text style={styles.detailValue}>{details.telephone}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Heure :</Text>
          <Text style={styles.detailValue}>{details.heure}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date :</Text>
          <Text style={styles.detailValue}>{details.date}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.chooseButton}>
          <Text style={styles.chooseButtonText}>Choisir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>Reporter</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Arrows */}
      <View style={styles.navigationArrows}>
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => {
            const prevId = findNextAppointment(id, "prev")
            router.replace({ pathname: "/details", params: { id: prevId } })
          }}
        >
          <Text style={styles.arrowButtonText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => {
            const nextId = findNextAppointment(id, "next")
            router.replace({ pathname: "/details", params: { id: nextId } })
          }}
        >
          <Text style={styles.arrowButtonText}>→</Text>
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: "#3333CC",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0066cc",
  },
  shareButton: {
    padding: 8,
  },
  shareButtonText: {
    fontSize: 24,
    color: "#3399FF",
  },
  appointmentHeader: {
    alignItems: "center",
    marginVertical: 16,
  },
  appointmentName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0066cc",
    textAlign: "center",
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
    color: "#333",
  },
  detailValue: {
    fontSize: 16,
    color: "#555",
  },
  actionButtons: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  chooseButton: {
    backgroundColor: "#0066cc",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chooseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  reportButton: {
    backgroundColor: "#E53935",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  navigationArrows: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  arrowButton: {
    backgroundColor: "#4ba3da",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  arrowButtonText: {
    fontSize: 24,
    color: "#fff",
  },
})
