import React, { useState, useEffect } from 'react';
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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dbOperations, initDatabase } from '../../utils/sqlite';

const authenticateOdoo = async (username, password, serverUrl, database) => {
  if (!serverUrl || !database) {
    throw new Error('Server URL and database name are required');
  }

  const endpoint = serverUrl.replace(/\/$/, '') + '/jsonrpc';
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "common",
      method: "authenticate",
      args: [database, username, password, {}]
    },
    id: Date.now()
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  
  if (data.result) {
    await dbOperations.setConfig('odoo_uid', data.result.toString());
    await dbOperations.setConfig('user_email', username);
    await dbOperations.setConfig('odoo_url', serverUrl);
    await dbOperations.setConfig('odoo_db', database);
    await dbOperations.setConfig('odoo_password', password);
    await AsyncStorage.setItem('isLoggedIn', 'true');
    return data.result;
  }
  return null;
};

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [database, setDatabase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    initDatabase().catch(() => setError('Failed to initialize app'));
  }, []);

  const handleLogin = async () => {
    if (!username || !password || !serverUrl || !database) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const uid = await authenticateOdoo(username, password, serverUrl, database);
      if (uid) {
        router.replace('/Screens/HomeScreen');
      } else {
        setError('Invalid credentials');
      }
    } catch (e) {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.welcomeText}>Bienvenue</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Server URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://yourserver.odoo.com"
                placeholderTextColor="#A0A0A0"
                value={serverUrl}
                onChangeText={setServerUrl}
                keyboardType="url"
                autoCapitalize="none"
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => this.databaseInput?.focus()}
              />

              <Text style={styles.label}>Database Name</Text>
              <TextInput
                ref={(ref) => { this.databaseInput = ref; }}
                style={styles.input}
                placeholder="your-database-name"
                placeholderTextColor="#A0A0A0"
                value={database}
                onChangeText={setDatabase}
                autoCapitalize="none"
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => this.usernameInput?.focus()}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                ref={(ref) => { this.usernameInput = ref; }}
                style={styles.input}
                placeholder="example@example.com"
                placeholderTextColor="#A0A0A0"
                value={username}
                onChangeText={setUsername}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => this.passwordInput?.focus()}
              />

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={(ref) => { this.passwordInput = ref; }}
                  style={styles.passwordInput}
                  placeholder="••••••••••••"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E3192',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
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
    paddingLeft: 10,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F56565',
  },
  errorText: {
    color: '#C53030',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#2E3192',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2E3192',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});