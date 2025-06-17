import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { User, CornerUpRight } from "lucide-react-native"

export default function Header({ username, showTransferIcon, onTransfer }) {
  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <User size={24} color="#000" />
        </View>
        <Text style={styles.userName}>{username}</Text>
      </View>
      <View style={styles.headerIcons}>
        {showTransferIcon && (
          <TouchableOpacity style={styles.iconButton} onPress={onTransfer}>
            <CornerUpRight size={24} color="#52AFD4" />
          </TouchableOpacity>
        )}
      </View>
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
})
