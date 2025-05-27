"use client"

import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native"
import { ArrowLeft } from "lucide-react-native"
import { useRouter } from "expo-router"

export default function DetailHeader({ title, category, onSharePress }) {
  const router = useRouter()

  return (
    <View style={styles.header}>
       <TouchableOpacity 
      onPress={() => router.replace({ pathname: '/', params: { category: category } })}
      style={styles.backButton}
    >
      <ArrowLeft size={24} color="#3333CC" />
    </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.shareButton} onPress={onSharePress}>
        <Image 
          source={require('../assets/partager.png')}
          style={styles.shareIconImage}
        />
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
    padding: 10,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#52AFD4",
  },
  shareButton: {
    padding: 8,
  },
  shareIconImage: {
    width: 24,
    height: 24,
    tintColor: "#262c99",
  }
})
