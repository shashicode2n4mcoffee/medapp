import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, PermissionsAndroid, useColorScheme, TextInput } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Colors } from '../theme/Colors';
import logger from '../utils/logger';

interface SpeechToTextProps {
  onSpeechResult?: (text: string) => void;
  placeholder?: string;
  onSubmit?: (text: string) => void;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onSpeechResult,
  placeholder = 'Tap microphone and start speaking',
  onSubmit
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const accumulatedTextRef = useRef('');
  const isListeningRef = useRef(false); // Use ref to track listening state for callbacks

  useEffect(() => {
    // Initialize Voice
    const initVoice = async () => {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechError = onSpeechError;
      
      // Request permissions on Android
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
        // iOS permissions are requested when needed
        setHasPermission(true);
      }
    };

    initVoice();

    // Cleanup Voice listeners on component unmount
    return () => {
      stopSpeechToText();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = () => {
    setError(null);
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    logger.error('Speech error', e);
    
    if (isListeningRef.current) {
      // Only try to restart if we're still in listening mode
      try {
        // Small delay before restarting to avoid rapid restarts
        setTimeout(() => {
          if (isListeningRef.current) {
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
    if (e.value && e.value[0]) {
      const partialResult = e.value[0];
      
      // Only set the current partial result, don't accumulate yet
      const currentText = accumulatedTextRef.current 
        ? accumulatedTextRef.current + ' ' + partialResult
        : partialResult;
        
      setSpeechText(currentText);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value[0]) {
      const result = e.value[0];
      
      // Append to previous results with a space if needed
      const updatedText = accumulatedTextRef.current
        ? accumulatedTextRef.current + ' ' + result
        : result;
      
      accumulatedTextRef.current = updatedText;
      setSpeechText(updatedText);
      
      if (onSpeechResult) {
        onSpeechResult(updatedText);
      }
      
      // Immediately restart listening if we're still in listening mode
      if (isListeningRef.current) {
        try {
          Voice.start('en-US');
        } catch (err) {
          console.error('Error restarting voice recognition after results:', err);
        }
      }
    }
  };

  const startSpeechToText = async () => {
    // Stop editing mode if active
    setIsEditing(false);
    
    if (!hasPermission) {
      setError('Microphone permission not granted');
      return;
    }

    setError(null);
    
    // Make sure any previous sessions are stopped
    try {
      await Voice.stop();
    } catch (e) {
      // Ignore errors when stopping
    }
    
    // Reset accumulated text when starting a new recording session
    accumulatedTextRef.current = '';
    setSpeechText('');
    
    // Update both state and ref
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

  const stopSpeechToText = async () => {
    // Update both state and ref
    setIsListening(false);
    isListeningRef.current = false;
    
    try {
      await Voice.stop();
    } catch (e) {
      logger.error('Error stopping speech recognition', e);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  const resetSpeech = () => {
    setSpeechText('');
    accumulatedTextRef.current = '';
    setIsEditing(false);
    if (onSpeechResult) {
      onSpeechResult('');
    }
  };

  const handleTextChange = (text: string) => {
    setSpeechText(text);
    accumulatedTextRef.current = text;
    if (onSpeechResult) {
      onSpeechResult(text);
    }
  };

  const toggleEditing = () => {
    // Don't allow editing while actively listening
    if (isListening) {
      return;
    }
    setIsEditing(!isEditing);
  };

  const submitText = () => {
    if (onSubmit && speechText) {
      onSubmit(speechText);
    }
    setIsEditing(false);
  };

  const renderTranscript = () => {
    if (!speechText && !isEditing) {
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={styles.resultContainer}
        activeOpacity={0.7}
        disabled={isListening}
        onPress={toggleEditing}
      >
        {isEditing ? (
          <View style={styles.editingContainer}>
            <TextInput
              style={[
                styles.inputText,
                { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
              ]}
              value={speechText}
              onChangeText={handleTextChange}
              multiline
              autoFocus
              onSubmitEditing={submitText}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitText}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text
            style={[
              styles.resultText,
              { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
            ]}
          >
            {speechText}
            {!isListening && speechText ? 
              <Text style={styles.editHintText}> (Tap to edit)</Text> : null
            }
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <View style={styles.mainControlsContainer}>
        <TouchableOpacity
          style={[
            styles.micButton,
            isListening ? 
              { backgroundColor: Colors.error } : 
              { backgroundColor: Colors.primary }
          ]}
          onPress={toggleListening}
          activeOpacity={0.7}
        >
          <Text style={styles.micButtonText}>
            {isListening ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.buttonActions}>
          {speechText ? (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetSpeech}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          ) : null}
          
          {speechText && !isListening && !isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={toggleEditing}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      
      {!isListening && !speechText ? (
        <Text style={[styles.placeholderText, { color: isDarkMode ? Colors.textLight : Colors.textSecondary }]}>
          {placeholder}
        </Text>
      ) : null}
      
      {renderTranscript()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  mainControlsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonActions: {
    flexDirection: 'column',
    marginLeft: 20,
  },
  placeholderText: {
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 14,
  },
  resultContainer: {
    width: '100%',
    minHeight: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
  },
  editHintText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  inputText: {
    fontSize: 16,
    textAlign: 'center',
    minHeight: 80,
    textAlignVertical: 'center',
    width: '100%',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  micButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: Colors.error,
    marginBottom: 10,
    textAlign: 'center',
  },
  editingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SpeechToText;