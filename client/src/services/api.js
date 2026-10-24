// FILE: services/api.js
// Responsibility: the ONE place that talks to the backend (Axios). Satisfies AUTH-08, DEPLOY-03.
// The API address comes from VITE_API_BASE_URL, so production never uses localhost.
import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "") });

let authToken = null;
let onUnauthorized = () => {};

export function setAuthToken(token) {
  authToken = token;
}
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

// If the server says 401 (invalid/expired token) on any protected call, clear the login state.
// A 401 from the login form itself just means "wrong password", so we skip that one.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config && error.config.url === "/auth/login";
    if (error.response && error.response.status === 401 && !isLoginCall) {
      onUnauthorized(error.response.data && error.response.data.message);
    }
    return Promise.reject(error);
  }
);

// Turns any Axios error into a readable message for the screen.
export function getErrorMessage(error) {
  if (error.response && error.response.data && error.response.data.message) return error.response.data.message;
  if (error.request) return "Cannot reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

export default api;
