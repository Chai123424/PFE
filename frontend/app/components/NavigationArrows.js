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
    if (!tasks || !Array.isArray(tasks)) return [];
  
    const now = new Date(); // Current date and time
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
  
    return tasks
      .filter(task => {
        // Base filter
        const baseFilter = task.is_stop_maintenance === false &&
                           task.state === "01_in_progress" &&
                           task.timer_state !== "reported";
  
        if (!baseFilter) return false;
  
        // If no deadline, only show in "today" category
        if (!task.date_deadline) return categoryFilter === "today";
  
        const taskDateTime = new Date(task.date_deadline);
        if (isNaN(taskDateTime)) return false;
  
        // Use the same logic as HomeScreen for consistency
        switch (categoryFilter) {
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
          statusColor = "#d62c1a";
        } else if (task.date_deadline) {
          const taskDateTime = new Date(task.date_deadline);
          const now = new Date();
          
          // Mark as overdue if past the deadline
          if (taskDateTime < now) {
            status = "en retard";
            statusColor = "#e74c3c";
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
        
        if (categoryFilter === "previous") {
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
  };

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true)
      try {
        const tasks = await fetchOdooTasks("", "all")
        const filtered = transformAndFilterTasks(tasks, category)
        setFilteredAppointments(filtered)
        console.log(`NavigationArrows: Loaded ${filtered.length} tasks for category: ${category}`)
        console.log('Filtered task IDs:', filtered.map(t => t.id))
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

  console.log(`NavigationArrows: Current ID: ${currentId}, Current Index: ${currentIndex}, Total: ${filteredAppointments.length}`)

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
           category === "previous" ? "Passées" :
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
