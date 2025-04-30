import axios from 'axios';
import env from '../environment';

/**
 * Base API configuration for the application
 */
const baseURL = env.API_BASE_URL; // Get base URL from environment config

/**
 * Create an axios instance with custom configuration
 */
const axiosInstance = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add request interceptor to log URL and payload
axiosInstance.interceptors.request.use(
  (config) => {
    // Extract and log the full URL
    const url = (config.baseURL || '') + (config.url || '');
    console.log('🔗 API Request URL:', url);
    
    // Log the request payload if it exists
    if (config.data) {
      console.log('📦 Request Payload:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.log('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

export default axiosInstance;