import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { Colors } from '../theme/Colors';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';
import { loginUser } from '../redux/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { STORAGE_KEYS } from '../utils/literals/appliterals';
import { restoreSessionCookies, hasStoredCredentials, getStoredUserData } from '../utils/authStorage';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const isDarkMode = false;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { error, user } = useAppSelector(state => state.auth);

  const dispatch = useAppDispatch();
    // Check for stored credentials on component mount
  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        // Check if "Remember Me" was enabled and we have stored credentials
        const hasCredentials = await hasStoredCredentials();
        
        if (hasCredentials) {
          // Set remember me state
          setRememberMe(true);
          
          // Restore session cookies
          await restoreSessionCookies();
          
          // Get saved user data
          const userData = await getStoredUserData();
          
          if (userData) {
            // Pre-fill the email field if available
            if (userData.email) {
              setEmail(userData.email);
            }
            
            // Check if user is already authenticated via Redux state
            if (!user) {
              console.log('Found saved login credentials');
              // Note: For enhanced security, we don't pre-fill the password field
              // But you could implement auto-login here if desired
            }
          }
        }
      } catch (error) {
        console.error('Error retrieving saved credentials:', error);
      }
    };
    
    checkSavedCredentials();
  }, [user]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };  // Function to save authentication data to AsyncStorage
  const saveAuthDataToStorage = async (userData: any) => {
    try {
      // Save user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userData));
      
      // Save remember me preference
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, JSON.stringify(rememberMe));
      
      // Get and save session ID and CSRF token from cookies
      const cookieURL = Platform.OS === 'ios' ? 'https://testapi.medvise.ai' : 'testapi.medvise.ai';
      const cookies = await CookieManager.get(cookieURL);
      
      if (cookies) {
        // Save session ID if present
        if (cookies.sessionid) {
          await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, cookies.sessionid.value);
        }
        
        // Save CSRF token if present (it may already be saved by the interceptor, but adding it here for completeness)
        if (cookies.csrftoken) {
          await AsyncStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, cookies.csrftoken.value);
        }
      }
      
      console.log('Authentication data saved successfully');
    } catch (error) {
      console.error('Error saving authentication data:', error);
    }
  };

  const handleLogin = () => {
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);

    if (!emailValidationError && !passwordValidationError) {
      setLoading(true);
      
      dispatch(loginUser({ email, password }))
        .unwrap()
        .then((result) => {
          setLoading(false);
          
          // If remember me is checked, save auth data
          if (rememberMe) {
            saveAuthDataToStorage(result.user);
          } else {
            // If not checked, clear any previously stored data
            AsyncStorage.multiRemove([
              STORAGE_KEYS.USER_INFO,
              STORAGE_KEYS.REMEMBER_ME,
              STORAGE_KEYS.SESSION_ID
            ]);
          }
          
          navigation.replace('Appointments');
        })
        .catch(() => {
          setLoading(false);
        });
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <SafeAreaView 
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? Colors.dark : Colors.light }
      ]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={[
              styles.title,
              { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
            ]}>
              Welcome
            </Text>
            <Text style={[
              styles.subtitle,
              { color: isDarkMode ? Colors.gray : Colors.textSecondary }
            ]}>
              Please login to your account
            </Text>

            <View style={styles.inputContainer}>
              <InputField
                label="Email ID"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                error={emailError}
              />
              <InputField
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                showPasswordToggle
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                error={passwordError}
              />
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.rememberMeContainer}
                onPress={toggleRememberMe}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  rememberMe && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                ]}>
                  {rememberMe && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[
                  styles.rememberMeText,
                  { color: isDarkMode ? Colors.gray : Colors.textSecondary }
                ]}>
                  Remember me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.forgotPassword,
                  { color: Colors.primary }
                ]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              disabled={!email || !password}
              style={styles.loginButton}
            />

            {/* <View style={styles.signupContainer}>
              <Text style={[
                styles.signupText,
                { color: isDarkMode ? Colors.gray : Colors.textSecondary }
              ]}>
                Don't have an account?
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[
                  styles.signupLink,
                  { color: Colors.primary }
                ]}>
                  {' Sign Up'}
                </Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 24,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 96,
    marginTop: 20,
  },
  logo: {
    width: 200,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderMedium,  // Updated to use consistent border color
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: Colors.textSecondary, // Added consistent text color
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;