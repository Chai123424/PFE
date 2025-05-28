import { dbOperations } from './sqlite';
import odooJsonRpc from './OddooJsonRpc'; 


const fetchPartnerDetails = async (partnerId) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';

  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute",
      args: [
        dbName,
        parseInt(uid),
        password,
        "res.partner",
        "read",
        [parseInt(partnerId)],
        ["partner_name", "phone", "mobile", "street", "street2", "city", "zip", "state_id", "country_id", "email", "company_name", "parent_id", "customer_rank"]

      ]
    },
    id: Date.now()
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Partner details API response:', data);
    
    if (data.error) {
      console.error('Partner API error:', data.error);
      return null;
    }
    
    return data.result?.[0] || null;
  } catch (error) {
    console.error("Erreur fetchPartnerDetails:", error);
    return null;
  }
};

export const fetchOdooTasks = async (searchQuery, activeTab) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  console.log('Config values:', { uid, password: password ? 'EXISTS' : 'MISSING', url, dbName });

  if (!uid || !password || !url || !dbName) {
    console.log('Missing config, returning empty array');
    return [];
  }

  // First, get the employee ID associated with this user
  let employeeId = null;
  try {
    const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
    const userPayload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute",
        args: [
          dbName,
          parseInt(uid),
          password,
          "res.users",
          "read",
          [parseInt(uid)],
          ["employee_id"] 
        ]
      },
      id: Date.now()
    };

    const userResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload)
    });
    
    const userData = await userResponse.json();
    if (userData.result && userData.result[0] && userData.result[0].employee_id) {
      employeeId = userData.result[0].employee_id[0]; // [id, name] format for many2one
      console.log('Found employee ID:', employeeId);
    } else {
      console.log('No employee ID found in user data:', userData);
    }
  } catch (e) {
    console.error('Failed to fetch employee ID:', e);
  }

  if (!employeeId) {
    console.log('No employee ID found for this user');
    return [];
  }

  // Base domain filters
  let domain = [
    ["is_stop_maintenance", "=", false],
    ["employee_id", "=", employeeId],
    ["active", "=", true] // Added active filter to exclude archived tasks
  ];
  
  // Add search filter if provided
  if (searchQuery && searchQuery.trim()) {
    domain.push(["name", "ilike", searchQuery.trim()]);
  }
  
  // Date filters based on active tab
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  if (activeTab === 'today') {
    domain.push(['date_deadline', '>=', todayStr]);
    domain.push(['date_deadline', '<=', todayStr + ' 23:59:59']);
  } else if (activeTab === 'upcoming') {
    domain.push(['date_deadline', '>', todayStr]);
  } else if (activeTab === 'past') {
    domain.push(['date_deadline', '<', todayStr]);
  }

  console.log('Final search domain:', JSON.stringify(domain, null, 2));

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute",
      args: [
        dbName,
        parseInt(uid),
        password,
        "project.task",
        "search_read",
        domain,
        [
          "id", "name", "date_deadline", "partner_id", "date_assign", 
          "partner_name", "stage_id", "project_id", "is_stop_maintenance", 
          "employee_id", "partner_phone", "partner_address_complete",
          "state"
        ]
      ]
    },
    id: Date.now()
  };

  console.log('API payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log('API response:', data);
    
    if (data.error) {
      console.error('Odoo API error:', data.error);
      return [];
    }
    
    const result = data.result || [];
    console.log('Raw tasks from API:', result);
    
    // Enhanced client-side filtering with debugging
    const filteredTasks = result.filter(task => {
      const isStopMaintenanceValid = task.is_stop_maintenance === false;
      const isEmployeeValid = task.employee_id && task.employee_id[0] === employeeId;
      const isActiveValid = task.active !== false;
      
      if (!isStopMaintenanceValid) {
        console.log(`Task ${task.id} filtered out due to is_stop_maintenance:`, task.is_stop_maintenance);
      }
      if (!isEmployeeValid) {
        console.log(`Task ${task.id} filtered out due to employee mismatch:`, task.employee_id);
      }
      if (!isActiveValid) {
        console.log(`Task ${task.id} filtered out due to inactive status`);
      }
      
      return isStopMaintenanceValid && isEmployeeValid && isActiveValid;
    });
    
    console.log('Filtered tasks count:', filteredTasks.length);
    console.log('Sample filtered task:', filteredTasks[0]);
    
    return filteredTasks;
  } catch (e) {
    console.error('Failed to fetch tasks from Odoo:', e);
    return [];
  }
};
export const fetchOdooUserInfo = async () => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');
  
  if (!uid || !password || !url || !dbName) return null;

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute",
      args: [
        dbName,
        parseInt(uid),
        password,
        "res.users",
        "read",
        [parseInt(uid)],
        ["name", "login", "email", "employee_id"] 
      ]
    },
    id: Date.now()
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return data.result && data.result[0] ? data.result[0] : null;
  } catch (e) {
    console.error('Failed to fetch user info from Odoo:', e);
    return null;
  }
};


