"use client"

import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { ArrowLeft, Share2 } from "lucide-react-native"
import { useRouter } from "expo-router"

export default function DetailHeader({ title }) {
  const router = useRouter()

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={24} color="#3333CC" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.shareButton}>
        <Share2 size={24} color="#3399FF" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#52AFD4",
  },
  shareButton: {
    padding: 8,
  },
})
