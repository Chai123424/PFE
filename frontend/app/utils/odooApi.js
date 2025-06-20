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

// Cache for employee ID to avoid repeated API calls
let employeeIdCache = null;
let employeeIdCacheTimestamp = null;
const EMPLOYEE_CACHE_TTL = 300000; // 5 minutes

const getEmployeeId = async () => {
  // Check cache first
  if (employeeIdCache && employeeIdCacheTimestamp && 
      (Date.now() - employeeIdCacheTimestamp < EMPLOYEE_CACHE_TTL)) {
    console.log('Using cached employee ID:', employeeIdCache);
    return employeeIdCache;
  }

  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

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
      employeeIdCache = userData.result[0].employee_id[0];
      employeeIdCacheTimestamp = Date.now();
      console.log('Cached new employee ID:', employeeIdCache);
      return employeeIdCache;
    }
  } catch (e) {
    console.error('Failed to fetch employee ID:', e);
  }

  return null;
};

// Optimized domain builder with precise filtering
const buildOptimizedDomain = (employeeId, searchQuery, activeTab) => {
  const domain = [
    // Basic required filters - most restrictive first for better DB performance
    ["state", "=", "01_in_progress"],
    ["active", "=", true],
    ["is_stop_maintenance", "=", false],
    ["timer_state", "!=", "reported"],
    
    // Employee assignment logic (OR condition)
    "|", 
    ["&", ["employee_id", "=", employeeId], ["change_technician", "=", false]],
    ["&", ["employee2_id", "=", employeeId], ["change_technician", "=", true]]
  ];
  
  // Date filtering - precise and server-side optimized
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  todayEnd.setMilliseconds(-1); // 23:59:59.999
  
  const todayStartStr = todayStart.toISOString().split('T')[0] + ' 00:00:00';
  const todayEndStr = todayEnd.toISOString().split('T')[0] + ' 23:59:59';
  
  if (activeTab === 'today') {
    domain.push(['date_deadline', '>=', todayStartStr]);
    domain.push(['date_deadline', '<=', todayEndStr]);
  } else if (activeTab === 'upcoming') {
    domain.push(['date_deadline', '>', todayEndStr]);
  } else if (activeTab === 'past') {
    domain.push(['date_deadline', '<', todayStartStr]);
  }
  
  // Search query filtering - use ilike for case-insensitive search
  if (searchQuery && searchQuery.trim().length > 0) {
    const trimmedQuery = searchQuery.trim();
    domain.push("|");
    domain.push(["name", "ilike", trimmedQuery]);
    domain.push(["partner_name", "ilike", trimmedQuery]);
  }
  
  return domain;
};

export const fetchOdooTasks = async (searchQuery, activeTab) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  console.log('Config validation:', { 
    uid: !!uid, 
    password: !!password, 
    url: !!url, 
    dbName: !!dbName 
  });

  if (!uid || !password || !url || !dbName) {
    console.log('Missing config, returning empty array');
    return [];
  }

  // Get employee ID with caching
  const employeeId = await getEmployeeId();
  if (!employeeId) {
    console.log('No employee ID found for this user');
    return [];
  }

  // Build optimized domain
  const domain = buildOptimizedDomain(employeeId, searchQuery, activeTab);
  
  console.log('Optimized domain filters:', {
    activeTab,
    searchQuery: searchQuery?.trim() || 'none',
    employeeId,
    domainLength: domain.length
  });

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
  
  // Optimized field selection - only essential fields
  const essentialFields = [
    "id", "name", "date_deadline", "partner_id", "partner_name", 
    "partner_phone", "partner_address_complete", "employee_id", 
    "employee2_id", "change_technician", "state", "timer_state", 
    "is_stop_maintenance", "active", "stage_id", "project_id"
  ];

  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "search_read",
      args: [
        dbName,
        parseInt(uid),
        password,
        "project.task",
        domain,
        essentialFields,
        {
          // Performance optimizations
          limit: 1000, // Reasonable limit to prevent excessive loading
          order: 'date_deadline ASC' // Consistent ordering
        }
      ]
    },
    id: Date.now()
  };

  console.log('API Request Summary:', {
    endpoint: endpoint.replace(/\/\/.*@/, '//***@'), // Hide credentials in logs
    domainFilters: domain.length,
    fieldCount: essentialFields.length,
    searchTerm: searchQuery?.trim() || 'none',
    tab: activeTab
  });

  try {
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    const requestTime = Date.now() - startTime;
    
    console.log(`API Response: ${requestTime}ms`, {
      hasError: !!data.error,
      resultCount: data.result?.length || 0
    });
    
    if (data.error) {
      console.error('Odoo API error:', data.error);
      return [];
    }
    
    const serverTasks = data.result || [];
    
    // Minimal client-side validation (should be redundant due to server filtering)
    const validatedTasks = serverTasks.filter(task => {
      // Validation should be minimal since server-side filtering is comprehensive
      const isValid = task.id && 
                     task.state === "01_in_progress" && 
                     task.active !== false && 
                     task.is_stop_maintenance === false &&
                     task.timer_state !== "reported";
      
      if (!isValid) {
        console.warn(`Task ${task.id} failed client validation:`, {
          state: task.state,
          active: task.active,
          is_stop_maintenance: task.is_stop_maintenance,
          timer_state: task.timer_state
        });
      }
      
      return isValid;
    });
    
    const filteredCount = validatedTasks.length;
    const serverCount = serverTasks.length;
    
    console.log('Filtering Results:', {
      serverFiltered: serverCount,
      clientValidated: filteredCount,
      efficiency: `${((filteredCount/serverCount)*100).toFixed(1)}%`,
      requestTime: `${requestTime}ms`,
      tab: activeTab
    });
    
    // Warning for inefficient filtering
    if (serverCount > 0 && (filteredCount / serverCount) < 0.9) {
      console.warn('⚠️ Low filtering efficiency detected. Server-side domain may need optimization.');
    }
    
    return validatedTasks;
    
  } catch (error) {
    console.error('Failed to fetch tasks from Odoo:', error);
    return [];
  }
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

