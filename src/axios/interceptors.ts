import { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosInstance from './instance';
import { store } from '../redux/store';
import logger from '../utils/logger';

/**
 * Request interceptor
 * - Adds authentication token to requests
 * - Can handle request logging or modifications
 */
const setupRequestInterceptor = () => {
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get the current state
      const state = store.getState();

      logger.httpRequest(config.method || 'unknown', config.url || 'unknown', config);
      return config;
    },
    (error: AxiosError) => {
      logger.httpError('Request Error', error);
      return Promise.reject(error);
    }
  );
};

/**
 * Response interceptor
 * - Handles global response processing
 * - Manages authentication errors (401, 403)
 * - Centralizes error handling
 */
const setupResponseInterceptor = () => {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      logger.httpResponse(response.config.method || 'unknown', response.config.url || 'unknown', response);
      return response;
    },
    (error: AxiosError) => {
      const { response } = error;
      
      logger.httpError('Response Error', error);

      // Handle authentication errors
      if (response?.status === 401 || response?.status === 403) {
        // Get dispatch from store to logout user
        const { dispatch } = store;
        // Import logout action
        const { logout } = require('../redux/slices/authSlice');
        
        // Logout user on auth errors
        dispatch(logout());
        
        // You could also redirect to login screen here if needed
      }
      
      return Promise.reject(error);
    }
  );
};

/**
 * Setup all interceptors
 */
export const setupInterceptors = () => {
  setupRequestInterceptor();
  setupResponseInterceptor();
};

export default setupInterceptors;