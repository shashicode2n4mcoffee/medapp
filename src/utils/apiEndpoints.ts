/**
 * API Endpoints
 * 
 * This file contains all the API endpoints used throughout the application.
 * Centralizing endpoints helps with maintenance and consistency.
 */

// Base endpoints
export const AUTH = {
  LOGIN: '/api/V2/account/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  LOGOUT: '/auth/logout',
  CURRENT_USER: '/auth/me',
};

// Add other endpoint categories as needed
export const USER = {
  PROFILE: '/user/profile',
  SETTINGS: '/user/settings',
};

// For file operations
export const FILES = {
  UPLOAD: '/files/upload',
  DOWNLOAD: '/files/download',
};

// Speech-to-text related endpoints
export const SPEECH = {
  TRANSCRIBE: '/speech/transcribe',
  ANALYZE: '/speech/analyze',
};

// Export all endpoint categories
export default {
  AUTH,
  USER,
  FILES,
  SPEECH,
};