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

  // Base domain filters with the new logic for employee assignment
  let domain = [
    ["is_stop_maintenance", "=", false],
    ["active", "=", true], // Active filter to exclude archived tasks
    "|", // OR operator for the two employee conditions
    "&", // AND operator for first condition
    ["employee_id", "=", employeeId],
    ["change_technician", "=", false],
    "&", // AND operator for second condition  
    ["employee2_id", "=", employeeId],
    ["change_technician", "=", true]
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
          "employee_id", "employee2_id", "change_technician", "partner_phone", 
          "partner_address_complete", "state", "timer_state"
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
    
    // Enhanced client-side filtering with debugging for the new logic
    const filteredTasks = result.filter(task => {
      const isStopMaintenanceValid = task.is_stop_maintenance === false;
      const isActiveValid = task.active !== false;
      
      // New employee assignment logic
      const isEmployeeCondition1 = task.employee_id && 
                                  task.employee_id[0] === employeeId && 
                                  task.change_technician === false;
      
      const isEmployeeCondition2 = task.employee2_id && 
                                  task.employee2_id[0] === employeeId && 
                                  task.change_technician === true;
      
      const isEmployeeValid = isEmployeeCondition1 || isEmployeeCondition2;
      
      if (!isStopMaintenanceValid) {
        console.log(`Task ${task.id} filtered out due to is_stop_maintenance:`, task.is_stop_maintenance);
      }
      if (!isEmployeeValid) {
        console.log(`Task ${task.id} filtered out due to employee assignment:`, {
          employee_id: task.employee_id,
          employee2_id: task.employee2_id,
          change_technician: task.change_technician,
          currentEmployeeId: employeeId,
          condition1Valid: isEmployeeCondition1,
          condition2Valid: isEmployeeCondition2
        });
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
        ["id", "name", "date_deadline", "employee_id", "is_stop_maintenance","partner_name","partner_id","partner_phone","partner_address_complete" , "timer_state"] 
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
            ['job_title', '=', 'Technicien'] 
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

// NEW: Report task function
export const reportTask = async (taskId, description = "") => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  if (!uid || !password || !url || !dbName) {
    console.log('Missing Odoo configuration');
    return { success: false, error: "Configuration Odoo manquante" };
  }

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
        "reported_pool_maintenance_api",
        parseInt(taskId),
        description
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
    console.log('Report task API response:', data);
    
    if (data.error) {
      console.error('Report task API error:', data.error);
      return { success: false, error: data.error };
    }
    
    // The backend method returns the result directly
    return data.result || { success: false, error: "Réponse inattendue du serveur" };
  } catch (error) {
    console.error("Erreur reportTask:", error);
    return { success: false, error: "Erreur de connexion" };
  }
};

export const callOdooActionChangeSingleTechnician = async (taskId, technicianId) => {
  console.log('[Technician Change] Starting process...', { taskId, technicianId });

  // Enhanced validation with better error messages
  if (!taskId || taskId === 'undefined' || taskId === 'null') {
    console.error('[Technician Change] taskId is invalid:', { taskId, type: typeof taskId });
    return { success: false, error: "ID de tâche requis et valide" };
  }

  if (!technicianId || technicianId === 'undefined' || technicianId === 'null') {
    console.error('[Technician Change] technicianId is invalid:', { technicianId, type: typeof technicianId });
    return { success: false, error: "ID technicien requis et valide" };
  }

  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  if (!uid || !password || !url || !dbName) {
    console.error('[Technician Change] Missing Odoo configuration:', {
      hasUid: !!uid,
      hasPassword: !!password,
      hasUrl: !!url,
      hasDbName: !!dbName
    });
    return { success: false, error: "Configuration Odoo manquante" };
  }

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
  console.log('[Technician Change] Using endpoint:', endpoint);
  
  // More robust parsing with better validation
  let parsedTaskId, parsedTechnicianId;
  
  try {
    // Handle string numbers and actual numbers
    parsedTaskId = typeof taskId === 'string' ? parseInt(taskId.trim()) : parseInt(taskId);
    parsedTechnicianId = typeof technicianId === 'string' ? parseInt(technicianId.trim()) : parseInt(technicianId);
    
    if (isNaN(parsedTaskId) || parsedTaskId <= 0) {
      throw new Error(`Invalid taskId: ${taskId} -> ${parsedTaskId}`);
    }
    
    if (isNaN(parsedTechnicianId) || parsedTechnicianId <= 0) {
      throw new Error(`Invalid technicianId: ${technicianId} -> ${parsedTechnicianId}`);
    }
    
  } catch (parseError) {
    console.error('[Technician Change] ID parsing error:', parseError);
    return { 
      success: false, 
      error: `IDs invalides: ${parseError.message}` 
    };
  }

  console.log('[Technician Change] Parsed IDs:', {
    originalTaskId: taskId,
    parsedTaskId,
    originalTechnicianId: technicianId,
    parsedTechnicianId
  });

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
        parsedTaskId,
        parsedTechnicianId
      ]
    },
    id: Date.now()
  };

  console.log('[Technician Change] Full payload:', JSON.stringify(payload, null, 2));

  try {
    console.log('[Technician Change] Sending request to Odoo...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Technician Change] HTTP error:', response.status, response.statusText);
      return { 
        success: false, 
        error: `Erreur HTTP: ${response.status} ${response.statusText}` 
      };
    }

    console.log('[Technician Change] Received response, parsing JSON...');
    const data = await response.json();
    console.log('[Technician Change] Full API response:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error('[Technician Change] API error:', {
        error: data.error,
        message: data.error.message,
        data: data.error.data,
        code: data.error.code
      });
      return { 
        success: false, 
        error: data.error.data?.message || data.error.message || 'Erreur inconnue',
        fullError: data.error
      };
    }
    
    // Check if result indicates failure
    if (data.result && typeof data.result === 'object' && data.result.success === false) {
      console.error('[Technician Change] Operation failed:', data.result.message);
      return { 
        success: false, 
        error: data.result.message || 'Opération échouée',
        fullResponse: data
      };
    }
    
    if (!data.result) {
      console.warn('[Technician Change] Empty response from server');
      return { 
        success: false, 
        error: 'Réponse vide du serveur',
        fullResponse: data
      };
    }

    console.log('[Technician Change] Success:', data.result);
    return { 
      success: true,
      result: data.result,
      message: 'Technicien modifié avec succès',
      fullResponse: data
    };
  } catch (error) {
    console.error('[Technician Change] Network/processing error:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    return { 
      success: false, 
      error: `Erreur réseau: ${error.message}`,
      fullError: error
    };
  }
};