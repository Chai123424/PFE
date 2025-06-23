import { View, Text, StyleSheet, Alert, TextInput, Modal, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import DetailHeader from "./components/DetailHeader";
import DetailCard from "./components/DetailCard";
import ActionButtons from "./components/ActionButtons";
import NavigationArrows from "./components/NavigationArrows";

import { fetchTaskById, reportTask, startTaskInOdoo, fetchOdooTasks } from "./utils/odooApi";

export default function DetailScreen() {
  const { id, category } = useLocalSearchParams();
  console.log('DetailScreen - Received params:', { id, category });
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [filteredTaskIds, setFilteredTaskIds] = useState([]);
 
  const transformAndFilterTasks = (tasks) => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    return tasks
      .filter(task => 
        task.is_stop_maintenance === false && 
        task.state === "01_in_progress" &&
        task.timer_state !== "reported" 
      )
      .map(task => ({
        id: task.id,
        clientName: task.partner_name || (task.partner_id?.[1]) || 'Client',
        referenceAndDescription: task.name || 'Unnamed Task',
        type: task.project_id?.[1] || 'Task',
        time: task.date_deadline 
          ? new Date(task.date_deadline).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) 
          : "--:--",
        status: "à faire",
        date_deadline: task.date_deadline,
        formattedDate: task.date_deadline 
          ? new Date(task.date_deadline).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            }) 
          : null,
        is_stop_maintenance: task.is_stop_maintenance || false,
      }));
  };

  useEffect(() => {
    async function loadFilteredTasks() {
      try {
        console.log('DetailScreen - Loading filtered tasks for category:', category);
        const tasks = await fetchOdooTasks("", category || "today");
        console.log('DetailScreen - Raw tasks fetched:', tasks.length);
        const filteredTasks = transformAndFilterTasks(tasks);
        console.log('DetailScreen - Filtered tasks:', filteredTasks.length);
        const taskIds = filteredTasks.map(task => task.id.toString());
        console.log('DetailScreen - Task IDs:', taskIds);
        setFilteredTaskIds(taskIds);
      } catch (error) {
        console.error('Error fetching filtered tasks:', error);
        setFilteredTaskIds([]);
      }
    }

    if (category) {
      loadFilteredTasks();
    }
  }, [category]);

  useEffect(() => {
    if (!id) return;
  
    async function loadAppointment() {
      setLoading(true);
      console.log('DetailScreen - Fetching task with ID:', id);  
      const taskData = await fetchTaskById(id);
      console.log('DetailScreen - Received task data:', taskData);  
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

  // Détermination de la catégorie basée sur la date de deadline
  let currentAppointmentCategory = category; // Utiliser d'abord la catégorie passée en paramètre
  
  if (!currentAppointmentCategory && appointment.date_deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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

  console.log('DetailScreen - Current appointment category:', currentAppointmentCategory);
  console.log('DetailScreen - Appointment date:', appointment.date_deadline);
  console.log('DetailScreen - Filtered task IDs:', filteredTaskIds);

  const shouldHideActionButtons = appointment && 
    appointment.timer_state === "start" && 
    appointment.is_stop_maintenance === false;

  const handleLaunch = async () => {
    try {
      setLoading(true);
      const result = await startTaskInOdoo(id);
      
      if (result.success) {
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
                router.back();
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
      params: { 
        taskId: appointment.id,
        category: currentAppointmentCategory 
      }
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

        {!shouldHideActionButtons && (
          <ActionButtons 
            onLaunch={handleLaunch} 
            onReport={handleReport} 
          />
        )}

        <View style={[
          styles.navigationContainer, 
          { marginTop: shouldHideActionButtons ? 200 : 120 }
        ]}>
          <NavigationArrows 
            currentId={id} 
            category={currentAppointmentCategory}
            filteredTaskIds={filteredTaskIds} 
          />
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={handleCancelReport}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.keyboardAvoidingView}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
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
                    disabled={isReporting}
                  >
                    {isReporting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Signaler</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
    marginTop: 160,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
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