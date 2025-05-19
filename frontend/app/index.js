import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen'; // Ton écran de chargement
import MainScreen from './components/Login'; // Ton écran principal

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Simulation de chargement
  }, []);

  return isLoading ? <LoadingScreen /> : <MainScreen />;
};

export default App;
