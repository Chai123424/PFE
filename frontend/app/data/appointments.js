// Sample data for appointments
export const appointments = [
    { id: "1", name: "Msefer Chakir", code: "500139", type: "Entretien Piscine", time: "9:00:00", status: "En cours" },
    {
      id: "2",
      name: "Haj Benseid",
      code: "500124",
      type: "Entretien Piscine",
      time: "11:30:00",
      status: "À faire",
      distance: "2.5 km",
    },
    {
      id: "3",
      name: "Bensaid",
      code: "500004",
      type: "Entretien Piscine",
      time: "11:30:00",
      status: "À faire",
      distance: "2.5 km",
    },
    {
      id: "4",
      name: "Zouine",
      code: "500109",
      type: "Entretien Piscine",
      time: "16:00:00",
      status: "À faire",
      distance: "3.0 km",
    },
    {
      id: "5",
      name: "Said",
      code: "500009",
      type: "Entretien Piscine",
      time: "18:00:00",
      status: "À faire",
      distance: "3.0 km",
    },
    {
      id: "6",
      name: "Bennani",
      code: "500039",
      type: "Entretien Piscine",
      time: "20:00:00",
      status: "À faire",
      distance: "5.5 km",
    },
    {
      id: "7",
      name: "",
      code: "500039",
      type: "Entretien Piscine",
      time: "20:00:00",
      status: "À faire",
      distance: "5.5 km",
    },
  ]
  
  // Sample data for appointment details
  export const appointmentDetails = {
    "1": {
      name: "Msefer Chakir",
      numero: "500139",
      type: "Entretien Piscine",
      adresse: "rue 23",
      telephone: "06-66 66 66 66",
      heure: "9:00:00",
      date: "Mardi 23 juin 2024",
    },
    "2": {
      name: "Haj Benseid",
      numero: "500124",
      type: "Entretien Piscine",
      adresse: "rue 45",
      telephone: "06-77 77 77 77",
      heure: "11:30:00",
      date: "Mardi 23 juin 2024",
    },
    "3": {
      name: "Bensaid",
      numero: "500004",
      type: "Entretien Piscine",
      adresse: "rue 12",
      telephone: "06-88 88 88 88",
      heure: "11:30:00",
      date: "Mardi 23 juin 2024",
    },
    "4": {
      name: "Zouine",
      numero: "500109",
      type: "Entretien Piscine",
      adresse: "rue 78",
      telephone: "06-99 99 99 99",
      heure: "16:00:00",
      date: "Mardi 23 juin 2024",
    },
    "5": {
      name: "Said",
      numero: "500009",
      type: "Entretien Piscine",
      adresse: "rue 34",
      telephone: "06-55 55 55 55",
      heure: "18:00:00",
      date: "Mardi 23 juin 2024",
    },
    "6": {
      name: "Bennani",
      numero: "500039",
      type: "Entretien Piscine",
      adresse: "rue 56",
      telephone: "06-44 44 44 44",
      heure: "20:00:00",
      date: "Mardi 23 juin 2024",
    },
    "7": {
      name: "",
      numero: "500039",
      type: "Entretien Piscine",
      adresse: "rue 90",
      telephone: "06-33 33 33 33",
      heure: "20:00:00",
      date: "Mardi 23 juin 2024",
    },
  }
  
  
  // Sample data with dates for filtering and status
  export const allAppointments = [
    {
      id: "1",
      name: "Msefer Chakir",
      code: "500139",
      type: "Entretien Piscine",
      time: "9:00:00",
      status: "En cours",
      date: new Date(2025, 4, 20), // Today
    },
    {
      id: "2",
      name: "Haj Benseid",
      code: "500124",
      type: "Entretien Piscine",
      time: "11:30:00",
      status: "À faire",
      date: new Date(2025, 4, 20), // Today
    },
    {
      id: "3",
      name: "Bensaid",
      code: "500004",
      type: "Entretien Piscine",
      time: "11:30:00",
      status: "Terminé",
      date: new Date(2025, 4, 19), // Yesterday (past)
    },
    {
      id: "4",
      name: "Zouine",
      code: "500109",
      type: "Entretien Piscine",
      time: "16:00:00",
      status: "À faire",
      date: new Date(2025, 4, 21), // Tomorrow (upcoming)
    },
    {
      id: "5",
      name: "Said",
      code: "500009",
      type: "Entretien Piscine",
      time: "18:00:00",
      status: "À faire",
      date: new Date(2025, 4, 22), // Upcoming
    },
    {
      id: "6",
      name: "Bennani",
      code: "500039",
      type: "Entretien Piscine",
      time: "20:00:00",
      status: "Terminé",
      date: new Date(2025, 4, 18), // Past
    },
    {
      id: "7",
      name: "",
      code: "500039",
      type: "Entretien Piscine",
      time: "20:00:00",
      status: "À faire",
      date: new Date(2025, 4, 23), // Upcoming
    },
  ]
  
  export const filterAppointments = (appointments, searchQuery, activeTab) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
  
    // First filter by date category
    let dateFiltered = []
  
    if (activeTab === "today") {
      dateFiltered = appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate.getTime() === today.getTime()
      })
    } else if (activeTab === "past") {
      dateFiltered = appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate < today
      }).map((appointment) => ({
        ...appointment,
        status: "Terminé"
      }))
    } else if (activeTab === "upcoming") {
      dateFiltered = appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate > today
      })
    }
  
    // Then filter by search query
    if (searchQuery.trim() === "") {
      return dateFiltered
    } else {
      const query = searchQuery.toLowerCase()
      return dateFiltered.filter(
        (appointment) => appointment.name.toLowerCase().includes(query) || appointment.code.includes(query),
      )
    }
  }
  export default appointments;