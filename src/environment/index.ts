import { Platform } from 'react-native';
import Config from 'react-native-config';

// Define available environments
type Environment = 'development' | 'staging' | 'production';

// Log environment variables for debugging
const logEnvVars = () => {
  console.log('Environment Variables:');
  console.log('ENVIRONMENT:', Config.ENVIRONMENT);
  console.log('API_BASE_URL_DEVELOPMENT:', Config.API_BASE_URL_DEVELOPMENT);
  console.log('API_BASE_URL_STAGING:', Config.API_BASE_URL_STAGING);
  console.log('API_BASE_URL_PRODUCTION:', Config.API_BASE_URL_PRODUCTION);
};

// Call this in development to see what's being loaded
if (__DEV__) {
  logEnvVars();
}

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
      return Config.API_BASE_URL_DEVELOPMENT || '';
    case 'staging':
      return Config.API_BASE_URL_STAGING || '';
    case 'production':
      return Config.API_BASE_URL_PRODUCTION || '';
    default:
      return Config.API_BASE_URL_DEVELOPMENT || '';
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