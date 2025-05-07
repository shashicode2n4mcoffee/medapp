import { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosInstance from './instance';
import { store } from '../redux/store';
import logger from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../utils/literals/appliterals';
import { logout } from '../redux/slices/authSlice';


const CSRF_COOKIE_NAME = 'csrftoken';
const API_DOMAIN = 'testapi.medvise.ai';
const API_URL = `https://${API_DOMAIN}`;

const setCsrfCookie = async (csrfToken: string) => {
  try {
    if (Platform.OS === 'android') {
      await CookieManager.set(API_URL, {
        name: CSRF_COOKIE_NAME,
        value: csrfToken,
        domain: `.${API_DOMAIN}`,
        path: '/',
        expires: '2030-05-30T12:30:00.00-05:00',
        secure: true,
        httpOnly: false,
      });
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, csrfToken);
    logger.debug('CSRF token set successfully', { csrfToken });
  } catch (error) {
    logger.error('Failed to set CSRF cookie', error);
  }
};

const getCsrfToken = async (): Promise<string | null> => {
  try {
    let csrfToken = await AsyncStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
    if (csrfToken) {
      return csrfToken;
    }
    
    const cookieURL = Platform.OS === 'ios' ? API_URL : API_DOMAIN;
    const cookies = await CookieManager.get(cookieURL);
    
    if (cookies && cookies[CSRF_COOKIE_NAME]) {
      csrfToken = cookies[CSRF_COOKIE_NAME].value;
      
      await AsyncStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, csrfToken);
      return csrfToken;
    }
    
    return null;
  } catch (error) {
    logger.error('Error retrieving CSRF token', error);
    return null;
  }
};

const extractCsrfTokenFromResponse = async (response: AxiosResponse) => {
  try {
    const setCookieHeader = response.headers['set-cookie'];
    
    if (setCookieHeader) {
      const csrfCookie = Array.isArray(setCookieHeader) 
        ? setCookieHeader.find(cookie => cookie.includes(`${CSRF_COOKIE_NAME}=`))
        : (typeof setCookieHeader === 'string' && (setCookieHeader as string).includes(`${CSRF_COOKIE_NAME}=`)) 
          ? setCookieHeader 
          : null;
          
      if (csrfCookie) {
        const csrfToken = csrfCookie.split('=')[1]?.split(';')[0];
        if (csrfToken) {
          await setCsrfCookie(csrfToken);
        }
      }
    }
    
    if (response.data && response.data.csrftoken) {
      await setCsrfCookie(response.data.csrftoken);
    }
  } catch (error) {
    logger.error('Error extracting CSRF token from response', error);
  }
};

const setupRequestInterceptor = () => {
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Get the current state
      const state = store.getState();
      
      // Add required headers to match the curl request
      // config.headers.set('accept', 'application/json, text/plain, */*');
      // config.headers.set('accept-language', 'en-US,en;q=0.9');
      config.headers.set('content-type', 'application/json');
      config.headers.set('origin', 'https://www.testportal.medvise.ai');
      // config.headers.set('priority', 'u=1, i');
      // config.headers.set('referer', 'https://www.testportal.medvise.ai/');
      
      // Only add browser-specific headers if not on native
      // if (Platform.OS === 'web' || !Platform.OS) {
      //   config.headers.set('sec-ch-ua', '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"');
      //   config.headers.set('sec-ch-ua-mobile', '?0');
      //   config.headers.set('sec-ch-ua-platform', '"Windows"');
      //   config.headers.set('sec-fetch-dest', 'empty');
      //   config.headers.set('sec-fetch-mode', 'cors');
      //   config.headers.set('sec-fetch-site', 'same-site');
      //   config.headers.set('sec-gpc', '1');
      // }
      
      // Always include a user-agent
      // config.headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36');
      
      try {
        // Get CSRF token
        const csrfToken = await getCsrfToken();
        
        if (csrfToken) {
          // Add CSRF token to headers
          console.log('CSRF token found:', csrfToken);
          config.headers.set('x-csrftoken', csrfToken);
          
          // For Android, we also need to add it as a cookie header
          if (Platform.OS === 'android') {
            config.headers.set('Cookie', `${CSRF_COOKIE_NAME}=${csrfToken}`);
          }
          
          // Enable credentials
          config.withCredentials = true;
        }
      } catch (error) {
        logger.error('Error setting CSRF token', error);
      }

      logger.httpRequest(config.method || 'unknown', config.url || 'unknown', config);
      return config;
    },
    (error: AxiosError) => {
      logger.httpError('Request Error', error);
      return Promise.reject(error);
    }
  );
};

const setupResponseInterceptor = () => {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      logger.httpResponse(response.config.method || 'unknown', response.config.url || 'unknown', response);
      
      // Extract and store CSRF token if present
      extractCsrfTokenFromResponse(response);
      
      return response;
    },
    (error: AxiosError) => {
      const { response, request, config, message } = error;
      
      // Create a structured error object with detailed information
      const errorDetails = {
        message,
        url: config?.url || 'unknown URL',
        method: config?.method?.toUpperCase() || 'UNKNOWN',
        status: response?.status,
        statusText: response?.statusText,
        headers: response?.headers,
        data: response?.data,
        request: request ? {
          url: request.url || config?.url,
          method: config?.method,
          headers: config?.headers,
          data: config?.data
        } : undefined,
        timestamp: new Date().toISOString()
      };

      // Log detailed API error information
      logger.group('API ERROR DETAILS', false, () => {
        logger.error(`${errorDetails.method} ${errorDetails.url} - ${errorDetails.status || 'Network Error'}`, null);
        
        if (response) {
          logger.error('Response data:', response.data);
        } else if (request) {
          logger.error('No response received (Network error)');
        } else {
          logger.error('Request setup error:', message);
        }
        
        // Log complete error details at debug level
        logger.debug('Complete error details:', errorDetails);
      });

      // Handle authentication errors
      if (response?.status === 401 || response?.status === 403) {
        const { dispatch } = store;
        dispatch(logout());
      }
      
      return Promise.reject(error);
    }
  );
};

export const setupInterceptors = () => {
  setupRequestInterceptor();
  setupResponseInterceptor();
};

export default setupInterceptors;