/**
 * Application Literals
 * 
 * This file contains all the application-wide literals and constants
 * used throughout the application. Centralizing these values helps with
 * maintenance and consistency.
 */

// App identification
export const APP = {
  NAME: 'AIApp',
  VERSION: '0.0.1',
  BUNDLE_ID: 'com.aiapp',
};

// Platform-specific identifiers
export const PLATFORMS = {
  ANDROID: 'android',
  IOS: 'ios',
};

// Environment names
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

// UI-related constants
export const UI = {
  HEADER_HEIGHT: 56,
  FOOTER_HEIGHT: 56,
  DEFAULT_PADDING: 20,
  BUTTON_HEIGHT: 48,
  BORDER_RADIUS: {
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 16,
    PILL: 40,
  },
  ANIMATION_DURATION: 300,
  INPUT_HEIGHT: 48,
};

// Navigation route names
export const ROUTES = {
  LOGIN: 'Login',
  HOME: 'Home',
  FORGOT_PASSWORD: 'ForgotPassword',
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  SETTINGS: 'app_settings',
};

// Timeouts and intervals (in milliseconds)
export const TIMEOUTS = {
  API_REQUEST: 30000,  // 30 seconds
  TOKEN_REFRESH: 300000,  // 5 minutes
  AUTO_LOGOUT: 1800000,  // 30 minutes
};

// Export all literal categories
export default {
  APP,
  PLATFORMS,
  ENVIRONMENTS,
  UI,
  ROUTES,
  STORAGE_KEYS,
  TIMEOUTS,
};