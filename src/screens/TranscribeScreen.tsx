import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from '../theme/Colors';
import SpeechToText from '../components/SpeechToText';
import Sidebar from '../components/Sidebar';
import {RootStackParamList} from '../navigation/AppNavigator';
import {RouteProp} from '@react-navigation/native';
import {useSidebar} from '../context/SidebarContext';
import {useAppSelector} from '../redux/store';
import logger from '../utils/logger';

type TranscribeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Transcribe'>;
  route: RouteProp<RootStackParamList, 'Transcribe'>;
};

const TranscribeScreen = ({navigation, route}: TranscribeScreenProps) => {
  const isDarkMode = false;
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [audioData, setAudioData] = useState<any[]>([]);
  
  // Get appointment details from Redux store
  const {selectedAppointmentDetail} = useAppSelector(state => state.appointments);
  
  const appointmentId = route.params?.appointmentId;
  const recordId = route.params?.recordId;
  
  // Build patient info from appointment details or use default
  const patientInfo = selectedAppointmentDetail 
    ? {
        name: selectedAppointmentDetail.appointment_name || 'No Name',
        age: selectedAppointmentDetail.metadata?.age || '',
        gender: selectedAppointmentDetail.metadata?.sex_at_birth || '',
        mrn: selectedAppointmentDetail.identifier || '',
        uid: selectedAppointmentDetail.identifier || '',
      }
    : route.params?.patientInfo || {
        name: 'George Smith',
        age: '43',
        gender: 'Male',
        mrn: '430897134',
        uid: '430897134',
      };
      
  logger.debug('Appointment ID received:', appointmentId);
  logger.debug('Record ID received:', recordId);
  logger.debug('Selected Appointment Detail:', selectedAppointmentDetail);

  const {isSidebarOpen} = useSidebar();

  const handleSpeechResult = (text: string) => {
    setRecognizedText(text);
  };  const handleSubmit = (text: string, audio?: any[], submissionData?: any) => {
    logger.info('Submitted text:', text);
    if (audio) {
      setAudioData(audio);
      logger.debug('Audio data length:', audio.length);
    }
    
    // Log if using appointment details from Redux
    if (selectedAppointmentDetail) {
      logger.info('Using appointment details from Redux:', {
        id: selectedAppointmentDetail.id,
        name: selectedAppointmentDetail.appointment_name,
        status: selectedAppointmentDetail.appointment_status,
      });
    }

    // Log submission data including appointment and record IDs
    if (submissionData) {
      logger.debug('Submission data:', submissionData);
      logger.info(
        'Appointment ID from submission:',
        submissionData.appointmentId,
      );
      logger.info('Record ID from submission:', submissionData.recordId);
    } else {
      logger.info('Using route params - Appointment ID:', appointmentId);
      logger.info('Using route params - Record ID:', recordId);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? Colors.dark : Colors.light},
      ]}
      edges={['bottom', 'left', 'right']}>
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
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.speechContainer}>
              <SpeechToText
                onSpeechResult={handleSpeechResult}
                onSubmit={handleSubmit}                onSaveNote={text => {
                  logger.info('Saving note:', text);
                }}
                placeholder="Tap the microphone and start speaking"
                patientInfo={{
                  name: patientInfo.name,
                  age: patientInfo.age,
                  gender: patientInfo.gender,
                  mrn: patientInfo.mrn,
                  uid: patientInfo.mrn,
                }}
                appointmentId={appointmentId}
                recordId={recordId}
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
