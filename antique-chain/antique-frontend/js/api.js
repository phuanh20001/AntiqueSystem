const API_BASE_URL = "http://localhost:5000/api";
const BACKEND_BASE_URL = "http://localhost:5000";

// Provide a safe fallback for getStoredToken if `utils.js` hasn't been loaded yet.
// If `getStoredToken` is already defined by utils.js, do not overwrite it.
if (typeof getStoredToken !== 'function') {
  function getStoredToken() {
    try {
      return (
        sessionStorage.getItem('antiqchain-token-session') ||
        localStorage.getItem('antiqchain-token')
      );
    } catch (e) {
      return null;
    }
  }
}

async function apiRequest(endpoint, method = "GET", data = null, requiresAuth = false) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const options = {
    method,
    headers
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  console.log(`apiRequest: ${method} ${API_BASE_URL}${endpoint}`);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  console.log(`apiRequest: Response status ${response.status}`);

  let result = {};
  try {
    result = await response.json();
    console.log(`apiRequest: Response parsed:`, result);
  } catch (error) {
    console.error(`apiRequest: Error parsing JSON:`, error);
    result = {};
  }

  if (!response.ok) {
    console.error(`apiRequest: Response not ok, throwing error:`, result.message);
    throw new Error(result.message || "Request failed");
  }

  console.log(`apiRequest: Returning result`);
  return result;
}

async function getBackendHealth() {
  const response = await fetch(`${BACKEND_BASE_URL}/health`);

  let result = {};
  try {
    result = await response.json();
  } catch (error) {
    result = {};
  }

  if (!response.ok) {
    throw new Error(result.message || 'Backend health check failed');
  }

  return result;
}