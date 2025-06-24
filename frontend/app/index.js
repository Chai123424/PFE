import { useEffect, useState } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from './Screens/commun/LoadingScreen';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { category } = useLocalSearchParams(); 

  useEffect(() => {
    const checkLogin = async () => {
      const value = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(value === 'true');
      setTimeout(() => setReady(true), 200); 
    };
    checkLogin();
  }, []);

  if (!ready) return <LoadingScreen />;

  
  return (
    <Redirect href={isLoggedIn ? `/Screens/HomeScreen${category ? `?category=${category}` : ''}` : '/loginScreen'} />
  );
}