
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
 * Effectue une géolocalisation inverse (coordonnées -> adresse)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string|null>} Adresse formatée ou null en cas d'erreur
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    console.log('Reverse geocoding coordinates:', { latitude, longitude });
    
    const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    
    console.log('Reverse geocoding result:', reverseGeocodedAddress);
    
    if (reverseGeocodedAddress && reverseGeocodedAddress.length > 0) {
      const address = reverseGeocodedAddress[0];
      
      
      const addressParts = [];
      
      if (address.streetNumber) {
        addressParts.push(address.streetNumber);
      }
      if (address.street) {
        addressParts.push(address.street);
      }
      if (address.city) {
        addressParts.push(address.city);
      }
      if (address.postalCode) {
        addressParts.push(address.postalCode);
      }
      if (address.region) {
        addressParts.push(address.region);
      }
      if (address.country) {
        addressParts.push(address.country);
      }
      
      const formattedAddress = addressParts.join(', ');
      console.log('Formatted address:', formattedAddress);
      
      return formattedAddress || null;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la géolocalisation inverse:', error);
    return null;
  }
};

/**
 * Obtient la position actuelle de l'utilisateur
 * @param {Object} options - Options pour la géolocalisation
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const getCurrentLocation = async (options = {}) => {
  try {
    
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    
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
 * Obtient la position actuelle avec l'adresse
 * @param {Object} options - Options pour la géolocalisation
 * @returns {Promise<{latitude: number, longitude: number, address: string} | null>}
 */
export const getCurrentLocationWithAddress = async (options = {}) => {
  try {
    const location = await getCurrentLocation(options);
    if (!location) {
      return null;
    }

    const address = await reverseGeocode(location.latitude, location.longitude);
    
    return {
      ...location,
      address: address || 'Adresse inconnue'
    };
  } catch (error) {
    console.error('Erreur getCurrentLocationWithAddress:', error);
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
      timeInterval: 10000, 
      distanceInterval: 10, 
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

/**
 * Obtient la position, l'heure et l'adresse actuelles formatées pour Odoo
 * @returns {Promise<{latitude: number, longitude: number, timestamp: string, address: string} | null>}
 */
export const getLocationTimeAndAddress = async () => {
  const location = await getCurrentLocationWithAddress();
  if (!location) {
    return null;
  }
  
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: formatDateForOdoo(),
    accuracy: location.accuracy,
    address: location.address
  };
};