import axios from 'axios';
import env from '../environment';
import logger from '../utils/logger';

const baseURL = env.API_BASE_URL;

const axiosInstance = axios.create({
  baseURL,
  timeout: 300000, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
  },
  withCredentials: true
});

axiosInstance.interceptors.request.use(
  (config) => {
    const url = (config.baseURL || '') + (config.url || '');
    
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