import { Platform } from 'react-native';
import Config from 'react-native-config';

// Define available environments
type Environment = 'development' | 'staging' | 'production';

// Get current environment from .env file or default to development
const getEnvironment = (): Environment => {
  const environment = Config.ENVIRONMENT || 'development';
  
  if (['development', 'staging', 'production'].includes(environment)) {
    return environment as Environment;
  }
  
  return 'development';
};

// Get current environment
const currentEnv = getEnvironment();

// Get API URL based on current environment
const getApiBaseUrl = (): string => {
  switch (currentEnv) {
    case 'development':
      return Config.API_BASE_URL_DEVELOPMENT || 'https://testapi.medvise.ai/api/V2/account/api';
    case 'staging':
      return Config.API_BASE_URL_STAGING || 'https://staging-api.example.com';
    case 'production':
      return Config.API_BASE_URL_PRODUCTION || 'https://api.example.com';
    default:
      return Config.API_BASE_URL_DEVELOPMENT || 'https://dev-api.example.com';
  }
};

// Export the configuration for the current environment
export default {
  ENV: currentEnv,
  API_BASE_URL: getApiBaseUrl(),
  IS_PRODUCTION: currentEnv === 'production',
  IS_DEVELOPMENT: currentEnv === 'development',
  IS_STAGING: currentEnv === 'staging',
  IS_ANDROID: Platform.OS === 'android',
  IS_IOS: Platform.OS === 'ios',
};