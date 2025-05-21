import { View, TextInput, StyleSheet } from "react-native"
import { Search } from "lucide-react-native"

export default function SearchBar() {
  return (
    <View style={styles.container}>
      <Search size={20} color="#666" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Rechercher..."
        placeholderTextColor="#666"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#000",
  },
}) 