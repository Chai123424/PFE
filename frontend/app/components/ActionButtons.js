import { View, Text, StyleSheet, TouchableOpacity } from "react-native"

export default function ActionButtons() {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.chooseButton}>
        <Text style={styles.chooseButtonText}>Lancer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.reportButton}>
        <Text style={styles.reportButtonText}>Reporter</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  actionButtons: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  chooseButton: {
    backgroundColor: "#3333CC",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 16,
  },
  chooseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  reportButton: {
    backgroundColor: "#E53935",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
  },
  reportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
