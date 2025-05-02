import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, useColorScheme, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/Colors';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  secureTextEntry = false,
  showPasswordToggle = false,
  value,
  onChangeText,
  ...props
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[
        styles.label,
        { color: isDarkMode ? Colors.lightGray : Colors.textSecondary }
      ]}>
        {label}
      </Text>
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)',
          borderColor: isFocused ? Colors.primary : 'transparent',
        }
      ]}>
        <TextInput
          style={[
            styles.input,
            { 
              color: isDarkMode ? Colors.textLight : Colors.textPrimary,
            }
          ]}
          placeholderTextColor={isDarkMode ? Colors.gray : Colors.textTertiary}
          secureTextEntry={secureTextEntry && !showPassword}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize={secureTextEntry ? 'none' : 'sentences'}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity 
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={{ color: Colors.primary }}>
              {showPassword ? '•' : '👁️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordToggle: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default InputField;