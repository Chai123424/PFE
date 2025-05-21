"use client"

import { View, StyleSheet, TouchableOpacity } from "react-native"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { useRouter } from "expo-router"

export default function NavigationArrows({ currentId, maxId }) {
  const router = useRouter()

  const goToPrevious = () => {
    const prevId = String(Math.max(1, Number(currentId) - 1));
    onNavigate(prevId); // onNavigate est une fonction passée en prop depuis le parent
  };
  
  const goToNext = () => {
    const nextId = String(Math.min(Number(maxId), Number(currentId) + 1));
    onNavigate(nextId);
  };

  return (
    <View style={styles.navigationArrows}>
      <TouchableOpacity style={styles.arrowButton} onPress={goToPrevious}>
        <ChevronLeft size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.arrowButton} onPress={goToNext}>
        <ChevronRight size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  navigationArrows: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  arrowButton: {
    backgroundColor: "#add8e6",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
})
