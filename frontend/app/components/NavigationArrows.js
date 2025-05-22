"use client"

import { View, StyleSheet, TouchableOpacity, Text } from "react-native"
import { useRouter } from "expo-router"
import { filterAppointments } from "../data/appointments"

export default function NavigationArrows({ allAppointments, currentId, category }) {
  const router = useRouter()

  // Filter appointments by the given category
  const categorizedAppointments = category ? filterAppointments(allAppointments, '', category) : [];

  // Find the index of the current appointment in the categorized list
  const currentIndex = categorizedAppointments.findIndex(app => app.id === currentId);

  // Determine the previous and next appointment IDs based on the categorized list
  const prevId = currentIndex > 0 ? categorizedAppointments[currentIndex - 1].id : null;
  const nextId = currentIndex < categorizedAppointments.length - 1 ? categorizedAppointments[currentIndex + 1].id : null;

  return (
    <View style={styles.container}>
      {/* Left slot: Previous button or placeholder */}
      {prevId ? (
        <TouchableOpacity onPress={() => router.push('/DetailScreen?id=' + prevId)} style={styles.arrowButton}>
          <Text style={styles.arrowText}>{"<"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      {/* Right slot: Next button or placeholder */}
      {nextId ? (
        <TouchableOpacity onPress={() => router.push('/DetailScreen?id=' + nextId)} style={styles.arrowButton}>
          <Text style={styles.arrowText}>{ ">"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  arrowButton: {
    padding: 10,
    backgroundColor: "#52AFD4",
    borderRadius: 5,
  },
  arrowText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    flex: 1,
  }
})
