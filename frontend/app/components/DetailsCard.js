import { View, Text, StyleSheet } from "react-native";

export default function DetailCard({ details }) {
  if (!details) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{details.name}</Text>
      <View style={styles.infoBox}>
        <Text style={styles.label}><Text style={styles.bold}>Numero :</Text> {details.numero}</Text>
        <Text style={styles.label}><Text style={styles.bold}>Entretien Piscine</Text></Text>
        <Text style={styles.label}><Text style={styles.bold}>Adresse :</Text> {details.adresse}</Text>
        <Text style={styles.label}><Text style={styles.bold}>Telephone :</Text> {details.telephone}</Text>
        <Text style={styles.label}><Text style={styles.bold}>Heure :</Text> {details.heure}</Text>
        <Text style={styles.label}><Text style={styles.bold}>Date :</Text> {details.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 24 },
  name: { color: "#52AFD4", fontSize: 22, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  infoBox: {
    backgroundColor: "#e6f2f7",
    borderRadius: 14,
    padding: 18,
    width: "90%",
    marginBottom: 24,
  },
  label: { fontSize: 16, marginBottom: 6 },
  bold: { fontWeight: "bold" },
});

