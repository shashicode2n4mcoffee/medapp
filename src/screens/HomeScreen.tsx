import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import Button from '../components/Button';
import SpeechToText from '../components/SpeechToText';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  // Always use light mode for this screen
  const isDarkMode = false;
  const [recognizedText, setRecognizedText] = useState<string>('');
  
  const handleLogout = () => {
    navigation.replace('Login');
  };

  const handleSpeechResult = (text: string) => {
    setRecognizedText(text);
  };
  
  const handleSubmit = (text: string) => {
    console.log('Submitted text:', text);
    // Handle the submitted text here
  };
  
  const navigateToTranscribe = () => {
    navigation.navigate('Transcribe');
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
          <View style={styles.content}>
            {/* Patient Context Card */}
            <View style={[
              styles.patientCard,
              { backgroundColor: isDarkMode ? Colors.darkGray : Colors.lightGreen }
            ]}>
              <Text style={[
                styles.patientCardTitle,
                { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
              ]}>
                Patient Context
              </Text>
              <View style={styles.patientInfoTable}>
                <View style={styles.patientInfoHeader}>
                  <Text style={styles.patientInfoHeaderCell}>Name</Text>
                  <Text style={styles.patientInfoHeaderCell}>Age</Text>
                  <Text style={styles.patientInfoHeaderCell}>Gender</Text>
                  <Text style={styles.patientInfoHeaderCell}>UID</Text>
                </View>
                <View style={styles.patientInfoRow}>
                  <Text style={styles.patientInfoCell}>George Milton</Text>
                  <Text style={styles.patientInfoCell}>43</Text>
                  <Text style={styles.patientInfoCell}>Male</Text>
                  <Text style={styles.patientInfoCell}>43587934</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.speechContainer}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
              ]}>
                Speech Recognition
              </Text>
              <SpeechToText 
                onSpeechResult={handleSpeechResult}
                onSubmit={handleSubmit}
                placeholder="Tap the microphone and start speaking"
              />
            </View>

            <Button
              title="Logout"
              onPress={handleLogout}
              variant="outline"
              style={styles.logoutButton}
            />
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  transcribeButton: {
    marginBottom: 12,
  },
  speechContainer: {
    width: '100%',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  logoutButton: {
    width: 200,
  },
  patientCard: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  patientCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  patientInfoTable: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  patientInfoHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
  },
  patientInfoHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'left',
  },
  patientInfoRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 8,
  },
  patientInfoCell: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});

export default HomeScreen;