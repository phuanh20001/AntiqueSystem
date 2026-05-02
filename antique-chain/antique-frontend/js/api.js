const API_BASE_URL = "http://localhost:5000/api";
const BACKEND_BASE_URL = "http://localhost:5000";

function getStoredToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  let result = {};
  try {
    result = await response.json();
  } catch (error) {
    result = {};
  }

  if (!response.ok) {
    throw new Error(result.message || "Request failed");
  }

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