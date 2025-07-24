import { dbOperations } from './sqlite';
import odooJsonRpc from './OddooJsonRpc'; 
import * as FileSystem from 'expo-file-system';
import { getLocationAndTime, getLocationTimeAndAddress, reverseGeocode } from './locationUtils';

// UTILITY FUNCTION: Create consistent timestamp format for Odoo
const formatTimestampForOdoo = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

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
      employeeId = userData.result[0].employee_id[0]; 
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

  let domain = [
    ["is_stop_maintenance", "=", false],
    ["active", "=", true], 
    "|", 
    "&", 
    ["employee_id", "=", employeeId],
    ["change_technician", "=", false],
    "&",   
    ["employee2_id", "=", employeeId],
    ["change_technician", "=", true]
  ];
  
  if (searchQuery && searchQuery.trim()) {
    domain.push(["name", "ilike", searchQuery.trim()]);
  }
  
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
  
    const filteredTasks = result.filter(task => {
      const isStopMaintenanceValid = task.is_stop_maintenance === false;
      const isActiveValid = task.active !== false;
  
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
    
    return data.result || { success: false, error: "Réponse inattendue du serveur" };
  } catch (error) {
    console.error("Erreur reportTask:", error);
    return { success: false, error: "Erreur de connexion" };
  }
};

export const callOdooActionChangeSingleTechnician = async (taskId, technicianId) => {
  console.log('[Technician Change] Starting process...', { taskId, technicianId });

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
  
  let parsedTaskId, parsedTechnicianId;
  
  try {
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

export const uploadPhotoToOdoo = async ({ base64Image, fileName, resModel, resId }) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

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

export const savePhotosToOdoo = async (resId, patientName, beforeImageUri, afterImageUri) => {
  let attachmentIds = [];
  let errors = [];

  const processImage = async (uri, nameSuffix) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const attachmentId = await uploadPhotoToOdoo({
        base64Image: base64,
        fileName: `${patientName}_${nameSuffix}.jpg`,
        resModel: "project.task",
        resId: resId,
      });

      return { success: true, attachmentId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  if (beforeImageUri) {
    const result = await processImage(beforeImageUri, "before");
    result.success ? attachmentIds.push(result.attachmentId) : errors.push(result.error);
  }

  if (afterImageUri) {
    const result = await processImage(afterImageUri, "after");
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

export const cleanupTempFiles = async () => {
  try {
    const cacheDirectory = FileSystem.cacheDirectory;
    if (cacheDirectory) {
      const files = await FileSystem.readDirectoryAsync(cacheDirectory);
      const imageFiles = files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.jpeg') || 
        file.toLowerCase().endsWith('.png')
      );
      
      for (const file of imageFiles) {
        await FileSystem.deleteAsync(`${cacheDirectory}${file}`, { idempotent: true });
      }
    }
  } catch (error) {
    console.log("Erreur lors du nettoyage:", error);
  }
};

export const getRecordNameFromOdoo = async (model, id) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

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
        model,
        "read",
        [[parseInt(id)]],
        { fields: ["partner_name"] }
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
      throw new Error(data.error.message);
    }

    if (data.result.length > 0) {
      return data.result[0].partner_name || "";
    }

    return "";
  } catch (error) {
    console.error("Erreur lors de la récupération du nom:", error);
    throw error;
  }
};

export const startTaskInOdoo = async (taskId) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  if (!uid || !password || !url || !dbName) {
    console.log('Missing Odoo configuration');
    return { success: false, error: "Configuration Odoo manquante" };
  }

  console.log('Fetching current location, time and address...');
  const locationData = await getLocationTimeAndAddress();
  if (!locationData) {
    console.error('Failed to get location information');
    return { success: false, error: "Impossible d'obtenir la localisation" };
  }

  let formattedTimestamp = locationData.timestamp;
  if (typeof locationData.timestamp === 'string' && locationData.timestamp.includes('T')) {
    const date = new Date(locationData.timestamp);
    formattedTimestamp = formatTimestampForOdoo(date);
  } else if (typeof locationData.timestamp === 'string') {
    formattedTimestamp = locationData.timestamp;
  } else {
    formattedTimestamp = formatTimestampForOdoo(new Date(locationData.timestamp));
  }

  console.log('Location details:', {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    accuracy: locationData.accuracy,
    originalTimestamp: locationData.timestamp,
    formattedTimestamp: formattedTimestamp,
    address: locationData.address
  });

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
        "lance_tache",
        parseInt(taskId),
        locationData.latitude,
        locationData.longitude,
        formattedTimestamp 
      ]
    },
    id: Date.now()
  };

  console.log('Sending start task request with payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Start task API response:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error('Start task API error:', data.error);
      return { success: false, error: data.error.data?.message || data.error.message || 'Erreur inconnue' };
    }
    
    console.log('Fetching updated task information to verify timer_state...');
    const updatedTask = await fetchTaskById(taskId);
    console.log('Updated task details:', {
      timer_state: updatedTask?.timer_state,
      location: updatedTask ? {
        latitude: updatedTask.x_latitude,
        longitude: updatedTask.x_longitude,
        timestamp: updatedTask.x_start_date
      } : null
    });
    
    return { 
      success: data.result === true,
      result: data.result,
      message: data.result ? 'Tâche lancée avec succès' : 'Impossible de lancer la tâche',
      timer_state: updatedTask?.timer_state,
      location: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: formattedTimestamp,  // Use the formatted timestamp
        address: locationData.address
      }
    };
  } catch (error) {
    console.error("Erreur startTaskInOdoo:", {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: "Erreur de connexion" };
  }
};