export const startTask = async (taskId, locationData = null) => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  if (!uid || !password || !url || !dbName) {
    console.log('Missing Odoo configuration');
    return { success: false, error: "Configuration Odoo manquante" };
  }

  // Obtenir les données de localisation si non fournies
  let location = locationData;
  if (!location) {
    try {
      location = await getLocationAndTime();
    } catch (error) {
      console.warn('Could not get location for task start:', error);
      // Continuer sans localisation
    }
  }

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
  const timestamp = formatTimestampForOdoo();

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
        "start_pool_maintenance_api",
        parseInt(taskId),
        {
          start_time: timestamp,
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address || null,
            timestamp: location.timestamp || timestamp
          } : null
        }
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
    console.log('Start task API response:', data);
    
    if (data.error) {
      console.error('Start task API error:', data.error);
      return { success: false, error: data.error };
    }
    
    return data.result || { success: true, message: "Tâche démarrée avec succès" };
  } catch (error) {
    console.error("Erreur startTask:", error);
    return { success: false, error: "Erreur de connexion" };
  }
};

// Fonction optimisée pour récupérer les tâches démarrées (state = "start")
export const fetchStartedTasks = async (searchQuery = "", activeTab = "today") => {
  const uid = await dbOperations.getConfig('odoo_uid');
  const password = await dbOperations.getConfig('odoo_password');
  const url = await dbOperations.getConfig('odoo_url');
  const dbName = await dbOperations.getConfig('odoo_db');

  console.log('Config validation for started tasks:', { 
    uid: !!uid, 
    password: !!password, 
    url: !!url, 
    dbName: !!dbName 
  });

  if (!uid || !password || !url || !dbName) {
    console.log('Missing config, returning empty array');
    return [];
  }

  // Get employee ID with caching
  const employeeId = await getEmployeeId();
  if (!employeeId) {
    console.log('No employee ID found for this user');
    return [];
  }

  // Build optimized domain for server-side filtering
  const serverDomain = buildServerOptimizedDomain(employeeId, searchQuery, activeTab);
  
  console.log('Server-side domain filters for started tasks:', {
    activeTab,
    searchQuery: searchQuery?.trim() || 'none',
    employeeId,
    domainLength: serverDomain.length
  });

  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
  
  // Optimized field selection for started tasks
  const essentialFields = [
    "id", "name", "date_deadline", "partner_id", "partner_name", 
    "partner_phone", "partner_address_complete", "employee_id", 
    "employee2_id", "change_technician", "state", "timer_state", 
    "is_stop_maintenance", "active", "stage_id", "project_id",
    "start_time", "location_data" // Additional fields for started tasks
  ];

  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "search_read",
      args: [
        dbName,
        parseInt(uid),
        password,
        "project.task",
        serverDomain,
        essentialFields,
        {
          limit: 1000,
          order: 'date_deadline ASC'
        }
      ]
    },
    id: Date.now()
  };

  console.log('Started tasks API Request Summary:', {
    endpoint: endpoint.replace(/\/\/.*@/, '//***@'),
    domainFilters: serverDomain.length,
    fieldCount: essentialFields.length,
    searchTerm: searchQuery?.trim() || 'none',
    tab: activeTab
  });

  try {
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    const requestTime = Date.now() - startTime;
    
    console.log(`Started Tasks API Response: ${requestTime}ms`, {
      hasError: !!data.error,
      resultCount: data.result?.length || 0
    });
    
    if (data.error) {
      console.error('Odoo API error for started tasks:', data.error);
      return [];
    }
    
    const serverTasks = data.result || [];
    
    // Client-side filtering for started tasks (state = "start")
    const clientFilteredTasks = applyClientSideFiltering(serverTasks, employeeId);
    
    const filteredCount = clientFilteredTasks.length;
    const serverCount = serverTasks.length;
    
    console.log('Started Tasks Filtering Results:', {
      serverFiltered: serverCount,
      clientFiltered: filteredCount,
      efficiency: `${((filteredCount/serverCount)*100).toFixed(1)}%`,
      requestTime: `${requestTime}ms`,
      tab: activeTab
    });
    
    // Warning for inefficient filtering
    if (serverCount > 0 && (filteredCount / serverCount) < 0.8) {
      console.warn('⚠️ Low filtering efficiency for started tasks. Consider optimizing server-side domain.');
    }
    
    return clientFilteredTasks;
    
  } catch (error) {
    console.error('Failed to fetch started tasks from Odoo:', error);
    return [];
  }
};

