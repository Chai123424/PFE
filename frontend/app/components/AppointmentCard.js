import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Link } from "expo-router"

export default function AppointmentCard({ appointment }) {
  return (
    <Link href={{ pathname: "/details", params: { id: appointment.id } }} asChild>
      <TouchableOpacity style={styles.appointmentCard}>
        <View style={styles.appointmentContent}>
          <Text style={styles.appointmentName}>{appointment.name || "----------"}</Text>
          <Text style={styles.appointmentDetails}>
            {appointment.code}-{appointment.type}
          </Text>
        </View>
        <View style={styles.appointmentTimeContainer}>
          <Text style={styles.appointmentTime}>{appointment.time}</Text>
          {appointment.status === "En cours" ? (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{appointment.status}</Text>
            </View>
          ) : (
            <View style={styles.distancePill}>
              <Text style={styles.distanceText}>{appointment.distance}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  )
}

const styles = StyleSheet.create({
  appointmentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#e6f2f7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#add8e6",
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  appointmentDetails: {
    fontSize: 14,
    color: "#666",
  },
  appointmentTimeContainer: {
    alignItems: "flex-end",
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  statusPill: {
    backgroundColor: "#52AFD4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
  },
  
})
