import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

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
  };

  const handleLogin = () => {
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);

    if (!emailValidationError && !passwordValidationError) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        // Navigate to HomeScreen after successful login
        navigation.replace('Home');
      }, 1500);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
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
            <Text style={[
              styles.title,
              { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
            ]}>
              Welcome Back
            </Text>
            <Text style={[
              styles.subtitle,
              { color: isDarkMode ? Colors.gray : Colors.textSecondary }
            ]}>
              Sign in to continue
            </Text>

            <View style={styles.inputContainer}>
              <InputField
                label="Email"
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
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                error={passwordError}
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text style={[
                styles.forgotPassword,
                { color: Colors.primary }
              ]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              disabled={!email || !password}
              style={styles.loginButton}
            />

            <View style={styles.signupContainer}>
              <Text style={[
                styles.signupText,
                { color: isDarkMode ? Colors.gray : Colors.textSecondary }
              ]}>
                Don't have an account?
              </Text>
              <TouchableOpacity>
                <Text style={[
                  styles.signupLink,
                  { color: Colors.primary }
                ]}>
                  {' Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    fontSize: 14,
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