export const fetchTaskById = async (taskId) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';

  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute",
      args: [
        dbName,
        parseInt(uid),
        password,
        "project.task",
        "read",
        [parseInt(taskId)],
        ["id", "name", "date_deadline", "employee_id", "is_stop_maintenance","partner_name","partner_id","partner_phone","partner_address_complete"] 
      ]
    },
    id: Date.now()
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.result?.[0] || null; 
  } catch (error) {
    console.error("Erreur fetchTaskById:", error);
    return null;
  }
};


export const transferAppointmentToTechnician = async (taskId, technicianUserId) => {
  if (!technicianUserId || isNaN(parseInt(technicianUserId))) {
    throw new Error("technicianEmployeeId invalide ou manquant");
  }
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';

  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute",
      args: [
        dbName,
        parseInt(uid),
        password,
        "project.task",
        "write",
         [parseInt(taskId)],
        { user_id: parseInt(technicianUserId) }
      ]
    },
    id: Date.now()
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.error) {
      console.error("Erreur complète Odoo:", data.error);
      throw new Error(data.error.message || 'Transfer failed');
    }

    return { success: true, result: data.result };
  } catch (error) {
    console.error("Erreur lors du transfert Odoo:", error);
    throw error;
  }
};

// Fixed fetchTechniciansById function (renamed for clarity)
export const fetchTechniciansById = async () => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  if (!uid || !password || !url || !dbName) {
    console.log('Missing Odoo configuration');
    return { currentTechnician: null, availableTechnicians: [] };
  }

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';

  try {
    // First, get current user's employee info
    const currentUserPayload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute",
        args: [
          dbName,
          parseInt(uid),
          password,
          "res.users",
          "read",
          [parseInt(uid)],
          ["employee_id", "name"]
        ]
      },
      id: Date.now()
    };

    const currentUserResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentUserPayload),
    });

    const currentUserData = await currentUserResponse.json();
    let currentTechnician = null;
    let currentEmployeeId = null;

    if (currentUserData.result && currentUserData.result[0] && currentUserData.result[0].employee_id) {
      currentEmployeeId = currentUserData.result[0].employee_id[0];
      
      // Get current employee details
      const currentEmployeePayload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute",
          args: [
            dbName,
            parseInt(uid),
            password,
            "hr.employee",
            "read",
            [currentEmployeeId],
            ['id', 'name', 'job_title']

          ]
        },
        id: Date.now()
      };

      const currentEmployeeResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentEmployeePayload),
      });

      const currentEmployeeData = await currentEmployeeResponse.json();
      if (currentEmployeeData.result && currentEmployeeData.result[0]) {
        currentTechnician = currentEmployeeData.result[0];
      }
    }

    // Get all technicians (excluding "Aide Technicien")
    const allTechniciansPayload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute",
        args: [
          dbName,
          parseInt(uid),
          password,
          "hr.employee",
          "search_read",
          [
            ['job_title', '=', 'Technicien'] // Exact match for "Technicien" only
          ], 
          ['id', 'name', 'job_title', 'user_id'] 
        ]
      },
      id: Date.now()
    };

    const allTechniciansResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allTechniciansPayload),
    });

    const allTechniciansData = await allTechniciansResponse.json();
    
    if (allTechniciansData.error) {
      console.error('Odoo API error:', allTechniciansData.error);
      return { currentTechnician, availableTechnicians: [] };
    }
    
    const allTechnicians = allTechniciansData.result || [];
    
    // Filter out current technician from available list
    const availableTechnicians = currentEmployeeId 
      ? allTechnicians.filter(tech => tech.id !== currentEmployeeId)
      : allTechnicians;
    
    return {
      currentTechnician,
      availableTechnicians
    };
    
  } catch (error) {
    console.error('Erreur fetchTechniciansById:', error);
    return { currentTechnician: null, availableTechnicians: [] };
  }
};

