import React, { useState, useEffect } from 'react';
import LoadingScreen from './Screens/commun/LoadingScreen'; 
import MainScreen from './Screens/Login/Login'; 

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000); 
  }, []);

  return isLoading ? <LoadingScreen /> : <MainScreen />;
};

export default App;
