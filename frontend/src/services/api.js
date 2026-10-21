import axios from "axios";

// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "http://localhost:8001");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

// ============================================================
// API STATUS
// ============================================================

export const checkApi = async () => {
  try {
    const response = await api.get("/");

    console.log("API status:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "API connection error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ============================================================
// HEALTH CHECK
// ============================================================

export const checkHealth = async () => {
  try {
    const response = await api.get("/health");

    console.log("Backend health:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Health check error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ============================================================
// PREDICT PROPERTY PRICE
// ============================================================

export const predictPrice = async (propertyData) => {
  try {
    const response = await api.post("/predict", propertyData);
    return response.data;
  } catch (error) {
    console.error("Prediction API error:", {
      status: error.response?.status,
      detail: error.response?.data?.detail || error.message,
      endpoint: `${API_URL}/predict`,
    });
    throw error;
  }
};

export const getPredictionOptions = async () => {
  const response = await api.get("/prediction-options");
  return response.data;
};

// ============================================================
// FEATURE IMPORTANCE
// ============================================================

export const getFeatureImportance = async () => {
  try {
    console.log(
      "Requesting feature importance..."
    );

    const response = await api.get(
      "/feature-importance"
    );

    console.log(
      "Feature importance response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "Feature importance API Error:",
      error
    );

    if (error.response) {
      console.error(
        "HTTP Status:",
        error.response.status
      );

      console.error(
        "Backend Response:",
        error.response.data
      );
    } else if (error.request) {
      console.error(
        "FastAPI did not respond while requesting feature importance."
      );
    }

    throw error;
  }
};

// ============================================================
// SIGNUP
// ============================================================

export const signupUser = async (data) => {
  try {
    const response = await api.post(
      "/auth/signup",
      data
    );

    return response.data;
  } catch (error) {
    console.error(
      "Signup API Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ============================================================
// LOGIN
// ============================================================

export const loginUser = async (data) => {
  try {
    const response = await api.post(
      "/auth/login",
      data
    );

    return response.data;
  } catch (error) {
    console.error(
      "Login API Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const refreshSession = async () => {
  const response = await api.post("/auth/refresh");
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const getMarketInsight = async (params, signal) => {
  const response = await api.get("/market-insight", { params, signal });
  return response.data;
};

export const submitContact = async (data) => {
  const response = await api.post("/contact", data);
  return response.data;
};

export default api;

