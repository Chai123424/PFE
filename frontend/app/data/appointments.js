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