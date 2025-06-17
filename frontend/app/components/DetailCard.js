import { View, Text, StyleSheet } from "react-native"

export default function DetailCard({ appointment }) {
  return (
    <View style={styles.detailsCard}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Numero :</Text>
        <Text style={styles.detailValue}>{appointment.numero}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Entretien Piscine</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Adresse :</Text>
        <Text style={styles.detailValue}>{appointment.adresse}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Telephone :</Text>
        <Text style={styles.detailValue}>{appointment.telephone}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Heure :</Text>
        <Text style={styles.detailValue}>{appointment.heure}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Date :</Text>
        <Text style={styles.detailValue}>{appointment.date}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  detailsCard: {
    backgroundColor: "#e6f2f7",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  detailValue: {
    fontSize: 16,
  },
})
