import { View, TextInput, StyleSheet } from "react-native"
import { Search } from "lucide-react-native"

export default function SearchBar({ onChangeText, value, placeholder }) {
  return (
    <View style={styles.searchContainer}>
      <TextInput 
        style={styles.searchInput} 
        placeholder={placeholder || "Rechercher par nom de client"}
        placeholderTextColor="#666666"
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <Search size={20} color="#999" style={styles.searchIcon} />
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    position: "relative",
  },
  searchInput: {
    backgroundColor: "#e6f2f7",
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 10,
    color: "#000000", // Add this line - forces black text
    fontSize: 16, // Add consistent font size
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: 10,
  },
})