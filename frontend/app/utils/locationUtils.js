// utils/locationUtils.js
import * as Location from 'expo-location';
import { Alert } from 'react-native';

/**
 * Demande les permissions de géolocalisation
 * @returns {Promise<boolean>} true si permission accordée, false sinon
 */
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'L\'accès à la localisation est requis pour cette fonctionnalité.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    Alert.alert(
      'Erreur',
      'Impossible de demander la permission de géolocalisation.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Obtient la position actuelle de l'utilisateur
 * @param {Object} options - Options pour la géolocalisation
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const getCurrentLocation = async (options = {}) => {
  try {
    // Vérifier si les permissions sont accordées
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    // Options par défaut
    const defaultOptions = {
      accuracy: Location.Accuracy.High,
      timeout: 15000,
      maximumAge: 10000,
      ...options
    };

    console.log('Récupération de la position...');
    const location = await Location.getCurrentPositionAsync(defaultOptions);
    
    const result = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp
    };
    
    console.log('Position obtenue:', result);
    return result;
    
  } catch (error) {
    console.error('Erreur lors de la récupération de la position:', error);
    
    let errorMessage = 'Impossible de récupérer votre position.';
    
    if (error.code === 'E_LOCATION_TIMEOUT') {
      errorMessage = 'Délai d\'attente dépassé. Vérifiez que le GPS est activé.';
    } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
      errorMessage = 'Service de localisation indisponible.';
    } else if (error.code === 'E_LOCATION_SETTINGS_UNSATISFIED') {
      errorMessage = 'Paramètres de localisation non satisfaits. Activez le GPS.';
    }
    
    Alert.alert('Erreur de géolocalisation', errorMessage, [{ text: 'OK' }]);
    return null;
  }
};

/**
 * Surveille la position en continu (pour les tâches en cours)
 * @param {Function} callback - Fonction appelée à chaque mise à jour de position
 * @param {Object} options - Options pour le suivi
 * @returns {Promise<Object>} Objet avec une méthode remove() pour arrêter le suivi
 */
export const watchLocation = async (callback, options = {}) => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const defaultOptions = {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // 10 secondes
      distanceInterval: 10, // 10 mètres
      ...options
    };

    const subscription = await Location.watchPositionAsync(
      defaultOptions,
      (location) => {
        const position = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp
        };
        callback(position);
      }
    );

    return subscription;
  } catch (error) {
    console.error('Erreur lors du suivi de position:', error);
    Alert.alert(
      'Erreur',
      'Impossible de démarrer le suivi de position.',
      [{ text: 'OK' }]
    );
    return null;
  }
};

/**
 * Formate la date actuelle pour l'API Odoo
 * @returns {string} Date au format "YYYY-MM-DD HH:MM:SS"
 */
export const formatDateForOdoo = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Obtient la position et l'heure actuelles formatées pour Odoo
 * @returns {Promise<{latitude: number, longitude: number, timestamp: string} | null>}
 */
export const getLocationAndTime = async () => {
  const location = await getCurrentLocation();
  if (!location) {
    return null;
  }
  
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: formatDateForOdoo(),
    accuracy: location.accuracy
  };
};