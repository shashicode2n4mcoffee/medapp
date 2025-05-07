import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, PermissionsAndroid, useColorScheme, Image, ScrollView } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Colors } from '../theme/Colors';
import logger from '../utils/logger';
import TranscriptLoadingModal from './TranscriptLoadingModal';
import useTranscriptionAPI from '../hooks/useTranscriptionAPI';

const micIcon = require('../assets/start.png');
const pauseIcon = require('../assets/pause.png');

interface PatientInfo {
  name?: string;
  age?: string;
  gender?: string;
  mrn?: string;
  uid?: string;
}

interface SpeechToTextProps {
  onSpeechResult?: (text: string) => void;
  placeholder?: string;
  onSubmit?: (text: string, audioData?: any) => void;
  onSaveNote?: (text: string) => void;
  patientInfo?: PatientInfo;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onSpeechResult,
  placeholder = 'Tap microphone and start speaking',
  onSubmit,
  onSaveNote,
  patientInfo = {
    name: 'George Smith',
    age: '43',
    gender: 'Male',
    mrn: '430897134',
    uid: '430897134'
  }
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accumulatedTextRef = useRef('');
  const isListeningRef = useRef(false); 
  const isPausedRef = useRef(false);   
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const audioDataRef = useRef<any[]>([]);

  const transcriptionAPI = useTranscriptionAPI({
    recordId: 5826,
    onTranscriptionComplete: (result) => {
      logger.debug('Transcription completed', result);
    },
    onError: (error) => {
      logger.error('Transcription error', error);
      setError('Error during transcription: ' + (error.message || 'Unknown error'));
    }
  });

