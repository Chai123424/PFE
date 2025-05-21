import { View, Text, StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import DetailHeader from "../components/DetailHeader"
import DetailCard from "../components/DetailCard"
import ActionButtons from "../components/ActionButtons"
import NavigationArrows from "../components/NavigationArrows"
import { appointmentDetails } from "../data/appointments"

export default function DetailScreen() {
  const { id } = useLocalSearchParams()
  const insets = useSafeAreaInsets()

  const appointment = appointmentDetails[id] || {}

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />

      <DetailHeader title="Tâche" />

      <Text style={styles.appointmentName}>{appointment.name}</Text>

      <DetailCard appointment={appointment} />

      <ActionButtons />

      <NavigationArrows currentId={id} maxId="7" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  appointmentName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#3333CC",
    textAlign: "center",
    marginVertical: 20,
  },
})
