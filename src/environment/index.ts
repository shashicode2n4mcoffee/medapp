import { Platform } from 'react-native';
import Config from 'react-native-config';

type Environment = 'development' | 'staging' | 'production';

const logEnvVars = () => {
  console.log('Environment Variables:');
  console.log('ENVIRONMENT:', Config.ENVIRONMENT);
  console.log('API_BASE_URL_DEVELOPMENT:', Config.API_BASE_URL_DEVELOPMENT);
  console.log('API_BASE_URL_STAGING:', Config.API_BASE_URL_STAGING);
  console.log('API_BASE_URL_PRODUCTION:', Config.API_BASE_URL_PRODUCTION);
};

if (__DEV__) {
  logEnvVars();
}

const getEnvironment = (): Environment => {
  const environment = Config.ENVIRONMENT || 'development';
  
  if (['development', 'staging', 'production'].includes(environment)) {
    return environment as Environment;
  }
  
  return 'development';
};

const currentEnv = getEnvironment();

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

export default {
  ENV: currentEnv,
  API_BASE_URL: getApiBaseUrl(),
  IS_PRODUCTION: currentEnv === 'production',
  IS_DEVELOPMENT: currentEnv === 'development',
  IS_STAGING: currentEnv === 'staging',
  IS_ANDROID: Platform.OS === 'android',
  IS_IOS: Platform.OS === 'ios',
};