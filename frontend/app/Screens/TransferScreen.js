import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import HeaderS from '../components/headerI';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { callOdooActionChangeSingleTechnician, fetchTechniciansById } from '../utils/odooApi';
import { useEffect } from 'react';

const TransferApp = () => {
  const [selectedTech, setSelectedTech] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [currentTechnician, setCurrentTechnician] = useState(null);
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();
  const taskId = params.taskId || params.appointmentId || params.id;
  const router = useRouter();

  useEffect(() => {
    console.log('TransferApp params:', params);
    console.log('TransferApp taskId:', taskId);
    
    if (!taskId) {
      console.error('No taskId found in params');
      Alert.alert(
        'Erreur',
        'ID de tâche manquant. Impossible de continuer.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
  }, [params, taskId]);

  useEffect(() => {
    const loadTechnicians = async () => {
      setLoading(true);
      try {
        const result = await fetchTechniciansById();
        setTechnicians(result.availableTechnicians);
        setCurrentTechnician(result.currentTechnician);
      } catch (error) {
        console.error('Erreur chargement techniciens :', error);
        Alert.alert('Erreur', 'Impossible de charger la liste des techniciens');
      }
      setLoading(false);
    };

    if (taskId) {
      loadTechnicians();
    }
  }, [taskId]);

  const handleTransfer = async () => {
    if (!taskId) {
      Alert.alert('Erreur', 'ID de tâche manquant');
      return;
    }

    if (!selectedTech) {
      Alert.alert('Erreur', 'Veuillez sélectionner un technicien');
      return;
    }
  
    const techName = technicians.find((t) => t.id === selectedTech)?.name;
    
    Alert.alert(
      'Confirmer transfert', 
      `Définir ${techName} comme technicien secondaire ?\n\n(Le technicien principal reste ${currentTechnician?.name})`, 
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await callOdooActionChangeSingleTechnician(taskId, selectedTech);
              
              if (result.success) {
                Alert.alert(
                  'Succès', 
                  result.message || 'Technicien secondaire modifié avec succès',
                  [{
                    text: 'OK',
                    onPress: () => router.replace({
                      pathname: '/Screens/HomeScreen',
                      params: {
                        refresh: Date.now().toString(),
                        transferredTaskId: taskId,
                        newSecondaryTech: selectedTech
                      },
                    }),
                  }]
                );
              } else {
                Alert.alert('Erreur', result.error || 'Échec du transfert');
              }
            } catch (error) {
              console.error('Transfer error:', error);
              Alert.alert('Erreur', `Une erreur est survenue: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };
  
  if (!taskId) {
    return (
      <View style={styles.container}>
        <HeaderS />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>ID de tâche manquant</Text>
          <TouchableOpacity 
            style={styles.transferButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.transferButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <HeaderS />

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

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>Chargement des techniciens...</Text>
        ) : technicians.length === 0 ? (
          <Text style={styles.noDataText}>Aucun technicien trouvé</Text>
        ) : (
          technicians.map((tech) => (
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
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