// TransferApp.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Feather } from '@expo/vector-icons';
import HeaderS from '../components/headerI';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { appointmentDetails, removeAppointment, allAppointments, filterAppointments } from "../data/appointments"
import { transferAppointmentToTechnician, fetchTechniciansById, fetchOdooTasks } from '../utils/odooApi';
import { useEffect } from 'react';
import { callOdooActionChangeSingleTechnician } from '../utils/odooApi';

const TransferApp = () => {
  const [selectedTech, setSelectedTech] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [currentTechnician, setCurrentTechnician] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { taskId } = useLocalSearchParams()
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams();

  useEffect(() => {
    const loadTechnicians = async () => {
      setLoading(true);
      try {
        
        const result = await fetchTechniciansById();
        setTechnicians(result.availableTechnicians);
        setCurrentTechnician(result.currentTechnician);
        
        console.log('Technicien actuel:', result.currentTechnician);
        console.log('Techniciens disponibles:', result.availableTechnicians);
      } catch (error) {
        console.error('Erreur chargement techniciens :', error);
        Alert.alert('Erreur', 'Impossible de charger la liste des techniciens');
      }
      setLoading(false);
    };

    loadTechnicians();
  }, []);
 
  const filteredTechnicians = (technicians || []).filter((tech) =>
    tech.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransfer = () => {
    if (!selectedTech) {
      Alert.alert('Erreur', 'Veuillez sélectionner un technicien');
      return;
    }

    const techName = technicians.find((t) => t.id === selectedTech)?.name;
    console.log('=== DEBUT TRANSFERT ===');
    console.log('appointmentId:', appointmentId, 'type:', typeof appointmentId);
    console.log('selectedTech:', selectedTech, 'type:', typeof selectedTech);
    console.log('techName:', techName);

    Alert.alert('Confirmer transfert', `Transférer à : ${techName} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          setLoading(true);
          try {
            console.log('Appel API en cours...');
            const result = await callOdooActionChangeSingleTechnician(appointmentId, selectedTech);
            console.log('Résultat API:', result);

            // Supprimer localement l'appointment si employeeId différent
            const removeResult = removeAppointment(
              appointments,
              Number(appointmentId),
              currentTechnician?.id
            );
            console.log('Résultat removeAppointment:', removeResult);

            if (removeResult.success) {
              setAppointments(removeResult.appointments);
            }

            Alert.alert('Succès', removeResult.message, [
              {
                text: 'OK',
                onPress: () => {
                  router.replace({
                    pathname: '/Screens/HomeScreen',
                    params: {
                      refresh: Date.now().toString(),
                      transferred: 'true',
                    },
                  });
                },
              },
            ]);
          } catch (error) {
            console.error('=== ERREUR TRANSFERT ===');
            console.error('Error details:', error);
            console.error('Error message:', error.message);
            Alert.alert('Erreur', 'Une erreur est survenue lors du transfert: ' + error.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };
  return (
    <View style={styles.container}>
      <HeaderS />

      {/* Current Technician Info */}
      {currentTechnician && (
        <View style={styles.currentTechContainer}>
          <Text style={styles.currentTechLabel}>Technicien actuel :</Text>
          <View style={styles.currentTechItem}>
            <Image
              source={require('../assets/anonyme.png')}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <Text style={styles.currentTechText}>{currentTechnician.name}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Transférer vers :</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un technicien"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Feather name="search" size={18} color="#49b2d7" style={styles.searchIcon} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>Chargement des techniciens...</Text>
        ) : filteredTechnicians.length === 0 ? (
          <Text style={styles.noDataText}>Aucun technicien trouvé</Text>
        ) : (
          filteredTechnicians.map((tech) => (
            <View key={tech.id} style={styles.techItem}>
              <Image
                source={require('../assets/anonyme.png')}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
              <Text style={styles.techText}>{tech.name}</Text>
              <TouchableOpacity
                onPress={() => setSelectedTech((prev) => (prev === tech.id ? null : tech.id))}
                style={styles.checkbox}
              >
                <Icon
                  name={selectedTech === tech.id ? 'check-square' : 'square-o'}
                  size={24}
                  color={selectedTech === tech.id ? '#1f3493' : '#ccc'}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.separator} />

      <TouchableOpacity
        style={[styles.transferButton, (!selectedTech || loading) && styles.disabledButton]}
        onPress={handleTransfer}
        disabled={!selectedTech || loading}
      >
        <Text style={styles.transferButtonText}>
          {loading ? 'Transfert en cours...' : 'Transférer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  currentTechContainer: {
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1f3493',
  },
  currentTechLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  currentTechItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTechText: {
    fontSize: 16,
    color: '#1f3493',
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 15,
  },
  scrollContainer: { flex: 1, marginBottom: 10 },
  searchContainer: { position: 'relative', marginBottom: 12 },
  searchInput: {
    backgroundColor: '#e1f0f7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchIcon: { position: 'absolute', right: 16, top: 12 },
  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 5,
    borderColor: '#41b8de',
    width: '95%',
    height: 70,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  techText: { fontSize: 17, color: '#343a40', fontWeight: '500' },
  checkbox: { paddingLeft: 10 },
  loadingText: { 
    textAlign: 'center', 
    marginTop: 20, 
    fontSize: 16, 
    color: '#666' 
  },
  noDataText: { 
    textAlign: 'center', 
    marginTop: 20, 
    fontSize: 16, 
    color: '#666' 
  },
  separator: { height: 1, backgroundColor: '#38a1c5', marginVertical: 15, opacity: 0.3 },
  transferButton: {
    backgroundColor: '#1f3493',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    width: '75%',
    alignSelf: 'center',
  },
  disabledButton: { backgroundColor: '#adb5bd', shadowColor: 'transparent' },
  transferButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

export default TransferApp;