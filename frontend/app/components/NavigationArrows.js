"use client"

import { View, StyleSheet, TouchableOpacity, Text } from "react-native"
import { useRouter } from "expo-router"
import { fetchOdooTasks } from "../utils/odooApi" // Import your Odoo fetch function
import { useEffect, useState } from "react"

export default function NavigationArrows({ currentId, category }) {
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch appointments from Odoo based on category
  useEffect(() => {
    async function loadAppointments() {
      setLoading(true)
      const tasks = await fetchOdooTasks("", category) // Empty search query, filter by category
      setAppointments(tasks)
      setLoading(false)
    }
    loadAppointments()
  }, [category])

  // Find current index in the fetched appointments
  const currentIndex = appointments.findIndex(app => app.id === parseInt(currentId))

  // Determine previous/next IDs
  const prevId = currentIndex > 0 ? appointments[currentIndex - 1].id : null
  const nextId = currentIndex < appointments.length - 1 ? appointments[currentIndex + 1].id : null

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>
  }

  return (
    <View style={styles.container}>
      {/* Previous Button */}
      {prevId ? (
        <TouchableOpacity 
          onPress={() => router.push(`/DetailScreen?id=${prevId}`)} 
          style={styles.arrowButton}
        >
          <Text style={styles.arrowText}>{"<"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      {/* Next Button */}
      {nextId ? (
        <TouchableOpacity 
          onPress={() => router.push(`/DetailScreen?id=${nextId}`)} 
          style={styles.arrowButton}
        >
          <Text style={styles.arrowText}>{">"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  arrowButton: {
    padding: 10,
    backgroundColor: "#52AFD4",
    borderRadius: 5,
  },
  arrowText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    flex: 1,
  }
})