// Domain builder optimisé pour le filtrage côté serveur
const buildServerOptimizedDomain = (employeeId, searchQuery, activeTab) => {
  const domain = [
    // Filtrage côté serveur - conditions les plus restrictives en premier
    ["is_stop_maintenance", "=", false],
    ["active", "=", true], 
    ["state", "=", "01_in_progress"],
    ["timer_state", "!=", "reported"]
  ];
  
  // Date filtering - precise and server-side optimized
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  todayEnd.setMilliseconds(-1);
  
  const todayStartStr = todayStart.toISOString().split('T')[0] + ' 00:00:00';
  const todayEndStr = todayEnd.toISOString().split('T')[0] + ' 23:59:59';
  
  if (activeTab === 'today') {
    domain.push(['date_deadline', '>=', todayStartStr]);
    domain.push(['date_deadline', '<=', todayEndStr]);
  } else if (activeTab === 'upcoming') {
    domain.push(['date_deadline', '>', todayEndStr]);
  } else if (activeTab === 'past') {
    domain.push(['date_deadline', '<', todayStartStr]);
  }
  
  // Search query filtering
  if (searchQuery && searchQuery.trim().length > 0) {
    const trimmedQuery = searchQuery.trim();
    domain.push("|");
    domain.push(["name", "ilike", trimmedQuery]);
    domain.push(["partner_name", "ilike", trimmedQuery]);
  }
  
  return domain;
};

// Filtrage côté client pour minimiser les loadings excessifs
const applyClientSideFiltering = (tasks, employeeId) => {
  return tasks.filter(task => {
    // Filtrage côté client pour les tâches démarrées (state = "start")
    const isStartedTask = task.timer_state === "start";
    
    // Vérification de l'assignation du technicien
    const isAssignedToTechnician = (
      // Cas 1: employee_id correspond et change_technician = false
      (task.employee_id && 
       task.employee_id[0] === employeeId && 
       task.change_technician === false) ||
      // Cas 2: employee2_id correspond et change_technician = true
      (task.employee2_id && 
       task.employee2_id[0] === employeeId && 
       task.change_technician === true)
    );
    
    const isValid = isStartedTask && isAssignedToTechnician;
    
    if (!isValid) {
      console.log(`Task ${task.id} filtered out on client side:`, {
        timer_state: task.timer_state,
        isStartedTask,
        employee_id: task.employee_id?.[0],
        employee2_id: task.employee2_id?.[0],
        change_technician: task.change_technician,
        isAssignedToTechnician,
        targetEmployeeId: employeeId
      });
    }
    
    return isValid;
  });
};

// Fonction pour démarrer une tâche avec validation préalable
export const startTaskWithValidation = async (taskId) => {
  console.log('Starting task with validation:', taskId);
  
  // Valider que la tâche peut être démarrée
  const task = await fetchTaskById(taskId);
  if (!task) {
    return { success: false, error: "Tâche introuvable" };
  }
  
  // Vérifier l'état de la tâche
  if (task.timer_state === "start") {
    return { success: false, error: "La tâche est déjà démarrée" };
  }
  
  if (task.timer_state === "reported") {
    return { success: false, error: "La tâche est déjà terminée" };
  }
  
  if (task.is_stop_maintenance === true) {
    return { success: false, error: "La maintenance est arrêtée pour cette tâche" };
  }
  
  // Obtenir la localisation
  let locationData = null;
  try {
    locationData = await getLocationTimeAndAddress();
    console.log('Location obtained for task start:', locationData);
  } catch (error) {
    console.warn('Could not get location, continuing without:', error);
  }
  
  // Démarrer la tâche
  return await startTask(taskId, locationData);
};

// Fonction utilitaire pour vérifier si une tâche peut être démarrée
export const canStartTask = (task, employeeId) => {
  if (!task || !employeeId) return false;
  
  // Vérifications de base
  if (task.timer_state === "start" || 
      task.timer_state === "reported" ||
      task.is_stop_maintenance === true ||
      task.active === false ||
      task.state !== "01_in_progress") {
    return false;
  }
  
  // Vérification de l'assignation du technicien
  const isAssignedToTechnician = (
    (task.employee_id && 
     task.employee_id[0] === employeeId && 
     task.change_technician === false) ||
    (task.employee2_id && 
     task.employee2_id[0] === employeeId && 
     task.change_technician === true)
  );
  
  return isAssignedToTechnician;
};