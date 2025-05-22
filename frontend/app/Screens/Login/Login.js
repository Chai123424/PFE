import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dbName, setDbName] = useState('');
  const [url, setUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // Simuler un login réussi
    await AsyncStorage.setItem('isLoggedIn', 'true');
    router.replace('/HomeScreen'); 
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Bienvenue</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@example.com"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••••••"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#A0A0A0"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>DB Name</Text>
          <TextInput
            style={styles.input}
            value={dbName}
            onChangeText={setDbName}
            autoCapitalize="none"
          />

          <Text style={styles.label}>URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 160,
    height: 160,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E3192',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#000000',
  },
  input: {
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
    color: '#000000',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
  },
  eyeIcon: {
    paddingRight: 15,
  },
  loginButton: {
    backgroundColor: '#2E3192',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
