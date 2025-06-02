import { View, Text, StyleSheet, Alert, TextInput, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import DetailHeader from "./components/DetailHeader";
import DetailCard from "./components/DetailCard";
import ActionButtons from "./components/ActionButtons";
import NavigationArrows from "./components/NavigationArrows";

import { fetchTaskById, reportTask , startTaskInOdoo} from "./utils/odooApi";

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  console.log('Received ID parameter:', id);  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);
 
  useEffect(() => {
    if (!id) return;
  
    async function loadAppointment() {
      setLoading(true);
      console.log('Fetching task with ID:', id);  
      const taskData = await fetchTaskById(id);
      console.log('Received task data:', taskData);  
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

  // Update the handleLaunch function in DetailScreen.js
const handleLaunch = async () => {
  try {
    // Show loading indicator
    setLoading(true);
    
    const result = await startTaskInOdoo(id);
    
    if (result.success) {
      // Navigate to InfoScreen only if the task was successfully started
      router.push({
        pathname: "/Screens/InfoScreen",
        params: { id },
      });
    } else {
      Alert.alert(
        "Erreur", 
        result.error || "Impossible de lancer la tâche. Elle a peut-être déjà été commencée.",
        [{ text: "OK" }]
      );
    }
  } catch (error) {
    console.error("Error launching task:", error);
    Alert.alert(
      "Erreur", 
      "Une erreur est survenue lors du lancement de la tâche",
      [{ text: "OK" }]
    );
  } finally {
    setLoading(false);
  }
};

  const handleReport = () => {
    setReportModalVisible(true);
  };

  const handleConfirmReport = async () => {
    if (!reportDescription.trim()) {
      Alert.alert("Erreur", "Veuillez saisir une description pour le signalement.");
      return;
    }

    setIsReporting(true);
    
    try {
      const result = await reportTask(id, reportDescription.trim());
      
      if (result.success) {
        Alert.alert(
          "Succès", 
          "La tâche a été signalée avec succès. Les administrateurs ont été notifiés.",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate back to home - the task is already updated in Odoo
                router.replace({
                  pathname: "/",
                  params: { category: currentAppointmentCategory },
                });
              }
            }
          ]
        );
      } else {
        Alert.alert("Erreur", result.error || "Une erreur est survenue lors du signalement.");
      }
    } catch (error) {
      console.error("Error reporting task:", error);
      Alert.alert("Erreur", "Impossible de signaler la tâche. Vérifiez votre connexion.");
    } finally {
      setIsReporting(false);
      setReportModalVisible(false);
      setReportDescription("");
    }
  };

  const handleCancelReport = () => {
    setReportModalVisible(false);
    setReportDescription("");
  };

  const handleTransfer = () => {
    router.push({
      pathname: "/Screens/TransferScreen",
      params: { taskId: appointment.id },
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
          {appointment.partner_name ? `${appointment.partner_name}` : "Tâche sans nom"}
        </Text>

        <DetailCard appointment={appointment} clientInfo={null} />

        <ActionButtons 
          onLaunch={handleLaunch} 
          onReport={handleReport} 
          isLaunching={loading}  // Pass loading state if needed
        />

        <View style={styles.navigationContainer}>
          <NavigationArrows 
            currentId={id} 
            category={currentAppointmentCategory} 
          />
        </View>
      </View>

      {/* Report Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={handleCancelReport}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Signaler la tâche</Text>
            <Text style={styles.modalSubtitle}>
              Veuillez expliquer pourquoi cette tâche doit être reportée :
            </Text>
            
            <TextInput
              style={styles.textInput}
              multiline={true}
              numberOfLines={4}
              placeholder=""
              value={reportDescription}
              onChangeText={setReportDescription}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleCancelReport}
                disabled={isReporting}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleConfirmReport}
                disabled={isReporting || !reportDescription.trim()}
              >
                {isReporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Signaler</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  confirmButton: {
    backgroundColor: '#dc3545',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});