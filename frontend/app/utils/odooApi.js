import { dbOperations } from './sqlite';



// Fonction pour récupérer les détails du partenaire
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
        ["name", "login", "email", "employee_id"] // Include employee_id in user info
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
        ["id", "name", "date_deadline", "employee_id", "is_stop_maintenance","partner_name","partner_id","partner_phone","partner_address_complete"] // champs à récupérer
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
    return data.result?.[0] || null; // on récupère la 1ère tâche
  } catch (error) {
    console.error("Erreur fetchTaskById:", error);
    return null;
  }
};


