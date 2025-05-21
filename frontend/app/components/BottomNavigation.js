import { View, Text, StyleSheet, TouchableOpacity } from "react-native"

export default function BottomNavigation({ activeTab }) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={[styles.navButton, activeTab === "past" && styles.activeNavButton]}>
        <Text style={activeTab === "past" ? styles.activeNavText : styles.navText}>Passées</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navButton, activeTab === "today" && styles.activeNavButton]}>
        <Text style={activeTab === "today" ? styles.activeNavText : styles.navText}>Aujourd'hui</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navButton, activeTab === "upcoming" && styles.activeNavButton]}>
        <Text style={activeTab === "upcoming" ? styles.activeNavText : styles.navText}>Prévues</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#52AFD4",
    height: 60,
  },
  navButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeNavButton: {
    backgroundColor: "#52AFD4",
  },
  navText: {
    fontSize: 14,
    color: "#333",
  },
  activeNavText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
})
