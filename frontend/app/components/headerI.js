import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const HeaderS = () => {
    const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('DetailScreen')}
        >
          <Ionicons name="chevron-back" size={30} color="#1f3493" />
        </TouchableOpacity>

        {/* Logo et titre */}
       
        
        <Text style={styles.welcomeText}>Information</Text>
        
      
      </View>

      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  header: {
    
    display: 'flex',
    flexDirection: 'row',
    marginRight: 20,
  },
  backButton: {
    paddingTop: 15,
    
  },
  logoContainer: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  logo: {
    width: 60,
    height: 60,
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