import { View, StyleSheet, FlatList } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import Header from "../components/Header"
import SearchBar from "../components/SearchBar"
import AppointmentCard from "../components/AppointmentCard"
import BottomNavigation from "../components/BottomNavigation"
import { appointments } from "../data/appointments"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />
      <Image source={require("../assets/anonyme.png")} style={styles.avatar} />
      <Header username="Mohammed Tazi" />
      <SearchBar />

      <FlatList
        data={appointments}
        renderItem={({ item }) => <AppointmentCard appointment={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <BottomNavigation activeTab="today" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
})
