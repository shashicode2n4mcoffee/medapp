import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, useColorScheme } from 'react-native';
import { Colors } from '../theme/Colors';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  secureTextEntry?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  secureTextEntry = false,
  value,
  onChangeText,
  ...props
}) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      <Text style={[
        styles.label,
        { color: isDarkMode ? Colors.gray : Colors.textSecondary }
      ]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          { 
            color: isDarkMode ? Colors.textLight : Colors.textPrimary,
            backgroundColor: isDarkMode ? Colors.darkGray : Colors.lightGray,
            borderColor: error ? Colors.error : isDarkMode ? Colors.gray : Colors.lightGray
          }
        ]}
        placeholderTextColor={isDarkMode ? Colors.gray : Colors.textTertiary}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={secureTextEntry ? 'none' : 'sentences'}
        {...props}
      />
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
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default InputField;