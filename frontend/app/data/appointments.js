export const filterAppointments = (appointments = [], searchQuery = "", activeTab = "today") => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dateFiltered = [];

  // S'assurer que appointments est un tableau
  if (!Array.isArray(appointments)) {
    console.warn("appointments is not an array");
    return [];
  }

  if (activeTab === "today") {
    dateFiltered = appointments.filter((appointment) => {
      if (!appointment?.date_deadline) return false;
      const appointmentDate = new Date(appointment.date_deadline);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate.getTime() === today.getTime();
    });
  } else if (activeTab === "past") {
    dateFiltered = appointments.filter((appointment) => {
      if (!appointment?.date_deadline) return false;
      const appointmentDate = new Date(appointment.date_deadline);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate < today;
    }).map((appointment) => ({
      ...appointment,
      status: "Terminé",
    }));
  } else if (activeTab === "upcoming") {
    dateFiltered = appointments.filter((appointment) => {
      if (!appointment?.date_deadline) return false;
      const appointmentDate = new Date(appointment.date_deadline);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate > today;
    });
  }

  if (searchQuery.trim() === "") {
    return dateFiltered;
  } else {
    const query = searchQuery.toLowerCase();
    return dateFiltered.filter((appointment) =>
      (typeof appointment.name === "string" && appointment.name.toLowerCase().includes(query)) ||
      (typeof appointment.code === "string" && appointment.code.includes(query))
    );
  }
};

export default function AppointmentDetails({ appointment }) {
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    async function loadPartner() {
      if (appointment?.partner_id) {
        const partnerData = await fetchPartnerDetails(appointment.partner_id[0]);
        setPartner(partnerData);
      }
    }
    loadPartner();
  }, [appointment]);

  if (!appointment) {
    return <Text>Aucune donnée d'appointment</Text>;
  }

  return (
    <DetailCard appointment={appointment} partner={partner} />
  );
}

export const removeAppointment = (appointments, appointmentId, currentEmployeeId) => {
  try {
    const initialLength = appointments.length;

    const filteredAppointments = appointments.filter(appointment => {
      if (appointment.id !== appointmentId) return true;

      // Ne supprime que si employeeId différent
      if (appointment.employeeId === currentEmployeeId) {
        return true; // Garde l'appointment
      }
      return false; // Supprime l'appointment
    });

    const removed = initialLength > filteredAppointments.length;
    console.log(`Appointment ${appointmentId} ${removed ? 'supprimé' : 'non supprimé (même employé)'}`);

    return {
      success: removed,
      appointments: filteredAppointments,
      message: removed ? 'Appointment supprimé avec succès' : 'Suppression annulée : même employé'
    };
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
