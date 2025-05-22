
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from './Screens/commun/LoadingScreen';
import HomeScreen from './Screens/HomeScreen'
export default function Index() {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const value = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(value === 'true');
      setTimeout(() => setReady(true), 2000); 
    };
    checkLogin();
  }, []);

  if (!ready) return <LoadingScreen />;
  return <Redirect href={isLoggedIn ? '/Screens/HomeScreen' : '/loginScreen'} />;
}




