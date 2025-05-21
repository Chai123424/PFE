import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Feather } from '@expo/vector-icons';
import HeaderS from '../components/header';
import { useNavigation } from '@react-navigation/native';

const TransferApp = () => {
  const [selectedTech, setSelectedTech] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

    const navigation = useNavigation();

  const technicians = [
    { id: 1, name: 'Samir' },
    { id: 2, name: 'Mohammed' },
    { id: 3, name: 'Ali' },
    { id: 4, name: 'Samir' },
    { id: 5, name: 'Mohammed' },
    { id: 6, name: 'Ali' },
    { id: 7, name: 'Karim' },
    { id: 8, name: 'Omar' },
    { id: 9, name: 'Youssef' },
  ];

  const filteredTechnicians = technicians.filter((tech) =>
    tech.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransfer = () => {
    if (!selectedTech) {
      Alert.alert('Erreur', 'Veuillez sélectionner un technicien');
      return;
    }

    const techName = technicians.find((t) => t.id === selectedTech)?.name;

    Alert.alert('Confirmer transfert', `Transférer à : ${techName} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () => {
          Alert.alert('Succès', `Transfert effectué vers ${techName}`, [
            { text: 'OK', onPress: () => {
            setSelectedTech(null);
            navigation.navigate('HomeScreen');} },
          ]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <HeaderS />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un technicien"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Feather
          name="search"
          size={18}
          color="#49b2d7"
          style={styles.searchIcon}
        />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {filteredTechnicians.map((tech) => (
          <View key={tech.id} style={styles.techItem}>
            <Image
              source={require('../assets/anonyme.png')}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
            <Text style={styles.techText}>{tech.name}</Text>
            <TouchableOpacity
              onPress={() =>
                setSelectedTech((prev) => (prev === tech.id ? null : tech.id))
              }
              style={styles.checkbox}
            >
              <Icon
                name={selectedTech === tech.id ? 'check-square' : 'square-o'}
                size={24}
                color={selectedTech === tech.id ? '#1f3493' : '#ccc'}
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.separator} />

      <TouchableOpacity
        style={[
          styles.transferButton,
          !selectedTech && styles.disabledButton,
        ]}
        onPress={handleTransfer}
        disabled={!selectedTech}
      >
        <Text style={styles.transferButtonText}>Transférer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 10,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#e1f0f7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
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

    // Stronger shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  techText: {
    fontSize: 17,
    color: '#343a40',
    fontWeight: '500',
  },
  checkbox: {
    paddingLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#38a1c5',
    marginVertical: 15,
    opacity: 0.3,
  },
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
  disabledButton: {
    backgroundColor: '#adb5bd',
    shadowColor: 'transparent',
  },
  transferButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TransferApp;
