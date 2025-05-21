import { View, Text, StyleSheet, TouchableOpacity } from "react-native"

export default function ActionButtons({ onLaunch, onReport }) {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.chooseButton} onPress={onLaunch}>
        <Text style={styles.chooseButtonText}>Lancer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.reportButton} onPress={onReport}>
        <Text style={styles.reportButtonText}>Reporter</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 30,
  },
  chooseButton: {
    backgroundColor: "#52AFD4",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 32,
    alignItems: "center",
    marginHorizontal: 8,
    width:130,
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
    paddingHorizontal: 32,
    alignItems: "center",
    marginHorizontal: 8,
    width:130,
  },
  reportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})