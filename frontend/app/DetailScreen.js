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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="auto" />
        <DetailHeader title="Tâche" category="inconnue" onSharePress={() => {}} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Aucune information pour cette tâche (id: {id}).
          </Text>
        </View>
      </View>
    );
  }

  // Détection de la catégorie basée sur date_deadline
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

  // Actions
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
      
      <View style={styles.contentContainer}>
        <Text style={styles.appointmentName}>
          {appointment.partner_name || "Tâche sans nom"}
        </Text>

        <DetailCard appointment={appointment} clientInfo={null} />

        <ActionButtons onLaunch={handleLaunch} onReport={handleReport} />

        <View style={styles.navigationContainer}>
          <NavigationArrows 
            currentId={id} 
            category={currentAppointmentCategory} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  appointmentName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2c3e50",
    textAlign: "center",
    marginVertical: 24,
    paddingHorizontal: 20,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#6c757d",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 24,
    backgroundColor: "#f8d7da",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f5c6cb",
  },
  navigationContainer: {
    marginTop: 40,
    paddingBottom: 20,
  },
});