import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Fonction utilitaire pour extraire la valeur d'un champ Odoo
const getOdooValue = (field) => {
  if (!field) return "N/A";

  // Cas d'un champ many2one : [id, nom]
  if (Array.isArray(field) && field.length >= 2) {
    return field[1];
  }

  // Cas d'une chaîne ou nombre simple
  if (typeof field === "string" || typeof field === "number") {
    return field.toString();
  }

  return "N/A";
};

// Formatage de la date en français
const formatOdooDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("fr-FR", options);
  } catch {
    return dateString;
  }
};

// Formatage de l'heure en français
const formatOdooTime = (datetime) => {
  if (!datetime) return "N/A";
  try {
    const date = new Date(datetime);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return datetime;
  }
};

export default function DetailCard({ appointment, partner }) {
  console.log("appointment:", appointment);
  console.log("partner:", partner);

  if (!appointment) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorText}>Aucune donnée d'appointment fournie</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailsCard}>
      {/* Numéro - nom ou ID appointment */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Numéro :</Text>
        <Text style={styles.detailValue}>
          {getOdooValue(appointment.name) || `T${appointment.id}` || "N/A"}
        </Text>
      </View>

      {/* Adresse partenaire */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Adresse :</Text>
        <Text style={styles.detailValue}>{appointment.partner_address_complete || "N/A"}</Text>
      </View>

      {/* Téléphone partenaire */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Téléphone :</Text>
        <Text style={styles.detailValue}>
          {appointment.partner_phone || "N/A"}
        </Text>
      </View>

      {/* Date et Heure de l'appointment */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Date :</Text>
        <Text style={styles.detailValue}>{formatOdooDate(appointment.date_deadline)}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Heure :</Text>
        <Text style={styles.detailValue}>{formatOdooTime(appointment.date_deadline)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  detailsCard: {
    backgroundColor: "#e6f2f7",
    borderRadius: 12,
    padding: 16, // Reduced from 30
    marginHorizontal: 20,
  },
  detailRow: {
    flexDirection: "column",
    marginBottom: 10, // Reduced from 16
  },
  detailLabel: {
    fontSize: 14, // Reduced from 16
    fontWeight: "600",
    marginBottom: 2, // Reduced from 4
    color: "#333",
  },
  detailValue: {
    fontSize: 14, // Reduced from 16
    color: "#666",
    marginBottom: 4, // Reduced from 8
  },
  errorCard: {
    backgroundColor: "#ffebee",
    borderRadius: 12,
    padding: 16, // Reduced from 20
    marginHorizontal: 20,
    borderColor: "#f44336",
    borderWidth: 1,
  },
  errorText: {
    color: "#f44336",
    fontSize: 14, // Reduced from 16
    textAlign: "center",
  },
});