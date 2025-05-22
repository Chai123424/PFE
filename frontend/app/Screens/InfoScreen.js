"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar, Button, Alert } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

export default function ProfileInfoScreen({ navigation }) {
  const [beforeImage, setBeforeImage] = useState(null)
  const [afterImage, setAfterImage] = useState(null)
  const [activeSection, setActiveSection] = useState(null) // 'before' or 'after'
  const router = useRouter()

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
      setActiveSection(null) // Hide buttons after selection
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
      setActiveSection(null) // Hide buttons after selection
    }
  }

  const handleImagePress = (type) => {
    // Toggle active section
    setActiveSection(activeSection === type ? null : type)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#3333CC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>informations</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Profile Name */}
      <Text style={styles.profileName}>Msefer Chakir</Text>

      {/* Before Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avant:</Text>
        <TouchableOpacity style={styles.imageContainer} onPress={() => handleImagePress("before")}>
          {beforeImage ? (
            <Image source={{ uri: beforeImage }} style={styles.image} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera" size={32} color="#999" />
            </View>
          )}
        </TouchableOpacity>

        {/* Camera buttons for Before section */}
        {activeSection === "before" && (
          <View style={styles.buttonContainer}>
            <Button title="Pick an image from camera roll" onPress={() => pickImage("before")} />
            <View style={{ marginVertical: 10 }} />
            <Button title="Take a photo" onPress={() => takePhoto("before")} />
          </View>
        )}
      </View>

      {/* After Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Après:</Text>
        <TouchableOpacity style={styles.imageContainer} onPress={() => handleImagePress("after")}>
          {afterImage ? (
            <Image source={{ uri: afterImage }} style={styles.image} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera" size={32} color="#999" />
            </View>
          )}
        </TouchableOpacity>

        {/* Camera buttons for After section */}
        {activeSection === "after" && (
          <View style={styles.buttonContainer}>
            <Button title="Pick an image from camera roll" onPress={() => pickImage("after")} />
            <View style={{ marginVertical: 10 }} />
            <Button title="Take a photo" onPress={() => takePhoto("after")} />
          </View>
        )}
      </View>

      {/* Finish Button */}
      <TouchableOpacity style={styles.finishButton} onPress={() => router.push('ConfirmationScreen')}>
        <Text style={styles.finishButtonText}>Terminé</Text>
      </TouchableOpacity>
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
    width: 40, // To balance the header
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
  finishButton: {
    backgroundColor: "#3333CC",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 20,
    width: "60%",
    alignSelf: "center",
  },
  finishButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
