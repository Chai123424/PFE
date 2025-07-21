import * as Location from 'expo-location';
import { Alert } from 'react-native';

// Cache for poor connectivity - keep results longer
const geocodingCache = new Map();
const MAX_CACHE_SIZE = 100;
const CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour for poor connectivity

// Simple queue without complex processing
const geocodingQueue = [];
let isProcessingQueue = false;
const THROTTLE_DELAY = 2000; // Longer delay for poor connectivity

/**
 * Clean expired cache entries
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of geocodingCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY_TIME) {
      geocodingCache.delete(key);
    }
  }
};

/**
 * Generate cache key from coordinates
 */
const generateCacheKey = (latitude, longitude) => {
  const lat = Math.round(latitude * 10000) / 10000;
  const lng = Math.round(longitude * 10000) / 10000;
  return `${lat},${lng}`;
};

/**
 * Calculate address quality score
 */
const calculateAddressQuality = (address, formattedAddress) => {
  let score = 0;
  
  // Street details
  if (address.streetNumber) score += 3;
  if (address.street) score += 3;
  
  // Check if name is a Plus Code (penalize)
  if (address.name && isPlusCode(address.name)) {
    score -= 2; // Penalize Plus Codes
  } else if (address.name && isUsefulName(address.name)) {
    score += 2; // Reward useful names
  }
  
  // Area details
  if (address.district) score += 2;
  if (address.subLocality) score += 2;
  if (address.postalCode) score += 1;
  
  // Complexity bonus
  const parts = formattedAddress.split(',').length;
  if (parts >= 4) score += 1;
  if (parts >= 6) score += 1;
  
  return score;
};

/**
 * Helper function to detect Plus Codes
 */
const isPlusCode = (text) => {
  if (!text) return false;
  // Plus codes typically follow pattern: XXXX+XX or 2X4X+MM
  const plusCodeRegex = /^[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,3}$/;
  return plusCodeRegex.test(text.replace(/\s/g, ''));
};

/**
 * Helper function to check if name is useful
 */
const isUsefulName = (name) => {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  
  // Skip if it's unnamed, plus code, or just coordinates
  if (lowerName.includes('unnamed') || 
      lowerName.includes('sans nom') ||
      isPlusCode(name) ||
      /^\d+\.?\d*,\s*\d+\.?\d*$/.test(name)) { // coordinates pattern
    return false;
  }
  
  return true;
};

/**
 * Format address with priority to details and avoid redundancy
 * Now handles Plus Codes properly
 */
const formatAddress = (address) => {
  const parts = [];
  
  // Handle street address - avoid redundancy
  let streetPart = '';
  
  // Check if name already contains the complete street information
  const hasCompleteStreetInName = address.name && 
    address.streetNumber && 
    address.street &&
    isUsefulName(address.name) &&
    address.name.includes(address.streetNumber) &&
    address.name.toLowerCase().includes(address.street.toLowerCase());
  
  if (hasCompleteStreetInName) {
    // Use name as it already contains complete street info
    streetPart = address.name;
  } else if (address.streetNumber && address.street) {
    // Combine street number and street name
    streetPart = `${address.streetNumber} ${address.street}`;
  } else if (address.street) {
    // Just street name
    streetPart = address.street;
  } else if (isUsefulName(address.name)) {
    // Use name as fallback only if it's useful
    streetPart = address.name;
  }
  
  if (streetPart) {
    parts.push(streetPart);
  }
  
  // Add district/sublocality
  if (address.district) parts.push(address.district);
  if (address.subLocality) parts.push(address.subLocality);
  
  // Add city (required)
  if (address.city) parts.push(address.city);
  
  // Add postal code if available
  if (address.postalCode) parts.push(address.postalCode);
  
  // Add country
  if (address.country) parts.push(address.country);
  
  // If we end up with no street info, add a more descriptive prefix
  if (parts.length > 0 && !streetPart) {
    // Add a general area indicator if no specific street
    if (address.district || address.subLocality) {
      // We have some area info, which is good enough
    } else {
      // Very generic location
      parts[0] = `Zone de ${parts[0]}`;
    }
  }
  
  // Note: Removed region/state as per requirement
  
  return parts.join(', ');
};

