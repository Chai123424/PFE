"use client"
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native"
import { ArrowLeft } from "lucide-react-native"
import { useRouter } from "expo-router"

export default function DetailHeader({ title, category, onSharePress, hideTransfer = false }) {
  const router = useRouter()

  const handleBackPress = () => {
    router.replace({
      pathname: '/Screens/HomeScreen',
      params: { category: category }
    })
  }

  return (
    <View style={styles.header}> 
      <TouchableOpacity
        onPress={handleBackPress}
        style={styles.backButton}
      >
        <ArrowLeft size={24} color="#1f3493" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      {!hideTransfer && (
        <TouchableOpacity style={styles.shareButton} onPress={onSharePress}>
          <Image 
            source={require('../assets/partager (2).png')} 
            style={styles.shareIconImage}
          />
        </TouchableOpacity>
      )}
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
    color: "#1f3493",
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: '60%',
    transform: [{ translateX: -50 }],
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