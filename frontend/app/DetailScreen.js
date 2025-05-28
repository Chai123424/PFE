import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import DetailHeader from "./components/DetailHeader";
import DetailCard from "./components/DetailCard";
import ActionButtons from "./components/ActionButtons";
import NavigationArrows from "./components/NavigationArrows";
import { fetchTaskById } from "./utils/odooApi"; 
import { removeAppointment, allAppointments } from "./data/appointments";

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    if (!id) return;

    async function loadAppointment() {
      setLoading(true);
      const taskData = await fetchTaskById(id);
      setAppointment(taskData);
      setLoading(false);
    }

    loadAppointment();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="auto" />
        <DetailHeader title="Tâche" category="inconnue" onSharePress={() => {}} />
        <Text style={styles.errorText}>
          Aucune information pour cette tâche (id: {id}).
        </Text>
      </View>
    );
  }

  let currentAppointmentCategory = null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointment.date_deadline) {
    const appointmentDate = new Date(appointment.date_deadline);
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
    router.push({
      pathname: "/Screens/InfoScreen",
      params: { id },
    });
  };

  const handleReport = () => {
    removeAppointment(id);
    router.replace({
      pathname: "/",
      params: { category: currentAppointmentCategory },
    });
  };

  const handleTransfer = () => {
    router.push({
      pathname: "/Screens/TransferScreen",
      params: { appointmentId: id },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />
      <DetailHeader
        title="Tâche"
        onTransfer={handleTransfer}
        category={currentAppointmentCategory}
        onSharePress={handleTransfer}
      />
      <Text style={styles.appointmentName}>
        {appointment.partner_name || "Tâche sans nom"}
      </Text>

      <DetailCard appointment={appointment} clientInfo={null} />

      <ActionButtons onLaunch={handleLaunch} onReport={handleReport} />

      <NavigationArrows
        allAppointments={allAppointments}
        currentId={id}
        category={currentAppointmentCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  appointmentName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#3333CC",
    textAlign: "center",
    marginVertical: 20,
  },
  errorText: {
    color: "red",
    margin: 20,
    fontSize: 16,
    textAlign: "center",
  },
});
