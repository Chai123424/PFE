import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import DetailHeader from "./components/DetailHeader"
import DetailCard from "./components/DetailCard"
import ActionButtons from "./components/ActionButtons"
import NavigationArrows from "./components/NavigationArrows"
import { appointmentDetails, removeAppointment, allAppointments, filterAppointments } from "./data/appointments"

export default function DetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const appointment = appointmentDetails[id] || {}

  // Determine the category of the current appointment
  const currentAppointment = allAppointments.find(app => app.id === id);
  let currentAppointmentCategory = null;

  if (currentAppointment) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(currentAppointment.date);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate.getTime() === today.getTime()) {
      currentAppointmentCategory = "today";
    } else if (appointmentDate < today) {
      currentAppointmentCategory = "past";
    } else {
      currentAppointmentCategory = "upcoming";
    }
  }

  const handleLaunch = () => {
    router.push('/Screens/InfoScreen')
  }

  const handleReport = () => {
    removeAppointment(id);
    router.replace({ pathname: '/', params: { category: currentAppointmentCategory } });
  }

  const handleTransfer = () => {
    router.push('/Screens/TransferScreen')
  }

  if (!appointmentDetails[id]) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="auto" />
        <DetailHeader title="Tâche" category={currentAppointmentCategory} onSharePress={handleTransfer} />
        <Text style={styles.errorText}>
          Aucune information pour cette tâche (id: {id}).
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />
      <DetailHeader title="Tâche" onTransfer={handleTransfer} category={currentAppointmentCategory} onSharePress={handleTransfer} />

      <Text style={styles.appointmentName}>{appointment.name}</Text>

      <DetailCard appointment={appointment} />

      <ActionButtons onLaunch={handleLaunch} onReport={handleReport} />

      <NavigationArrows allAppointments={allAppointments} currentId={id} category={currentAppointmentCategory} />
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
  backButton: {
    marginTop: 16,
    marginLeft: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
    backgroundColor: "#52AFD4",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    margin: 20,
  }
})