/**
 * Single reverse geocode attempt
 */
const singleReverseGeocode = async (latitude, longitude) => {
  try {
    console.log(' Attempting reverse geocoding...');
    
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    
    if (results && results.length > 0) {
      const address = results[0];
      const formattedAddress = formatAddress(address);
      const quality = calculateAddressQuality(address, formattedAddress);
      
      return {
        address: formattedAddress,
        quality,
        raw: address
      };
    }
    
    return null;
  } catch (error) {
    console.error(' Geocoding attempt failed:', error);
    throw error;
  }
};

/**
 * Process geocoding queue with throttling
 */
const processGeocodingQueue = async () => {
  if (isProcessingQueue || geocodingQueue.length === 0) return;
  
  isProcessingQueue = true;
  console.log(`Processing ${geocodingQueue.length} queued requests...`);
  
  while (geocodingQueue.length > 0) {
    const { latitude, longitude, resolve, reject, maxRetries } = geocodingQueue.shift();
    
    try {
      const result = await reverseGeocodeWithRetries(latitude, longitude, maxRetries, false);
      resolve(result);
    } catch (error) {
      reject(error);
    }
    
    // Wait between requests for poor connectivity
    if (geocodingQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
    }
  }
  
  isProcessingQueue = false;
  console.log('Queue processing completed');
};

/**
 * Reverse geocode with retries - optimized for poor connectivity
 * Updated to handle complete failure case
 */
const reverseGeocodeWithRetries = async (latitude, longitude, maxRetries = 5, useQueue = true) => {
  if (useQueue) {
    return new Promise((resolve, reject) => {
      geocodingQueue.push({ latitude, longitude, resolve, reject, maxRetries });
      processGeocodingQueue();
    });
  }
  
  let bestResult = null;
  let bestScore = 0;
  let lastError = null;
  
  console.log(` Starting geocoding with ${maxRetries} retries for poor connectivity`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
      
      const result = await singleReverseGeocode(latitude, longitude);
      
      if (result) {
        console.log(`Quality: ${result.quality}, Address: "${result.address}"`);
        
        if (result.quality > bestScore) {
          bestResult = result;
          bestScore = result.quality;
        }
        
        // For poor connectivity, accept good results quickly
        if (result.quality >= 6) {
          console.log(' High quality result - stopping retries');
          break;
        }
        
        // Accept medium quality after half the attempts
        if (result.quality >= 4 && attempt >= Math.ceil(maxRetries / 2)) {
          console.log('Acceptable quality result - stopping retries');
          break;
        }
      }
      
      // Progressive delay for poor connectivity
      if (attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 8000); // Max 8s for poor connectivity
        console.log(`Waiting ${delay}ms for poor connectivity...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      // Longer delays on errors for poor connectivity
      if (attempt < maxRetries) {
        const delay = Math.min(3000 * Math.pow(2, attempt - 1), 15000); // Max 15s
        console.log(`Error delay: ${delay}ms for poor connectivity...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  if (bestResult) {
    console.log(`Best result (score: ${bestScore}): "${bestResult.address}"`);
    return bestResult; // Return the complete result object
  }
  
  console.error('All attempts failed:', lastError?.message);
  // Don't throw error - let the calling function handle the null result
  return null; // This will cause "Adresse inaccessible" to be returned
};

/**
 * Request location permission
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
    console.error('Permission error:', error);
    return false;
  }
};

/**
 * Main reverse geocoding function with cache and retries
 * Now returns "Adresse inaccessible" when geocoding fails
 */
export const reverseGeocode = async (latitude, longitude, options = {}) => {
  const {
    maxRetries = 5,
    useCache = true,
    forceRefresh = false
  } = options;
  
  try {
    console.log('Starting geocoding for poor connectivity');
    
    cleanExpiredCache();
    
    const cacheKey = generateCacheKey(latitude, longitude);
    
    // Check cache first - critical for poor connectivity
    if (useCache && !forceRefresh && geocodingCache.has(cacheKey)) {
      const cached = geocodingCache.get(cacheKey);
      console.log(' Using cached result (saves network):', cached.address);
      return cached.address;
    }
    
    // Perform geocoding with retries - get the complete result object
    const result = await reverseGeocodeWithRetries(latitude, longitude, maxRetries);
    
    // Cache successful results - important for poor connectivity
    if (useCache && result && result.address) {
      geocodingCache.set(cacheKey, {
        address: result.address,
        timestamp: Date.now(),
        quality: result.quality
      });
      
      console.log('Cached for poor connectivity (quality:', result.quality, ')');
      
      // Manage cache size
      if (geocodingCache.size > MAX_CACHE_SIZE) {
        const oldestKey = geocodingCache.keys().next().value;
        geocodingCache.delete(oldestKey);
      }
    }
    
    return result ? result.address : 'Adresse inaccessible';
    
  } catch (error) {
    console.error(' Geocoding failed completely:', error);
    
    // For poor connectivity, return expired cache as last resort
    if (useCache) {
      const cacheKey = generateCacheKey(latitude, longitude);
      if (geocodingCache.has(cacheKey)) {
        const cached = geocodingCache.get(cacheKey);
        console.log(' Using expired cache as fallback for poor connectivity');
        return cached.address;
      }
    }
    
    // Return "Adresse inaccessible" instead of null when all fails
    return 'Adresse inaccessible';
  }
};

/**
 * Get current location with longer timeouts for poor connectivity
 */
export const getCurrentLocation = async (options = {}) => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    // Longer timeouts for poor connectivity
    const defaultOptions = {
      accuracy: Location.Accuracy.BestForNavigation,
      timeout: 30000, // 30 seconds for poor connectivity
      maximumAge: 10000, // 10 seconds cache
      ...options
    };

    console.log('Getting location (poor connectivity mode)...');
    
    const location = await Location.getCurrentPositionAsync(defaultOptions);
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp
    };
    
  } catch (error) {
    console.error('Location error:', error);
    
    let errorMessage = 'Impossible de récupérer votre position.';
    if (error.code === 'E_LOCATION_TIMEOUT') {
      errorMessage = 'Connexion lente détectée. Vérifiez votre signal GPS et réseau.';
    }
    
    Alert.alert('Erreur de géolocalisation', errorMessage, [{ text: 'OK' }]);
    return null;
  }
};

