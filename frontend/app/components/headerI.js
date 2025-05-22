import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';  

const HeaderS = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header avec bouton retour */}
      <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}  
      >
        <Ionicons name="chevron-back" size={30} color="#1f3493" />
      </TouchableOpacity>

        <Text style={styles.welcomeText}>Information</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0.2,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    marginRight: 20,
  },
  backButton: {
    paddingTop: 15,
  },
  welcomeText: {
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#1f3493',
    marginLeft: 65,
  },
});

export default HeaderS;
