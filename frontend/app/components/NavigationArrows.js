"use client"

import { View, StyleSheet, TouchableOpacity, Text } from "react-native"
import { useRouter } from "expo-router"
import { fetchOdooTasks } from "../utils/odooApi" 
import { useEffect, useState } from "react"

export default function NavigationArrows({ currentId, category }) {
  const router = useRouter()
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const transformAndFilterTasks = (tasks) => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    return tasks
      .filter(task => 
        task.is_stop_maintenance === false && 
        task.state === "01_in_progress" &&
        task.timer_state !== "reported" 
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
  };

  
  useEffect(() => {
    async function loadAppointments() {
      setLoading(true)
      try {
        const tasks = await fetchOdooTasks("", category) 
        const filtered = transformAndFilterTasks(tasks)
        setFilteredAppointments(filtered)
      } catch (error) {
        console.error('Error fetching tasks for navigation:', error)
        setFilteredAppointments([])
      } finally {
        setLoading(false)
      }
    }
    loadAppointments()
  }, [category])
  const currentIndex = filteredAppointments.findIndex(app => app.id === parseInt(currentId))

  const prevId = currentIndex > 0 ? filteredAppointments[currentIndex - 1].id : null
  const nextId = currentIndex < filteredAppointments.length - 1 ? filteredAppointments[currentIndex + 1].id : null

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>
  }

  if (filteredAppointments.length <= 1) {
    return null
  }

  return (
    <View style={styles.container}>
      
      {prevId ? (
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: "/DetailScreen",
            params: { id: prevId, category: category }
          })} 
          style={styles.arrowButton}
        >
          <Text style={styles.arrowText}>{"<"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      {/* Task counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {filteredAppointments.length}
        </Text>
      </View>

      {/* Next Button */}
      {nextId ? (
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: "/DetailScreen",
            params: { id: nextId, category: category }
          })} 
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
    minWidth: 40,
    alignItems: "center",
  },
  arrowText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    minWidth: 40,
  },
  counterContainer: {
    flex: 1,
    alignItems: "center",
  },
  counterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  }
})