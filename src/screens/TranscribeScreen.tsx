import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Image,
  useColorScheme,
  PermissionsAndroid,
  Alert
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../theme/Colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import logger from '../utils/logger';

type TranscribeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Transcribe'>;
};

const TranscribeScreen = ({ navigation }: TranscribeScreenProps) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTextRef = useRef('');
  const isRecordingRef = useRef(false);

  // Sample patient data - in a real app, this would come from API/props/context
  const patientData = {
    name: 'George Milton',
    age: '43',
    gender: 'Male',
    uid: '43587934',
  };

  useEffect(() => {
    // Request permissions first
    const requestPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: "Microphone Permission",
              message: "MEDVISE needs access to your microphone for transcription",
              buttonPositive: "Allow",
              buttonNegative: "Deny"
            }
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setHasPermission(true);
            logger.info('Microphone permission granted');
          } else {
            setHasPermission(false);
            logger.error('Microphone permission denied');
            Alert.alert(
              "Permission Required", 
              "Microphone access is required for transcription functionality."
            );
          }
        } else {
          // iOS permissions are requested at runtime
          setHasPermission(true);
        }
      } catch (err) {
        logger.error('Error requesting permissions:', err);
        setHasPermission(false);
      }
    };

    requestPermissions();

    // Initialize Voice
    const initVoice = async () => {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechError = onSpeechError;
    };

    initVoice();

    // Cleanup Voice listeners on component unmount
    return () => {
      stopRecording();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Timer effect for recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Keep the ref in sync with the state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const onSpeechStart = () => {
    logger.info('Speech started');
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    logger.error('Speech error', e);
    if (isRecording && !isPaused) {
      // Try to restart
      try {
        setTimeout(() => {
          if (isRecording && !isPaused) {
            Voice.start('en-US');
          }
        }, 300);
      } catch (err) {
        logger.error('Error restarting voice recognition', err);
      }
    }
  };

  const onSpeechPartialResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value[0]) {
      const partialResult = e.value[0];
      // Don't accumulate text here, just show the partial result
      setTranscribedText(accumulatedTextRef.current + ' ' + partialResult);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value[0]) {
      const result = e.value[0];
      const updatedText = accumulatedTextRef.current
        ? accumulatedTextRef.current + ' ' + result
        : result;
      
      // Update the accumulated text
      accumulatedTextRef.current = updatedText;
      setTranscribedText(updatedText);
      
      // Immediately restart listening if still recording and not paused
      if (isRecording && !isPaused) {
        try {
          Voice.start('en-US');
        } catch (err) {
          logger.error('Error restarting voice recognition', err);
        }
      }
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert(
        "Permission Required", 
        "Microphone access is required for transcription functionality."
      );
      return;
    }
    
    try {
      // Reset accumulated text when starting a new recording
      if (!isRecording && !isPaused) {
        accumulatedTextRef.current = '';
        setTranscribedText('');
        setRecordingTime(0);
      }
      
      setIsRecording(true);
      setIsPaused(false);
      await Voice.start('en-US');
    } catch (e) {
      logger.error('Error starting recording', e);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const pauseRecording = async () => {
    try {
      setIsPaused(true);
      await Voice.stop();
    } catch (e) {
      logger.error('Error pausing recording', e);
    }
  };

  const resumeRecording = async () => {
    try {
      setIsPaused(false);
      await Voice.start('en-US');
    } catch (e) {
      logger.error('Error resuming recording', e);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsPaused(false);
      await Voice.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (e) {
      logger.error('Error stopping recording', e);
    }
  };

  const handleMicrophonePress = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const endRecording = () => {
    stopRecording();
    // Navigate back to the previous screen
    navigation.goBack();
  };

  const generateNotes = () => {
    // Implement note generation logic here
    // This could involve calling an API to process the transcription
    logger.info('Generating notes from transcription');
    
    if (!transcribedText) {
      Alert.alert("No Content", "Please record some audio before generating notes.");
      return;
    }
    
    // This is where you would call your API to process the transcription
    Alert.alert("Notes Generated", "Notes have been generated successfully!");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView 
      style={[
        styles.container,
        { backgroundColor: !isDarkMode ? Colors.backgroundDark : Colors.backgroundLight }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transcribe</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="search-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="notifications-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Patient Context Section */}
        <View style={styles.patientContextContainer}>
          <Text style={styles.sectionTitle}>Patient Context</Text>
          <View style={styles.patientInfoTable}>
            <View style={styles.patientInfoHeader}>
              <Text style={styles.patientInfoHeaderCell}>Name</Text>
              <Text style={styles.patientInfoHeaderCell}>Age</Text>
              <Text style={styles.patientInfoHeaderCell}>Gender</Text>
              <Text style={styles.patientInfoHeaderCell}>UID</Text>
            </View>
            <View style={styles.patientInfoRow}>
              <Text style={styles.patientInfoCell}>{patientData.name}</Text>
              <Text style={styles.patientInfoCell}>{patientData.age}</Text>
              <Text style={styles.patientInfoCell}>{patientData.gender}</Text>
              <Text style={styles.patientInfoCell}>{patientData.uid}</Text>
            </View>
          </View>
        </View>

        {/* Recording Section */}
        <View style={styles.recordingContainer}>
          <TouchableOpacity 
            style={[
              styles.microphoneButton,
              !hasPermission && styles.disabledButton,
              isPaused && styles.pausedButton
            ]}
            onPress={handleMicrophonePress}
            activeOpacity={0.8}
            disabled={!hasPermission}
          >
            <Icon 
              name={isRecording && !isPaused ? "mic" : "mic-outline"} 
              size={40} 
              color={Colors.textLight} 
            />
          </TouchableOpacity>
          <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>

          {isPaused && (
            <View style={styles.pausedContainer}>
              <Icon name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.pausedText}>
                Your recording is paused, click on the above button to resume recording.
              </Text>
            </View>
          )}
        </View>

        {/* Transcription Section */}
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionTitle}>Live transcription</Text>
          <View style={styles.transcriptionContent}>
            <Text style={styles.transcriptionText}>
              {transcribedText || 'Transcription will appear here...'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={[
            styles.generateButton,
            (!transcribedText || transcribedText.trim().length === 0) && styles.disabledGenerateButton
          ]}
          onPress={generateNotes}
          activeOpacity={0.8}
          disabled={!transcribedText || transcribedText.trim().length === 0}
        >
          <Text style={styles.buttonText}>Generate Notes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.endRecordingButton}
          onPress={endRecording}
          activeOpacity={0.8}
        >
          <Text style={styles.endRecordingText}>End recording</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  patientContextContainer: {
    backgroundColor: Colors.lightGreen,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 8,
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
  recordingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  microphoneButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: Colors.gray,
    opacity: 0.7,
  },
  pausedButton: {
    backgroundColor: Colors.warning,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  pausedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    width: '100%',
  },
  pausedText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 8,
    flex: 1,
  },
  transcriptionContainer: {
    marginBottom: 24,
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  transcriptionContent: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  footerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledGenerateButton: {
    backgroundColor: Colors.gray,
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  endRecordingButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  endRecordingText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TranscribeScreen;