/**
 * Get current location with address - optimized for poor connectivity
 * Now returns "Adresse inaccessible" when geocoding fails
 */
export const getCurrentLocationWithAddress = async (options = {}) => {
  try {
    console.log(' Getting location with address (poor connectivity)...');
    
    const location = await getCurrentLocation(options);
    if (!location) return null;

    // Use cache aggressively for poor connectivity
    const address = await reverseGeocode(location.latitude, location.longitude, {
      maxRetries: 3, // Fewer retries to save time
      useCache: true
    });
    
    return {
      ...location,
      address: address || 'Adresse inaccessible' // Double fallback
    };
  } catch (error) {
    console.error('Error getting location with address:', error);
    return null;
  }
};

/**
 * Format date for Odoo
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
 * Get location, time and address for Odoo - poor connectivity optimized
 * Now handles "Adresse inaccessible" case
 */
export const getLocationTimeAndAddress = async (options = {}) => {
  console.log('Getting location, time and address for Odoo (poor connectivity)...');
  
  const location = await getCurrentLocationWithAddress(options);
  if (!location) return null;
  
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: formatDateForOdoo(),
    accuracy: location.accuracy,
    address: location.address // Will be "Adresse inaccessible" if geocoding failed
  };
};

/**
 * Clear geocoding cache
 */
export const clearGeocodingCache = () => {
  geocodingCache.clear();
  console.log('Cache cleared');
};

/**
 * Get cache statistics - useful for poor connectivity monitoring
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [key, value] of geocodingCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY_TIME) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  }
  
  return {
    total: geocodingCache.size,
    valid: validEntries,
    expired: expiredEntries,
    hitRate: geocodingCache.size > 0 ? (validEntries / geocodingCache.size * 100).toFixed(1) + '%' : '0%'
  };
};