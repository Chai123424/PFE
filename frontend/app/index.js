import { useState, useEffect } from "react";
import { useRouter } from "expo-router";

import { View, StyleSheet, FlatList, TouchableOpacity, Text } from "react-native";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import AppointmentCard from "./components/AppointmentCard";
import BottomNavigation from "./components/BottomNavigation";
import DetailCard from "./components/DetailsCard";
import ActionButtons from "./components/ActionButtons";
import { allAppointments, filterAppointments, appointmentDetails } from "./data/appointments";

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const router = useRouter();

  useEffect(() => {
    setFilteredAppointments(filterAppointments(allAppointments, searchQuery, activeTab));
  }, [searchQuery, activeTab]);

  const handleLaunch = () => {
    if (selectedId) {
      router.push('/InfoScreen');
    }
  };

  const handleReport = (idToRemove) => {
    const updatedAppointments = filteredAppointments.filter(appointment => appointment.id !== idToRemove);
    setFilteredAppointments(updatedAppointments);
    setSelectedId(null);
  };

  const handleTransfer = () => {
    if (selectedId) {
      router.push('/TransferScreen');
    }
  };

  if (selectedId) {
    const details = appointmentDetails[selectedId];

    if (!details) {
      return (
        <View style={styles.container}>
          <Header username="Mohammed Tazi" showTransferIcon={false} onTransfer={null} />
          <TouchableOpacity onPress={() => setSelectedId(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>{"< Retour"}</Text>
          </TouchableOpacity>
          <Text style={{ color: 'red', margin: 20 }}>
            Aucune information pour cette tâche (id: {selectedId}).
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <Header username="Mohammed Tazi" showTransferIcon={true} onTransfer={handleTransfer} />
        <TouchableOpacity onPress={() => setSelectedId(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>{"< Retour"}</Text>
        </TouchableOpacity>
        <DetailCard details={details} />
        <ActionButtons onLaunch={handleLaunch} onReport={() => handleReport(selectedId)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header username="Mohammed Tazi" showTransferIcon={false} onTransfer={null} />
      <SearchBar onChangeText={setSearchQuery} />
      <FlatList
        data={filteredAppointments}
        renderItem={({ item }) => (
          <AppointmentCard appointment={item} onPress={() => setSelectedId(item.id)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  listContainer: {
    padding: 16,
  },
  backButton: {
    marginTop: 16,
    marginLeft: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
    backgroundColor: "#52AFD4",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