  useEffect(() => {
    const initVoice = async () => {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechError = onSpeechError;
      if (Voice.onSpeechVolumeChanged) {
        Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;
      }
      
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'This app needs access to your microphone for speech recognition.',
              buttonPositive: 'OK',
              buttonNegative: 'Cancel',
            }
          );
          setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        } catch (err) {
          setError('Error requesting microphone permission');
          console.error(err);
        }
      } else {
        setHasPermission(true);
      }
    };

    initVoice();

    return () => {
      if (speechText && onSubmit) {
        onSubmit(speechText, audioDataRef.current);
      }
      stopSpeechToText();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (transcriptionAPI.isTranscribing) {
        transcriptionAPI.stopTranscription().catch(err => {
          logger.error('Error stopping transcription on unmount', err);
        });
      }
      
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isListening && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening, isPaused]);

  useEffect(() => {
    if (isPaused) {
      Voice.stop().catch(e => {
        logger.error('Error stopping voice recognition on pause state change', e);
      });
    }
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onSpeechStart = () => {
    setError(null);
  };

  const onSpeechVolumeChanged = (e: any) => {
    if (isPausedRef.current) return;
    if (e && e.value) {
      audioDataRef.current.push(e.value);
      transcriptionAPI.updateAudioData([e.value]);
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    logger.error('Speech error', e);
    
    if (isListeningRef.current && !isPausedRef.current) {
      try {
        setTimeout(() => {
          if (isListeningRef.current && !isPausedRef.current) {
            Voice.start('en-US');
          }
        }, 300);
      } catch (err) {
        logger.error('Error restarting voice recognition', err);
        setIsListening(false);
        isListeningRef.current = false;
      }
    }
  };

  const onSpeechPartialResults = (e: SpeechResultsEvent) => {
    if (isPausedRef.current) return;
    
    if (e.value && e.value[0]) {
      const partialResult = e.value[0];
      
      const currentText = accumulatedTextRef.current 
        ? accumulatedTextRef.current + ' ' + partialResult
        : partialResult;
        
      setSpeechText(currentText);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (isPausedRef.current) return;
    
    if (e.value && e.value[0]) {
      const result = e.value[0];
      
      const updatedText = accumulatedTextRef.current
        ? accumulatedTextRef.current + ' ' + result
        : result;
      
      accumulatedTextRef.current = updatedText;
      setSpeechText(updatedText);
      
      if (onSpeechResult) {
        onSpeechResult(updatedText);
      }
      
      if (isListeningRef.current && !isPausedRef.current) {
        try {
          Voice.start('en-US');
        } catch (err) {
          console.error('Error restarting voice recognition after results:', err);
        }
      }
    }
  };

  const startSpeechToText = async () => {
    if (!hasPermission) {
      setError('Microphone permission not granted');
      return;
    }

    setError(null);
    
    try {
      await Voice.stop();
    } catch (e) {
    }
    
    if (isPaused) {
      setIsPaused(false);
      isPausedRef.current = false;
    } else if (!isListening) {
      accumulatedTextRef.current = '';
      setSpeechText('');
      setRecordingTime(0);
      audioDataRef.current = [];
      
      transcriptionAPI.startTranscription();
    }
    
    setIsListening(true);
    isListeningRef.current = true;

    try {
      await Voice.start('en-US');
    } catch (e) {
      setError('Error starting speech recognition');
      logger.error('Error starting speech recognition', e);
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const pauseSpeechToText = async () => {
    setIsPaused(true);
    isPausedRef.current = true;
    
    try {
      await Voice.stop();
    } catch (e) {
      logger.error('Error pausing speech recognition', e);
    }
  };

  const stopSpeechToText = async () => {
    setIsListening(false);
    isListeningRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    
    try {
      await Voice.stop();
    } catch (e) {
      logger.error('Error stopping speech recognition', e);
    }
  };

  const toggleRecording = () => {
    if (!isListening) {
      startSpeechToText();
    } else if (isPaused) {
      startSpeechToText(); 
    } else {
      pauseSpeechToText();
    }
  };

  const generateNotes = () => {
    if (onSaveNote && speechText) {
      onSaveNote(speechText);
    }
  };

  const endRecording = () => {
    stopSpeechToText();
    
    transcriptionAPI.stopTranscription()
      .then(() => {
        logger.debug('Transcription ended successfully');
      })
      .catch((error) => {
        logger.error('Error ending transcription', error);
      });
    
    if (onSubmit && speechText) {
      logger.debug('Submitting speech text:', speechText);
      setShowTranscriptModal(true);
      setTimeout(() => {
        onSubmit(speechText, audioDataRef.current);
        setShowTranscriptModal(false);
      }, 4000); 
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.patientCard}>
        <Text style={styles.patientCardTitle}>Patient Context</Text>
        
        <View style={styles.patientInfoContainer}>
          <View style={styles.patientInfoRow}>
            <Text style={styles.patientInfoLabel}>Name</Text>
            <Text style={styles.patientInfoLabel}>Age</Text>
            <Text style={styles.patientInfoLabel}>Gender</Text>
            <Text style={styles.patientInfoLabel}>MRN</Text>
            <Text style={styles.patientInfoLabel}>UID</Text>
          </View>
          
          <View style={styles.patientInfoRow}>
            <Text style={styles.patientInfoValue}>{patientInfo.name}</Text>
            <Text style={styles.patientInfoValue}>{patientInfo.age}</Text>
            <Text style={styles.patientInfoValue}>{patientInfo.gender}</Text>
            <Text style={styles.patientInfoValue}>{patientInfo.mrn}</Text>
            <Text style={styles.patientInfoValue}>{patientInfo.uid}</Text>
          </View>
        </View>
      </View>
      
      {/* Microphone Button and Timer */}
      <View style={styles.microphoneContainer}>
        <TouchableOpacity
          style={styles.micButton}
          onPress={toggleRecording}
          activeOpacity={0.7}
        >
          <Image 
            source={isListening && !isPaused ? pauseIcon : micIcon} 
            style={[
              styles.micImage, 
              isListening && !isPaused && { tintColor: Colors.primary }
            ]} 
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
        
        {isPaused && (
          <View style={styles.pausedMessageContainer}>
            <View style={styles.errorDot} />
            <Text style={styles.pausedMessageText}>
              Your recording is paused, click on the above button to resume recording
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.transcriptionContainer}>
        <Text style={styles.transcriptionTitle}>Live transcription</Text>
        
        <ScrollView 
          style={styles.transcriptionContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.transcriptionText}>{speechText || "Tap the microphone button to start recording"}</Text>
        </ScrollView>

        <TouchableOpacity
          style={styles.generateNotesButton}
          onPress={generateNotes}
          activeOpacity={0.7}
          disabled={!speechText}
        >
          <Text style={styles.generateNotesText}>Generate Notes</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.endRecordingButton}
          onPress={endRecording}
          activeOpacity={0.7}
        >
          <Text style={styles.endRecordingText}>End recording</Text>
        </TouchableOpacity>
      </View>
      
      <TranscriptLoadingModal
        visible={showTranscriptModal}
        onRequestClose={() => setShowTranscriptModal(false)}
      />
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  patientCard: {
    backgroundColor: Colors.lightGreen,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  patientCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  patientInfoContainer: {
    marginTop: 4,
  },
  patientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  patientInfoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  patientInfoValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  microphoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    position: 'relative',
    height: 170, // Add height to accommodate the larger button
  },
  micButton: {
    width: 103,
    height: 147,
    borderRadius: 20,
    backgroundColor: Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  micImage: {
    width: 50,
    height: 50,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    color: Colors.textPrimary,
  },
  pausedMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    width: '100%',
  },
  errorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    marginRight: 8,
  },
  pausedMessageText: {
    color: Colors.error,
    fontSize: 12,
    flex: 1,
  },
  transcriptionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  transcriptionContent: {
    maxHeight: 200,
    minHeight: 200,
    position: 'relative',
    overflow: 'scroll',
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  actionButtonsContainer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  generateNotesButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',

    marginBottom: 6,
    // marginTop: 18,
  },
  generateNotesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  endRecordingButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  endRecordingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    marginVertical: 10,
    textAlign: 'center',
  },
});

export default SpeechToText;