export const stopTacheInOdoo = async (taskId, latitude, longitude, endDateTime, includeAddress = true) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  if (!uid || !password || !url || !dbName) {
    console.log('Missing Odoo configuration');
    return { success: false, error: "Configuration Odoo manquante" };
  }

  console.log('Fetching current task data to validate dates...');
  const currentTask = await fetchTaskById(taskId);
  if (!currentTask) {
    console.error('Could not fetch current task data');
    return { success: false, error: "Impossible de récupérer les données de la tâche" };
  }

  let formattedEndDateTime = endDateTime;
  
  if (endDateTime instanceof Date) {
    formattedEndDateTime = formatTimestampForOdoo(endDateTime);
  }
  else if (typeof endDateTime === 'string' && endDateTime.includes('T')) {
    const date = new Date(endDateTime);
    formattedEndDateTime = formatTimestampForOdoo(date);
  }
  else if (!endDateTime) {
    formattedEndDateTime = formatTimestampForOdoo();
  }

  console.log('Task validation details:', {
    taskId: taskId,
    originalEndDateTime: endDateTime,
    formattedEndDateTime: formattedEndDateTime,
    currentTaskStartDate: currentTask.date_assign,
    currentTaskDeadline: currentTask.date_deadline,
    timerState: currentTask.timer_state
  });

  if (currentTask.date_assign) {
    const taskStartDate = new Date(currentTask.date_assign);
    const taskEndDate = new Date(formattedEndDateTime);
    
    if (taskEndDate < taskStartDate) {
      console.warn('End date is before start date, adjusting...');
      const adjustedEndDate = new Date(taskStartDate.getTime() + 60000); 
      formattedEndDateTime = formatTimestampForOdoo(adjustedEndDate);
      console.log('Adjusted end date to:', formattedEndDateTime);
    }
  }

  let address = false;
  
  if (includeAddress && latitude && longitude) {
    console.log('Getting address from coordinates...');
    try {
      address = await reverseGeocode(latitude, longitude);
      console.log('Reverse geocoded address:', address);
    } catch (geocodeError) {
      console.warn('Geocoding failed, continuing without address:', geocodeError);
      address = false;
    }
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
        "stop_tache",             
        parseInt(taskId),
        parseFloat(latitude) || 0.0,  
        parseFloat(longitude) || 0.0, 
        formattedEndDateTime,
        address || false  
      ]
    },
    id: Date.now()
  };

  console.log('Stopping task with payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('HTTP error:', response.status, response.statusText);
      return { 
        success: false, 
        error: `Erreur HTTP: ${response.status} ${response.statusText}` 
      };
    }

    const data = await response.json();
    console.log('stop_tache API response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('Erreur stop_tache:', data.error);
      
      let errorMessage = data.error.data?.message || data.error.message || 'Erreur inconnue';
      
      if (errorMessage.includes('planned start date must be before') || 
          errorMessage.includes('planned_dates_check')) {
        errorMessage = "Erreur de validation des dates. Veuillez réessayer dans quelques secondes.";
        
        console.log('Date validation error detected, retrying with current timestamp...');
        const retryEndDateTime = formatTimestampForOdoo();
        
        const retryPayload = {
          ...payload,
          params: {
            ...payload.params,
            args: [
              ...payload.params.args.slice(0, -2), 
              retryEndDateTime,
              address || false
            ]
          }
        };
        
        console.log('Retrying with payload:', JSON.stringify(retryPayload, null, 2));
        
        try {
          const retryResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryPayload),
          });
          
          const retryData = await retryResponse.json();
          console.log('Retry response:', retryData);
          
          if (!retryData.error && retryData.result) {
            return { 
              success: true, 
              result: retryData.result,
              address: address || 'Adresse non disponible',
              timestamp: retryEndDateTime,
              retried: true
            };
          }
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      }
      
      return { 
        success: false, 
        error: errorMessage,
        fullError: data.error 
      };
    }

    console.log('Résultat stop_tache:', data);
    
    return { 
      success: true, 
      result: data.result,
      address: address || 'Adresse non disponible',
      timestamp: formattedEndDateTime
    };
  } catch (error) {
    console.error("Erreur réseau stopTacheInOdoo:", error);
    return { 
      success: false, 
      error: `Erreur de connexion: ${error.message}`,
      fullError: error 
    };
  }
};