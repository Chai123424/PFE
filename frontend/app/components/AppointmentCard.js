import { View, Text, StyleSheet } from "react-native"

export default function AppointmentCard({ appointment }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "En cours":
        return "#52AFD4"
      case "Terminé":
        return "#4CAF50"
      case "En attente":
        return "#FFA000"
      default:
        return "#666"
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{appointment.name}</Text>
        <View
          style={[
            styles.status,
            { backgroundColor: getStatusColor(appointment.status) },
          ]}
        >
          <Text style={styles.statusText}>{appointment.status}</Text>
        </View>
      </View>

      <Text style={styles.time}>{appointment.time}</Text>
      <Text style={styles.description}>{appointment.description}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#52AFD4",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#52AFD4",
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  time: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
}) 