import { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosInstance from './instance';
import { store } from '../redux/store';

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
      const token = state.auth.token;

      // If token exists, add to headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log(`🚀 REQUEST: ${config.method?.toUpperCase()} ${config.url}`, config);
      return config;
    },
    (error: AxiosError) => {
      console.log('❌ Request Error:', error);
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
      console.log(`✅ RESPONSE: ${response.config.method?.toUpperCase()} ${response.config.url}`, response);
      return response;
    },
    (error: AxiosError) => {
      const { response } = error;
      
      console.log('❌ Response Error:', error);

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