import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return '';
  };

  const handleSubmit = () => {
    const emailValidationError = validateEmail(email);
    setEmailError(emailValidationError);

    if (!emailValidationError) {
      setLoading(true);
      // Simulate API call to send password reset link
      setTimeout(() => {
        setLoading(false);
        setResetSent(true);
      }, 1500);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
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
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackToLogin}
            >
              <Text style={[
                styles.backText,
                { color: Colors.primary }
              ]}>
                ← Back to Login
              </Text>
            </TouchableOpacity>
            
            <Text style={[
              styles.title,
              { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
            ]}>
              Reset Password
            </Text>
            
            <Text style={[
              styles.subtitle,
              { color: isDarkMode ? Colors.gray : Colors.textSecondary }
            ]}>
              {resetSent 
                ? 'Password reset instructions have been sent to your email.' 
                : 'Enter your email to receive password reset instructions'}
            </Text>

            {!resetSent ? (
              <>
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
                </View>

                <Button
                  title="Reset Password"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={!email}
                  style={styles.submitButton}
                />
              </>
            ) : (
              <Button
                title="Back to Login"
                onPress={handleBackToLogin}
                style={styles.submitButton}
              />
            )}
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
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
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
    marginBottom: 24,
  },
  submitButton: {
    marginBottom: 24,
  },
});

export default ForgotPasswordScreen;