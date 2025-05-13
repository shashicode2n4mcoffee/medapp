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
    const fullUrl = (config.baseURL || '') + (config.url || '');
    
    logger.group('API Request', false, () => {
      logger.info('Full API URL:', fullUrl);
      logger.debug('Base URL:', config.baseURL);
      logger.debug('Endpoint:', config.url);
      logger.debug('Method:', config.method?.toUpperCase());
      if (config.params) {
        logger.debug('Query Parameters:', config.params);
      }
      if (config.data) {
        logger.debug('Request Payload:', config.data);
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