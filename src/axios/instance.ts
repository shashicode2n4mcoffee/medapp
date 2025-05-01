import axios from 'axios';
import env from '../environment';
import logger from '../utils/logger';

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
    
    // Log request details in a single call
    logger.group('API Request', false, () => {
      logger.debug('API Request URL', url);
      if (config.data) {
        logger.debug('Request Payload', config.data);
      }
    });
    
    return config;
  },
  (error) => {
    logger.error('Request Error', error);
    return Promise.reject(error);
  }
);

export default axiosInstance;