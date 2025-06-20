"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar, Button, Alert, ActivityIndicator } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useOdooAttachments ,getRecordNameFromOdoo,savePhotosToOdoo,stopTacheInOdoo} from '../utils/odooApi.js' 
import * as Location from 'expo-location';
import { useNetInfo } from '@react-native-community/netinfo';  

export default function ProfileInfoScreen({ navigation }) {
  const [beforeImage, setBeforeImage] = useState(null)
  const [afterImage, setAfterImage] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [patientName, setPatientName] = useState("")
  const netInfo = useNetInfo()  

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

  const pickImage = async (type) => {
    const setImageFunction = type === "before" ? setBeforeImage : setAfterImage

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setImageFunction(result.assets[0].uri)
      setActiveSection(null)
    }
  }

  const takePhoto = async (type) => {
    const setImageFunction = type === "before" ? setBeforeImage : setAfterImage

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setImageFunction(result.assets[0].uri)
      setActiveSection(null)
    }
  }

  const handleImagePress = (type) => {
    setActiveSection(activeSection === type ? null : type)
  }

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

      if (beforeImage || afterImage) {
        const patientName = await getRecordNameFromOdoo("project.task", id);
        const result = await savePhotosToOdoo(id, patientName, beforeImage, afterImage);

        if (result.success) {
          attachmentIds = result.attachmentIds;
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
        Alert.alert("Succès", "Tâche terminée avec succès.", [
          {
            text: "OK",
            onPress: () => {
              router.push({
                pathname: '/Screens/ConfirmationScreen',
                params: { 
                  id,
                  saved: 'true',
                  attachmentIds: JSON.stringify(attachmentIds)
                }
              });
            }
          }
        ]);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#3333CC" />
        </TouchableOpacity>
        
        <View style={styles.placeholder} />
      </View>

      
      <Text style={styles.profileName}>{patientName || "Chargement..."}</Text>

      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avant: </Text>
        <TouchableOpacity style={styles.imageContainer} onPress={() => handleImagePress("before")}>
          {beforeImage ? (
            <Image source={{ uri: beforeImage }} style={styles.image} />
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
          {afterImage ? (
            <Image source={{ uri: afterImage }} style={styles.image} />
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
  buttonContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  actionContainer: {
    marginTop: "auto",
    marginBottom: 20,
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