// Fonction pour appeler la méthode Odoo action_change_technician
export const callOdooActionChangeTechnician = async (taskId, primaryTechnicianId, secondaryTechnicianId = null) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';

  // Préparer les paramètres pour la méthode Odoo
  const methodParams = {
    technician_id: primaryTechnicianId ? parseInt(primaryTechnicianId) : null,
    secondary_technician_id: secondaryTechnicianId ? parseInt(secondaryTechnicianId) : null
  };

  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute",
      args: [
        dbName,
        parseInt(uid),
        password,
        "project.task",  // Modèle où se trouve votre méthode
        "action_change_technician",  // Nom de votre méthode Odoo
        [parseInt(taskId)],  // ID de la tâche
        methodParams  // Paramètres de la méthode
      ]
    },
    id: Date.now()
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Odoo API error:', data.error);
      throw new Error(data.error.message || 'Action change technician failed');
    }
    
    console.log('Résultat de action_change_technician:', data.result);
    
    return {
      success: true,
      result: data.result,
      primaryTechnicianId,
      secondaryTechnicianId
    };
  } catch (error) {
    console.error("Erreur lors de l'appel à action_change_technician:", error);
    throw error;
  }
};

// Alternative si la méthode attend les paramètres différemment
export const callOdooActionChangeTechnicianAlt = async (taskId, primaryTechnicianId, secondaryTechnicianId = null) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';

  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute",
      args: [
        dbName,
        parseInt(uid),
        password,
        "project.task",
        "action_change_technician",
        [parseInt(taskId)],  // IDs des enregistrements
        parseInt(primaryTechnicianId),  // Premier paramètre
        secondaryTechnicianId ? parseInt(secondaryTechnicianId) : false  // Deuxième paramètre
      ]
    },
    id: Date.now()
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Odoo API error:', data.error);
      throw new Error(data.error.message || 'Action change technician failed');
    }
    
    return {
      success: true,
      result: data.result,
      primaryTechnicianId,
      secondaryTechnicianId
    };
  } catch (error) {
    console.error("Erreur lors de l'appel à action_change_technician:", error);
    throw error;
  }
};

// Version pour un seul technicien (si la méthode ne prend qu'un paramètre)
export const callOdooActionChangeSingleTechnician = async (taskId, technicianId) => {
  console.log('=== API CALL ===');
  console.log('taskId:', taskId, 'technicianId:', technicianId);
  
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';

  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute",
      args: [
        dbName,
        parseInt(uid),
        password,
        "project.task",
        "action_change_technician",
        [parseInt(taskId)],  
        parseInt(technicianId)
      ]
    },
    id: Date.now()
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error('Odoo API error:', data.error);
      throw new Error(data.error.message || 'Action change technician failed');
    }

    // Vérifier si la réponse contient un résultat
    if (data.result && data.result.success === false) {
      throw new Error(data.result.message || 'Transfert échoué côté Odoo');
    }
    
    return {
      success: true,
      result: data.result,
      technicianId
    };
  } catch (error) {
    console.error("Erreur lors de l'appel à action_change_technician:", error);
    throw error;
  }
};