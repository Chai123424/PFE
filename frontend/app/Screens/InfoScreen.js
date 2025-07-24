"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar, Button, Alert, ActivityIndicator, BackHandler } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from 'expo-file-system'
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useOdooAttachments ,getRecordNameFromOdoo,savePhotosToOdoo,stopTacheInOdoo,uploadPhotoToOdoo} from '../utils/odooApi.js' 
import { dbOperations } from '../utils/sqlite.js' 
import * as Location from 'expo-location';
import { useNetInfo } from '@react-native-community/netinfo';

export default function ProfileInfoScreen({ navigation }) {
  
  const [beforeImagePreview, setBeforeImagePreview] = useState(null)
  const [afterImagePreview, setAfterImagePreview] = useState(null)
  const [beforeImageData, setBeforeImageData] = useState(null)
  const [afterImageData, setAfterImageData] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [patientName, setPatientName] = useState("")
  const netInfo = useNetInfo()  

  // Disable swipe gestures (iOS) and back button (Android)
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        gestureEnabled: false, // Disable swipe gestures on iOS
      });
    }

    // Handle Android back button
    const onBackPress = () => {
      return true; // Prevent default back behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => subscription?.remove();
  }, [navigation]);

  useEffect(() => {
    const fetchName = async () => {
      try {
        const name = await getRecordNameFromOdoo("project.task", id); 
        setPatientName(name);
      } catch (error) {
        console.error("Erreur récupération nom du patient:", error);
      }
    };

    fetchName();
  }, [id]);
  
  useEffect(() => {
    ;(async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync()
      if (cameraStatus.status !== "granted") {
        Alert.alert("Permission denied", "Camera access is required to take photos.")
      }
    })()
  }, [])

  
  const processImage = async (imageUri, type) => {
    try {
      
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (type === "before") {
        setBeforeImagePreview(imageUri); 
        setBeforeImageData(base64); 
      } else {
        setAfterImagePreview(imageUri);
        setAfterImageData(base64);
      }

      
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      Alert.alert("Erreur", "Impossible de traiter l'image");
    }
  };

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      await processImage(result.assets[0].uri, type);
      setActiveSection(null);
    }
  }

  const takePhoto = async (type) => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
      saveToPhotos: false, 
    })

    if (!result.canceled) {
      await processImage(result.assets[0].uri, type);
      setActiveSection(null);
    }
    }

  const handleImagePress = (type) => {
    setActiveSection(activeSection === type ? null : type)
  }

  const uploadPhotoToOdooLocal = async ({ base64Image, fileName, resModel, resId }) => {
    const uid = await dbOperations?.getConfig?.('odoo_uid');
    const password = await dbOperations?.getConfig?.('odoo_password');
    const url = await dbOperations?.getConfig?.('odoo_url');
    const dbName = await dbOperations?.getConfig?.('odoo_db');

    if (!uid || !password || !url || !dbName) {
      throw new Error('Configuration Odoo manquante');
    }

    const endpoint = url.replace(/\/$/, '') + '/jsonrpc';

    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          dbName,
          parseInt(uid),
          password,
          "ir.attachment",
          "create",
          [{
            name: fileName,
            type: "binary",
            datas: base64Image,
            res_model: resModel,
            res_id: resId,
            mimetype: "image/jpeg"
          }]
        ]
      },
      id: Date.now()
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  };

  const savePhotosDirectlyToOdoo = async (resId, patientName, beforeBase64, afterBase64) => {
    let attachmentIds = [];
    let errors = [];

    const uploadImage = async (base64Data, nameSuffix) => {
      try {
        const attachmentId = await uploadPhotoToOdooLocal({
          base64Image: base64Data,
          fileName: `${patientName}_${nameSuffix}.jpg`,
          resModel: "project.task",
          resId: resId,
        });
        return { success: true, attachmentId };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    if (beforeBase64) {
      const result = await uploadImage(beforeBase64, "before");
      result.success ? attachmentIds.push(result.attachmentId) : errors.push(result.error);
    }

    if (afterBase64) {
      const result = await uploadImage(afterBase64, "after");
      result.success ? attachmentIds.push(result.attachmentId) : errors.push(result.error);
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0
        ? "Les photos ont été envoyées avec succès à Odoo."
        : "Certaines photos n'ont pas pu être envoyées.",
      attachmentIds,
      errors,
    };
  };

  const handleSaveToOdoo = async () => {
    if (!netInfo.isConnected) {
      Alert.alert("Erreur", "Pas de connexion internet. Veuillez vous connecter pour continuer.");
      return;
    }

    setIsLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error("Permission de localisation non accordée.");
      }

      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

      let attachmentIds = [];

      if (beforeImageData || afterImageData) {
        const patientName = await getRecordNameFromOdoo("project.task", id);
        const result = await savePhotosDirectlyToOdoo(id, patientName, beforeImageData, afterImageData);

        if (result.success) {
          attachmentIds = result.attachmentIds;
          
          setBeforeImageData(null);
          setAfterImageData(null);
          setBeforeImagePreview(null);
          setAfterImagePreview(null);
        } else {
          Alert.alert("Erreur", result.message);
          console.log("Erreurs détaillées:", result.errors);
          setIsLoading(false);
          return;
        }
      }

      const stopResult = await stopTacheInOdoo(id, latitude, longitude, timestamp);

      console.log("Résultat stop_tache:", stopResult);

      if (stopResult.result === true) {
        router.push({
          pathname: '/Screens/ConfirmationScreen',
          params: { 
            id,
            saved: 'true',
            attachmentIds: JSON.stringify(attachmentIds)
          }
        });
      } else if (stopResult.result === false) {
        Alert.alert("Attention", "La tâche n'a pas pu être arrêtée. Veuillez vérifier l'ID ou les timesheets.");
      } else {
        Alert.alert("Erreur", "Réponse inattendue du serveur lors de l'arrêt de la tâche.");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de terminer la tâche");
      console.error("Erreur terminaison tâche:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (type) => {
    if (type === "before") {
      setBeforeImagePreview(null);
      setBeforeImageData(null);
    } else {
      setAfterImagePreview(null);
      setAfterImageData(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
      
        
        <View style={styles.placeholder} />
      </View>

      
      <Text style={styles.profileName}>{patientName || "Chargement..."}</Text>

      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avant: </Text>
        <TouchableOpacity style={styles.imageContainer} onPress={() => handleImagePress("before")}>
          {beforeImagePreview ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: beforeImagePreview }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => removeImage("before")}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera" size={32} color="#999" />
            </View>
          )}
        </TouchableOpacity>

        {activeSection === "before" && (
          <View style={styles.buttonContainer}>
            <Button title="Choisir depuis la galerie" onPress={() => pickImage("before")} />
            <View style={{ marginVertical: 10 }} />
            <Button title="Prendre une photo" onPress={() => takePhoto("before")} />
          </View>
        )}
      </View>

      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Après: </Text>
        <TouchableOpacity style={styles.imageContainer} onPress={() => handleImagePress("after")}>
          {afterImagePreview ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: afterImagePreview }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => removeImage("after")}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera" size={32} color="#999" />
            </View>
          )}
        </TouchableOpacity>

        {activeSection === "after" && (
          <View style={styles.buttonContainer}>
            <Button title="Choisir depuis la galerie" onPress={() => pickImage("after")} />
            <View style={{ marginVertical: 10 }} />
            <Button title="Prendre une photo" onPress={() => takePhoto("after")} />
          </View>
        )}
      </View>

      
      <View style={styles.actionContainer}>
        
        <TouchableOpacity 
          style={[styles.saveButton, (isLoading || !netInfo.isConnected) && styles.disabledButton]} 
          onPress={handleSaveToOdoo}
          disabled={isLoading || !netInfo.isConnected}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>
              {netInfo.isConnected ? 'Terminé' : 'Pas de connexion'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: "#3333CC",
    fontWeight: "500",
  },
  placeholder: {
    width: 40,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3333CC",
    textAlign: "center",
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3333CC",
    marginBottom: 10,
  },
  imageContainer: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
  },
  imageWrapper: {
    position: 'relative',
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E6F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  actionContainer: {
    marginTop: "auto",
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#2E3192',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
})