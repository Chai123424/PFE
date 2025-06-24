"use client"

import { View, StyleSheet, TouchableOpacity, Text } from "react-native"
import { useRouter } from "expo-router"
import { fetchOdooTasks } from "../utils/odooApi"
import { useEffect, useState } from "react"

export default function NavigationArrows({ currentId, category, filteredTaskIds }) {
  const router = useRouter()
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const transformAndFilterTasks = (tasks, categoryFilter) => {
    if (!tasks || !Array.isArray(tasks)) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return tasks
      .filter(task => {
        // Filtre de base
        const baseFilter = task.is_stop_maintenance === false &&
                           task.state === "01_in_progress" &&
                           task.timer_state !== "reported"

        if (!baseFilter || !task.date_deadline) return false

        const taskDate = new Date(task.date_deadline)
        if (isNaN(taskDate)) return false
        taskDate.setHours(0, 0, 0, 0)

        // Debug
        console.log(`Category: ${categoryFilter} | Task ID: ${task.id} | Deadline: ${task.date_deadline} | TaskDate: ${taskDate} | Today: ${today}`)

        switch (categoryFilter) {
  case "today":
    return taskDate.getTime() === today.getTime()
  case "past":
  case "previous": // <- c’est le cas utilisé chez toi
    return taskDate.getTime() < today.getTime()
  case "upcoming":
    return taskDate.getTime() > today.getTime()
  default:
    return true
}

      })
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
      }))
  }

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true)
      try {
        const tasks = await fetchOdooTasks("", "all")
        const filtered = transformAndFilterTasks(tasks, category)
        setFilteredAppointments(filtered)
        console.log(`Loaded ${filtered.length} tasks for category: ${category}`)
      } catch (error) {
        console.error('Error fetching tasks for navigation:', error)
        setFilteredAppointments([])
      } finally {
        setLoading(false)
      }
    }

    if (category) {
      loadAppointments()
    }
  }, [category])

  const currentIndex = filteredAppointments.findIndex(app => app.id === parseInt(currentId))
  const prevId = currentIndex > 0 ? filteredAppointments[currentIndex - 1].id : null
  const nextId = currentIndex < filteredAppointments.length - 1 ? filteredAppointments[currentIndex + 1].id : null

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    )
  }

  if (filteredAppointments.length <= 1) {
    return (
      <View style={styles.container}>
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {filteredAppointments.length === 0 ? "Aucune tâche" : "1 / 1"}
          </Text>
        </View>
      </View>
    )
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

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {filteredAppointments.length}
        </Text>
        <Text style={styles.categoryText}>
          {category === "today" ? "Aujourd'hui" :
           category === "past" ? "Passées" :
           category === "upcoming" ? "Prévues" : "Toutes"}
        </Text>
      </View>

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
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    minHeight: 50,
  },
  arrowButton: {
    padding: 12,
    backgroundColor: "#52AFD4",
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  arrowText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    minWidth: 44,
    minHeight: 44,
  },
  counterContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "600",
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "400",
  },
  loadingText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  }
})
