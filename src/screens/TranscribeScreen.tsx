import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import SpeechToText from '../components/SpeechToText';
import Sidebar from '../components/Sidebar';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { useSidebar } from '../context/SidebarContext';

type TranscribeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Transcribe'>;
  route: RouteProp<RootStackParamList, 'Transcribe'>;
};

const TranscribeScreen = ({ navigation, route }: TranscribeScreenProps) => {
  const isDarkMode = false;
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [audioData, setAudioData] = useState<any[]>([]);
    const patientInfo = route.params?.patientInfo || {
    name: 'George Smith',
    age: '43',
    gender: 'Male',
    mrn: '430897134',
    uid: '430897134'
  };
  
  const appointmentId = route.params?.appointmentId;
  console.log('Appointment ID received:', appointmentId);
  
  const { isSidebarOpen } = useSidebar();
  
  const handleSpeechResult = (text: string) => {
    setRecognizedText(text);
  };
  
  const handleSubmit = (text: string, audio?: any[]) => {
    console.log('Submitted text:', text);
    if (audio) {
      setAudioData(audio);
      console.log('Audio data length:', audio.length);
    }
  };
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: isDarkMode ? Colors.dark : Colors.light }
      ]}
      edges={['bottom', 'left', 'right']}
    >
      <Sidebar 
        isVisible={isSidebarOpen}
        onClose={() => {}}
        userInfo={{
          name: 'George Milton',
          role: 'Doctor',
        }}
      />
      
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
              <SpeechToText 
                onSpeechResult={handleSpeechResult}
                onSubmit={handleSubmit}
                onSaveNote={(text) => {
                  console.log('Saving note:', text);
                }}
                placeholder="Tap the microphone and start speaking"
                patientInfo={{
                  name: patientInfo.name,
                  age: patientInfo.age,
                  gender: patientInfo.gender,
                  mrn: patientInfo.mrn,
                  uid: patientInfo.mrn
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
  speechContainer: {
    width: '100%',
    marginBottom: 32,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});

export default TranscribeScreen;