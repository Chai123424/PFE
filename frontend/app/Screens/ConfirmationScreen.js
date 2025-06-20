import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons'; 
import { useRouter, useLocalSearchParams } from 'expo-router'; 

export default function ConfirmationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const handleOKPress = () => {
    router.dismissAll();
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
    backgroundColor: '#4CBEE3', 
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
    elevation: 5, 
    shadowColor: '#000', 
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