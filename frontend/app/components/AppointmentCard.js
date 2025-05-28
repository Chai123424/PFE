import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function AppointmentCard({ appointment, onPress }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "En cours":
        return "#4CAF50"; // Green
      case "Terminé":
        return "#52AFD4"; // Bleu du thème
      case "À faire":
        return "#FFC107"; // Yellow/Amber
      default:
        return "#FFC107";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non assigné";
    
    const dateOnly = dateString.split(' ')[0];
    const date = new Date(dateOnly);
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <TouchableOpacity 
      style={styles.appointmentCard} 
      onPress={() => {
        console.log("Card pressed, id:", appointment.id);
        onPress && onPress(appointment.id);
      }}
    >
      <View style={styles.leftContent}>
        {/* Client Name as main title */}
        <Text style={styles.clientName}>
          {appointment.clientName || appointment.name || "----------"}
        </Text>
        
        {/* Reference and Description as subtitle */}
        <Text style={styles.referenceDetails}>
          {appointment.referenceAndDescription || appointment.partner_name || " "}
        </Text>
        
        {/* CHANGÉ: Utilise date_deadline au lieu de date_assign */}
        <Text style={styles.dateText}>
          Date Limite: {formatDate(appointment.date_deadline)}
        </Text>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={styles.appointmentTime}>
          {appointment.time || " "}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor(appointment.status) }]}> 
          <Text style={styles.statusText}>{appointment.status || "À faire"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  appointmentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#52AFD4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 90,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#52AFD4",
    marginBottom: 2,
  },
  referenceDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  statusPill: {
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});