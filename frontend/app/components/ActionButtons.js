import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useEffect, useState } from "react"
import NetInfo from "@react-native-community/netinfo"

export default function ActionButtons({ onLaunch, onReport }) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected)
    })

    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected)
    })

    
    return () => unsubscribe()
  }, [])

  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={[styles.chooseButton, !isOnline && styles.disabledButton]} 
        onPress={onLaunch}
        disabled={!isOnline}
      >
        <Text style={[styles.chooseButtonText, !isOnline && styles.disabledButtonText]}>
          {isOnline ? "Lancer" : "Lancer"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.reportButton, !isOnline && styles.disabledButton]} 
        onPress={onReport}
        disabled={!isOnline}
      >
        <Text style={[styles.reportButtonText, !isOnline && styles.disabledButtonText]}>
          Reporter
        </Text>
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
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#666666',
  },
})
