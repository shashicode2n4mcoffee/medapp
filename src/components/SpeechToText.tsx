import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, PermissionsAndroid, useColorScheme } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Colors } from '../theme/Colors';

interface SpeechToTextProps {
  onSpeechResult?: (text: string) => void;
  placeholder?: string;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onSpeechResult,
  placeholder = 'Tap microphone and start speaking'
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Voice
    const initVoice = async () => {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechResults = onSpeechResults;
      
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
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = () => {
    setIsListening(true);
    setError(null);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    setError(e.error?.message || 'Speech recognition error');
    setIsListening(false);
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    const result = e.value?.[0] || '';
    setSpeechText(result);
    if (onSpeechResult) {
      onSpeechResult(result);
    }
  };

  const startSpeechToText = async () => {
    if (!hasPermission) {
      setError('Microphone permission not granted');
      return;
    }

    setError(null);
    setSpeechText('');

    try {
      await Voice.start('en-US');
    } catch (e) {
      setError('Error starting speech recognition');
      console.error(e);
    }
  };

  const stopSpeechToText = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <View style={styles.resultContainer}>
        <Text
          style={[
            styles.resultText,
            { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
          ]}
        >
          {speechText || placeholder}
        </Text>
      </View>
      
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  resultContainer: {
    width: '100%',
    minHeight: 100,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
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
  errorText: {
    color: Colors.error,
    marginBottom: 10,
    textAlign: 'center',
  }
});

export default SpeechToText;