import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { ArrowLeft, CornerUpRight } from "lucide-react-native"

export default function Header({ title, username, showTransferIcon, onTransfer }) {
  const router = useRouter()

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.username}>{username}</Text>
          </>
        )}
      </View>

      {showTransferIcon && (
        <TouchableOpacity onPress={onTransfer} style={styles.transferButton}>
          <CornerUpRight size={24} color="#52AFD4" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  greeting: {
    fontSize: 16,
    color: "#666",
  },
  username: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  transferButton: {
    padding: 8,
  },
}) 