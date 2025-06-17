import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons'; // Using Feather icons for the checkmark
import { useRouter, useLocalSearchParams } from 'expo-router'; // Import useLocalSearchParams
import { removeAppointment } from '../data/appointments';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Get the appointment ID from URL parameters

  const handleOKPress = () => {
    if (id) {
      // Remove the appointment
      removeAppointment(id);
      // Navigate back to home screen
      router.replace('/');
    } else {
      // If no ID is provided, just go back to home
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <Feather name="check-circle" size={120} color="white" style={styles.checkmark} />
      <TouchableOpacity style={styles.okButton} onPress={handleOKPress}>
        <Text style={styles.okButtonText}>OK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CBEE3', // A shade of blue similar to the image
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  checkmark: {
    marginBottom: 40,
  },
  okButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 60,
    elevation: 5, // Add shadow for Android
    shadowColor: '#000', // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  okButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
});