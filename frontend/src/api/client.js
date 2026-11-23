/**
 * =====================================================================
 * File: /frontend/src/api/client.js
 * Description: Pre-configured Axios instance with JWT Authorization Bearer interceptor
 * =====================================================================
 */

import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Bearer token from localStorage
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 handler for expired sessions
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Auto logout on expired session token
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default client;
export { client };
