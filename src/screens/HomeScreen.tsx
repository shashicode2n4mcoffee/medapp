import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  // Always use light mode for this screen
  const isDarkMode = false;
  
  const handleLogout = () => {
    navigation.replace('Login');
  };
  
  const navigateToTranscribe = () => {
    navigation.navigate('Transcribe');
  };
  
  const navigateToAppointments = () => {
    navigation.navigate('Appointments');
  };
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: isDarkMode ? Colors.dark : Colors.light }
      ]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
        ]}>
          AIApp Dashboard
        </Text>
        
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? Colors.textLight : Colors.textSecondary }
        ]}>
          Welcome to your speech recognition assistant
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Start Transcription"
            onPress={navigateToTranscribe}
            style={styles.transcribeButton}
          />
          
          <Button
            title="View Appointments"
            onPress={navigateToAppointments}
            style={styles.appointmentsButton}
          />
          
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 20,
  },
  transcribeButton: {
    marginBottom: 16,
  },
  appointmentsButton: {
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
});

export default HomeScreen;