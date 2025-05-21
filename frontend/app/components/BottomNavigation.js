import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react-native"

export default function BottomNavigation({ activeTab, onTabChange }) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={[styles.navButton, activeTab === "past" && styles.activeNavButton]}
        onPress={() => onTabChange("past")}
      >
        <ChevronLeft size={18} color="#fff" />
        <Text style={activeTab === "past" ? styles.activeNavText : styles.navText}>Passées</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.navButton, activeTab === "today" && styles.activeNavButton]}
        onPress={() => onTabChange("today")}
      >
        <ChevronDown size={18} color="#fff" />
        <Text style={activeTab === "today" ? styles.activeNavText : styles.navText}>Aujourd'hui</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.navButton, activeTab === "upcoming" && styles.activeNavButton]}
        onPress={() => onTabChange("upcoming")}
      >
        <ChevronRight size={18} color="#fff" />
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
    fontSize: 12,
    color: "#fff",
    marginTop: 2,
  },
  activeNavText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    marginTop: 2,
  },
})