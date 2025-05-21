import React, { useEffect } from 'react';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const LoadingScreen = () => {
  const router = useRouter();

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      router.replace('/screens/LoginScreen');
    }, 2000); // Navigate after 2 seconds
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
      />
      <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  spinner: {
    marginTop: 30,
  },
});

export default LoadingScreen; 