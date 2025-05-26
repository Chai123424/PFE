// Authenticate and return the user ID (uid)
export const authenticateOdoo = async (url, db, username, password) => {
    const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [db, username, password, {}]
      },
      id: Date.now()
    };
  
    console.log('Payload:', payload);
  
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  
    const data = await response.json();
  
    if (data.result) {
      return data.result; // uid
    } else {
      throw new Error(data.error?.message || 'Authentication failed');
    }
  };
  
  // Generic function for any Odoo JSON-RPC call
  export const odooJsonRpc = async (url, service, method, args, id = 1) => {
    const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id,
    };
  
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  
    const data = await response.json();
    if ('error' in data) throw new Error(data.error.message);
    return data.result;
  };
  
  
  