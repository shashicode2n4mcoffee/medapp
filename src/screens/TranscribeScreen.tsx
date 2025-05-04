import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import Button from '../components/Button';
import SpeechToText from '../components/SpeechToText';
import { RootStackParamList } from '../navigation/AppNavigator';

type TranscribeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Transcribe'>;
};

const TranscribeScreen = ({ navigation }: TranscribeScreenProps) => {
  // Always use light mode for this screen
  const isDarkMode = false;
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [audioData, setAudioData] = useState<any[]>([]);
  
  const handleSpeechResult = (text: string) => {
    setRecognizedText(text);
  };
  
  const handleSubmit = (text: string, audio?: any[]) => {
    console.log('Submitted text:', text);
    if (audio) {
      setAudioData(audio);
      console.log('Audio data length:', audio.length);
      // Here you would send both text and audio to your backend
    }
    // Handle the submitted text here
  };
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: isDarkMode ? Colors.dark : Colors.light }
      ]}
      edges={['bottom', 'left', 'right']}
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
                onSaveNote={(text) => {
                  console.log('Saving note:', text);
                  // Handle note saving functionality here
                }}
                placeholder="Tap the microphone and start speaking"
                patientInfo={{
                  name: 'George Smith',
                  age: '43',
                  gender: 'Male',
                  mrn: '430897134',
                  uid: '430897134'
                }}
              />
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
  backButton: {
    width: 200,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});

export default TranscribeScreen;