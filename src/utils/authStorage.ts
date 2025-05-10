import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from './literals/appliterals';
import logger from './logger';

const API_DOMAIN = 'testapi.medvise.ai';
const API_URL = `https://${API_DOMAIN}`;

/**
 * Restore session cookies from AsyncStorage to CookieManager
 * This function is useful when the app is restarted and we need to
 * restore the authentication cookies from persistent storage
 */
export const restoreSessionCookies = async (): Promise<boolean> => {
  try {
    // Check if we have stored session ID and CSRF token
    const sessionId = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID);
    const csrfToken = await AsyncStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
    
    if (!sessionId && !csrfToken) {
      logger.debug('No session cookies found in storage');
      return false;
    }
    
    // Set expiration dates
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    // Set the cookies
    if (sessionId) {
      await CookieManager.set(API_URL, {
        name: 'sessionid',
        value: sessionId,
        domain: `.${API_DOMAIN}`,
        path: '/',
        expires: twoWeeksLater.toISOString(),
        secure: true,
        httpOnly: false,
      });
      logger.debug('Session ID cookie restored from storage');
    }
    
    if (csrfToken) {
      await CookieManager.set(API_URL, {
        name: 'csrftoken',
        value: csrfToken,
        domain: `.${API_DOMAIN}`,
        path: '/',
        expires: nextYear.toISOString(),
        secure: true,
        httpOnly: false,
      });
      logger.debug('CSRF token cookie restored from storage');
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to restore session cookies from storage', error);
    return false;
  }
};

/**
 * Check if the user has previously enabled "Remember Me" and has stored credentials
 */
export const hasStoredCredentials = async (): Promise<boolean> => {
  try {
    const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    const userInfo = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    
    return rememberMe === 'true' && !!userInfo;
  } catch (error) {
    logger.error('Error checking for stored credentials', error);
    return false;
  }
};

/**
 * Get stored user data if available
 */
export const getStoredUserData = async (): Promise<any | null> => {
  try {
    const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    logger.error('Error retrieving stored user data', error);
    return null;
  }
};

export default {
  restoreSessionCookies,
  hasStoredCredentials,
  getStoredUserData,
};
