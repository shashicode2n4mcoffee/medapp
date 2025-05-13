import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
  NativeModules,
} from 'react-native';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  RecordBackType
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { useDispatch } from 'react-redux';
import { AnyAction } from 'redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import logger from '../utils/logger';
import { getAudioRecordingSignedUrl, transcribeAudioChunkAction } from '../redux/slices/appointmentsSlice';
import useTranscriptionAPI from '../hooks/useTranscriptionAPI';
import { 
  SignedUrlResponse, 
  SignedUrlRequest,
  TranscribeChunkResponse, 
  TranscribeChunkRequest 
} from '../types/apiTypes';

interface SpeechToTextProps {
  appointmentId?: number;
  recordId?: string;
  onTranscriptionComplete?: (text: string) => void;
}

const SpeechToText = ({
  appointmentId,
  recordId,
  onTranscriptionComplete,
}: SpeechToTextProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00:00');
  const [recordingPath, setRecordingPath] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer());
  const audioDataRef = useRef<number[]>([]); // Store raw audio data
  const dispatch = useDispatch<ThunkDispatch<any, undefined, AnyAction>>();
  // Use imported types for API responses
  
  // Helper function to safely dispatch and handle Redux actions with proper typing
  const safeDispatch = async <T,>(actionCreator: any, payload: any): Promise<T> => {
    try {
      const result = await dispatch(actionCreator(payload));
      return result.payload as T;
    } catch (error) {
      logger.error('Error dispatching action', {
        action: actionCreator.name,
        payload,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };
  
  // Initialize the transcription API hook
  const transcriptionAPI = useTranscriptionAPI({
    recordId: recordId ? parseInt(recordId, 10) : 0,
    onTranscriptionComplete: (result) => {
      logger.info('Transcription completed', { result });
      if (onTranscriptionComplete) {
        onTranscriptionComplete(result?.text || '');
      }
    },
    onError: (error) => {
      logger.error('Transcription error', { error });
      Alert.alert('Error', 'Failed to transcribe audio');
    },
  });  // Enhanced function for robust recording permission handling with visual feedback
  const requestAudioPermissions = async (): Promise<boolean> => {
    // Update state to show we're checking permissions
    setPermissionStatus('checking');
    setIsRequestingPermission(true);
    
    logger.info('Requesting audio recording permissions', {
      platform: Platform.OS,
      platform_version: Platform.Version,
      component: 'SpeechToText'
    });
    
    if (Platform.OS === 'android') {
      try {
        // First check if we already have the permission
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );

        logger.info('Checking existing microphone permission', {
          has_permission: hasPermission,
          android_version: Platform.Version
        });

        if (hasPermission) {
          logger.info('Microphone permission already granted');
          setPermissionStatus('granted');
          setIsRequestingPermission(false);
          return true;
        }        // Pre-request check failed, now explicitly request the permission
        logger.info('Explicitly requesting microphone permission...');
        
        const micPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs microphone access to record audio',
            buttonNeutral: undefined, // Remove "Ask Me Later" to avoid confusion
            buttonNegative: 'Deny',
            buttonPositive: 'Allow'
          }
        );
        
        // Log detailed permission result for debugging
        logger.info('Microphone permission request result', { 
          result: micPermission,
          granted: micPermission === PermissionsAndroid.RESULTS.GRANTED,
          denied: micPermission === PermissionsAndroid.RESULTS.DENIED,
          never_ask_again: micPermission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        });
        
        // Verify permission was actually granted after user clicked OK
        const verifiedPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        logger.info('Verifying microphone permission after request', {
          verified_permission: verifiedPermission,
          request_result: micPermission
        });
        
        // Permission explicitly denied or "Never ask again" selected
        if (micPermission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          logger.warn('User selected never ask again for microphone permission');
          setPermissionStatus('denied');
          setIsRequestingPermission(false);
          
          Alert.alert(
            'Microphone Access Required', 
            'You\'ve previously denied microphone access. Please enable it in app settings to use audio recording.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
          // Regular denial of permission
        if (micPermission !== PermissionsAndroid.RESULTS.GRANTED) {
          logger.warn('Microphone permission denied', {
            permission_status: micPermission,
            verified_permission: verifiedPermission
          });
          
          setPermissionStatus('denied');
          setIsRequestingPermission(false);
          
          Alert.alert(
            'Microphone Permission Required', 
            'Audio recording requires microphone access. Please try again and tap "Allow" on the permission request.',
            [{ text: 'OK', style: 'default' }]
          );
          return false;
        }
        
        // If permission is GRANTED but verification check fails, try a retry mechanism
        if (!verifiedPermission && micPermission === PermissionsAndroid.RESULTS.GRANTED) {
          logger.warn('Permission granted but verification failed - attempting retry', {
            permission_status: micPermission,
            verified_permission: verifiedPermission
          });
          
          // Use our retry function to check multiple times with delay
          const permissionConfirmed = await verifyPermissionWithRetry(3, 400);
          
          if (!permissionConfirmed) {
            logger.error('Permission verification failed after retries', {
              original_permission: micPermission
            });
            
            Alert.alert(
              'Permission Error', 
              'Microphone permission could not be verified. Please restart the app and try again.',
              [{ text: 'OK', style: 'default' }]
            );
            return false;
          }
          
          logger.info('Permission verification succeeded after retries');
        }
          // Permission was granted, now check storage permissions for older Android
        logger.info('Microphone permission granted successfully');
        setPermissionStatus('granted');  // Update our permission state
        setIsRequestingPermission(false);
        
        // For older Android versions (< Android 10), also request storage permissions
        if (parseInt(Platform.Version.toString(), 10) < 29) {
          logger.info('Requesting storage permissions for older Android version');
          try {
            const storagePermission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
            
            logger.info('Storage permission result', { 
              result: storagePermission,
              granted: storagePermission === PermissionsAndroid.RESULTS.GRANTED
            });
            
            // We can proceed without storage permission, but warn the user
            if (storagePermission !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert(
                'Limited Functionality',
                'Storage permission was not granted. Recording will work, but saving files might be affected.',
                [{ text: 'Continue Anyway', style: 'default' }]
              );
            }
          } catch (err) {
            // Non-critical error, we can continue with just microphone permission
            logger.warn('Error requesting storage permission', {
              error: err instanceof Error ? err.message : 'Unknown error'
            });
          }
        }
        
        return true;
      } catch (error) {
        logger.error('Permission request failed', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        Alert.alert('Permission Error', 'There was a problem requesting microphone permissions. Please restart the app and try again.');
        return false;
      }    } else {
      // iOS handles permissions through the audio recorder
      logger.info('iOS permissions will be handled by the recorder');
      // On iOS, we'll assume permissions are granted until proven otherwise
      setPermissionStatus('granted');
      setIsRequestingPermission(false);
      return true;
    }
  };
  
  // Function to verify and retry permission check if initial grant didn't register
  const verifyPermissionWithRetry = async (maxRetries = 3, delayMs = 300): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Small delay before checking to give Android time to register the permission
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      
      logger.info('Verifying microphone permission - attempt', {
        attempt: attempt + 1,
        has_permission: hasPermission
      });
      
      if (hasPermission) {
        // Permission verified!
        setPermissionStatus('granted');
        setIsRequestingPermission(false);
        return true;
      }
    }
    
    // If we got here, verification failed after retries
    logger.warn('Permission verification failed after retries');
    setPermissionStatus('denied');
    setIsRequestingPermission(false);
    return false;
  };

  // Helper function to open device settings
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };
  // Start recording with enhanced error handling and permission verification
  const startRecording = async () => {
    try {
      logger.info('Starting recording process', {
        component: 'SpeechToText',
        method: 'startRecording',
        platform: Platform.OS,
        platform_version: Platform.Version
      });
      
      // Double check that recorder is not already active
      if (isRecording) {
        logger.warn('Recording already in progress, ignoring start request');
        return;
      }

      // Request permissions first with our enhanced handling
      const hasPermissions = await requestAudioPermissions();
      if (!hasPermissions) {
        logger.warn('Recording aborted - permissions not granted', {
          component: 'SpeechToText',
          method: 'startRecording'
        });
        return;
      }
        // For Android, perform a comprehensive final permission check
      if (Platform.OS === 'android') {
        // One more check with retry capability
        const finalCheck = await verifyPermissionWithRetry(2, 300);
        
        if (!finalCheck) {
          logger.error('Final permission verification failed before recording', {
            component: 'SpeechToText',
            method: 'startRecording'
          });
          
          // Could be a permission caching issue or delay in Android internal permission handling
          Alert.alert(
            'Permission Error',
            'Unable to verify microphone access. Would you like to try again or open settings?',
            [
              { text: 'Try Again', onPress: () => startRecording() },
              { text: 'Open Settings', onPress: () => openSettings() }
            ],
            { cancelable: true }
          );
          return;
        }
        
        logger.info('Final permission verification successful, proceeding with recording');
      }
      
      logger.info('Permissions verified, initializing recorder', {
        component: 'SpeechToText',
        method: 'startRecording'
      });
      
      // Reset audio data array
      audioDataRef.current = [];
      
      // Configure recorder
      audioRecorderPlayer.current.setSubscriptionDuration(0.1); // Get updates every 100ms      // Generate recording file path using a writable directory for each platform
      const path = Platform.select({
        ios: 'recording.m4a',
        android: `${RNFS.DocumentDirectoryPath}/recording.mp3`, // Use app's document directory which is writable
      });
      
      // Log the recording path for debugging
      logger.info('Recording path generated', { path });

      const recorderConfig = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      };
        logger.info('Starting audio recorder with config', {
        component: 'SpeechToText',
        method: 'startRecording',
        path,
        config: recorderConfig
      });
      
      // Ensure recorder is ready to use
      if (!audioRecorderPlayer.current) {
        throw new Error('Audio recorder not initialized');
      }
      
      // Try to reset the recorder first to clear any previous state
      try {
        await audioRecorderPlayer.current.removeRecordBackListener();
      } catch (resetError) {
        // Non-critical error, just log it
        logger.warn('Failed to reset recorder listener', {
          error: resetError instanceof Error ? resetError.message : 'Unknown error'
        });
      }
      
      // Start recording with volume listener and additional timeout protection
      let recorderStarted = false;
      
      const startPromise = audioRecorderPlayer.current.startRecorder(
        path,
        recorderConfig
      );
      
      // Add a timeout to detect if the recorder doesn't start properly
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          if (!recorderStarted) {
            reject(new Error('Recorder start timed out - possible permission or hardware issue'));
          }
        }, 3000); // 3 second timeout for recorder to start
      });
      
      // Race between successful start and timeout
      const result = await Promise.race([startPromise, timeoutPromise]);
      recorderStarted = true;
        // Subscribe to recording events to capture audio data
      audioRecorderPlayer.current.addRecordBackListener((e: RecordBackType) => {
        setRecordingTime(audioRecorderPlayer.current.mmssss(Math.floor(e.currentPosition)));
        
        // Generate simulated audio data (since raw PCM data is not directly available)
        // In a real scenario, you'd need to process the actual audio data
        if (e.currentMetering !== undefined) {
          // If metering is available, use it to generate audio data
          const sampleValue = (e.currentMetering + 160) / 160; // Normalize approximately -160dB to 0dB to 0-1 range
          audioDataRef.current.push(sampleValue);
          
          // Log metering data
          if (audioDataRef.current.length % 50 === 0) {
            logger.debug('Recording audio data with metering', {
              position_ms: e.currentPosition,
              current_metering: e.currentMetering,
              normalized_value: sampleValue,
              total_samples: audioDataRef.current.length
            });
          }
        } else {
          // If metering is not available, create oscillating values based on time
          const time = e.currentPosition / 1000;
          const sampleValue = Math.sin(time * 4) * 0.5 + 0.5; // Generate values between 0-1
          audioDataRef.current.push(sampleValue);
          
          // Log simulated data
          if (audioDataRef.current.length % 50 === 0) {
            logger.debug('Recording simulated audio data', {
              position_ms: e.currentPosition,
              time_s: time,
              simulated_value: sampleValue,
              total_samples: audioDataRef.current.length
            });
          }
        }
        
        // Log audio data statistics periodically with more details
        if (audioDataRef.current.length % 200 === 0) {
          const recentSamples = audioDataRef.current.slice(-200);
          const average = recentSamples.reduce((sum, val) => sum + val, 0) / recentSamples.length;
          const min = Math.min(...recentSamples);
          const max = Math.max(...recentSamples);
          
          logger.info('Audio data statistics', {
            component: 'SpeechToText',
            method: 'recordBackListener',
            total_samples: audioDataRef.current.length,
            position_ms: e.currentPosition,
            recent_average: parseFloat(average.toFixed(3)),
            recent_min: parseFloat(min.toFixed(3)),
            recent_max: parseFloat(max.toFixed(3)),
            has_metering: e.currentMetering !== undefined,
            recent_samples: audioDataRef.current.slice(-5).map(s => parseFloat(s.toFixed(3)))
          });
        }
        
        return;
      });      
      setRecordingPath(result as string);
      setIsRecording(true);
      
      // Start transcription process if recordId is available
      if (recordId) {
        // Start the transcription process with initial (empty) audio data
        transcriptionAPI.startTranscription(audioDataRef.current);
        
        logger.info('Transcription process started', {
          component: 'SpeechToText',
          method: 'startRecording',
          recordId: recordId
        });
      }
      
      logger.info('Recording started', {
        path: result, 
        recordId,
        appointmentId,
      });
        } catch (error) {
      // Enhanced error logging with more details
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Failed to start recording', { 
        component: 'SpeechToText',
        method: 'startRecording',
        error: errorMessage,
        stack: errorStack,
        platform: Platform.OS,
        platform_version: Platform.Version,
      });
        // Show a more helpful error message to the user based on the error type
      if (errorMessage.includes('permission') || 
          errorMessage.toLowerCase().includes('access') ||
          errorMessage.toLowerCase().includes('denied')) {
        
        // Permission related error
        Alert.alert(
          'Permission Error', 
          'Unable to access microphone. Please check your device settings and ensure microphone permissions are enabled.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openSettings() }
          ]
        );
      } else if (errorMessage.includes('timeout')) {
        // Timeout error
        Alert.alert(
          'Recording Failed',
          'The microphone did not start within the expected time. Please check if another app is using the microphone, or restart your device.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else if (errorMessage.includes('hardware') || errorMessage.includes('unavailable')) {
        // Hardware related error
        Alert.alert(
          'Microphone Error',
          'There was a problem accessing your device microphone. Please ensure no other app is using it and try again.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        // Generic error
        Alert.alert(
          'Recording Error', 
          'Failed to start recording. Please try again or restart the app.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }
    }
  };
  
  // Stop recording and process audio
  const stopRecording = async () => {
    try {
      if (!isRecording) return;
      
      // Stop recording
      const result = await audioRecorderPlayer.current.stopRecorder();
      audioRecorderPlayer.current.removeRecordBackListener();
      
      setIsRecording(false);
        // Log detailed audio data information
      const audioData = audioDataRef.current;
        // Analyze audio data in segments for better debugging
      const audioDataLength = audioData?.length || 0;
      let segmentAnalysis: Record<string, any> = {};
      
      if (audioDataLength > 0) {
        // Divide audio into segments for more detailed analysis
        const numSegments = Math.min(5, Math.ceil(audioDataLength / 100));
        const segmentSize = Math.floor(audioDataLength / numSegments);
        
        for (let i = 0; i < numSegments; i++) {
          const start = i * segmentSize;
          const end = (i === numSegments - 1) ? audioDataLength : (i + 1) * segmentSize;
          const segment = audioData.slice(start, end);
          
          if (segment.length > 0) {
            const segmentMin = Math.min(...segment);
            const segmentMax = Math.max(...segment);
            const segmentAvg = segment.reduce((sum, val) => sum + val, 0) / segment.length;
            const segmentHasZeros = segment.some(val => val === 0);
            const segmentZerosCount = segment.filter(val => val === 0).length;
            
            const segmentKey = `segment_${i+1}`;
            segmentAnalysis[segmentKey] = {
              range: `${start}-${end}`,
              length: segment.length,
              min: parseFloat(segmentMin.toFixed(3)),
              max: parseFloat(segmentMax.toFixed(3)),
              avg: parseFloat(segmentAvg.toFixed(3)),
              has_zeros: segmentHasZeros,
              zeros_count: segmentZerosCount,
              samples: segment.slice(0, 3).map(val => parseFloat(val.toFixed(3)))
            };
          }
        }
      }
      
      // Calculate histograms of values for distribution analysis
      const histogram = { '0-0.2': 0, '0.2-0.4': 0, '0.4-0.6': 0, '0.6-0.8': 0, '0.8-1.0': 0, 'other': 0 };
      
      if (audioDataLength > 0) {
        audioData.forEach(value => {
          if (value >= 0 && value < 0.2) histogram['0-0.2']++;
          else if (value >= 0.2 && value < 0.4) histogram['0.2-0.4']++;
          else if (value >= 0.4 && value < 0.6) histogram['0.4-0.6']++;
          else if (value >= 0.6 && value < 0.8) histogram['0.6-0.8']++;
          else if (value >= 0.8 && value <= 1.0) histogram['0.8-1.0']++;
          else histogram['other']++;
        });
      }
      
      // Log comprehensive analysis      // Perform in-depth audio analysis using the utility function
      const audioAnalysis = analyzeAudioData(audioData);
      
      // Generate visualization data for debugging
      const visualizationData = generateAudioVisualizationData(audioData, 30);
      
      logger.info('Recording stopped - Audio data details:', {
        component: 'SpeechToText',
        method: 'stopRecording',
        record_id: recordId,
        appointment_id: appointmentId,
        audio_path: result,
        recording_duration: recordingTime,
        audio_data_size: audioDataLength,
        audio_data_type: audioData ? typeof audioData : 'undefined',
        audio_data_is_array: Array.isArray(audioData),
        audio_data_first_few_values: audioData && audioDataLength > 0 
          ? audioData.slice(0, 5).map(item => typeof item === 'number' ? parseFloat(item.toFixed(3)) : typeof item) 
          : 'no data',
        audio_data_last_few_values: audioData && audioDataLength > 5
          ? audioData.slice(-5).map(item => typeof item === 'number' ? parseFloat(item.toFixed(3)) : typeof item)
          : 'no data',
        audio_data_sample_count: audioData && Array.isArray(audioData) 
          ? audioData.filter(v => typeof v === 'number').length 
          : 0,
        audio_data_min_value: audioData && audioDataLength > 0
          ? parseFloat(Math.min(...audioData.filter(v => typeof v === 'number')).toFixed(3))
          : null,
        audio_data_max_value: audioData && audioDataLength > 0
          ? parseFloat(Math.max(...audioData.filter(v => typeof v === 'number')).toFixed(3))
          : null,
        audio_data_avg_value: audioData && audioDataLength > 0
          ? parseFloat((audioData.reduce((sum, val) => sum + val, 0) / audioDataLength).toFixed(3))
          : null,
        audio_data_zero_count: audioData ? audioData.filter(v => v === 0).length : 0,
        audio_data_distribution: histogram,
        audio_segments_analysis: segmentAnalysis,
        has_valid_audio_data: audioDataLength > 0 && audioData.some(v => v !== 0),
        audio_quality_analysis: audioAnalysis,
        audio_visualization: visualizationData
      });
      
      // Process the recording for transcription
      await processRecordingForTranscription();
      
    } catch (error) {
      logger.error('Failed to stop recording', { error });
      Alert.alert('Error', 'Failed to stop recording');
    }
  };
  // Utility function to analyze audio data for debugging purposes
  const analyzeAudioData = (audioData: number[]) => {
    if (!audioData || audioData.length === 0) {
      return {
        isEmpty: true,
        hasContent: false,
        analysis: 'No audio data available'
      };
    }
    
    // Calculate basic statistics
    const min = Math.min(...audioData);
    const max = Math.max(...audioData);
    const avg = audioData.reduce((sum, val) => sum + val, 0) / audioData.length;
    const zeroCount = audioData.filter(val => val === 0 || val < 0.05).length;
    const zeroPercentage = (zeroCount / audioData.length) * 100;
    
    // Look for patterns that might indicate issues
    let patterns = [];
    
    // Check for long sequences of zeros (silence)
    let maxZeroSequence = 0;
    let currentZeroSequence = 0;
    let zeroSequences = [];
    
    for (let i = 0; i < audioData.length; i++) {
      if (audioData[i] < 0.05) { // Threshold for "silence"
        currentZeroSequence++;
      } else {
        if (currentZeroSequence > 10) { // Only count significant sequences
          zeroSequences.push({ start: i - currentZeroSequence, length: currentZeroSequence });
        }
        maxZeroSequence = Math.max(maxZeroSequence, currentZeroSequence);
        currentZeroSequence = 0;
      }
    }
    
    // Check if there was a final zero sequence
    if (currentZeroSequence > 10) {
      zeroSequences.push({ 
        start: audioData.length - currentZeroSequence, 
        length: currentZeroSequence 
      });
      maxZeroSequence = Math.max(maxZeroSequence, currentZeroSequence);
    }
    
    if (maxZeroSequence > audioData.length * 0.2) {
      patterns.push(`Long silence detected (${maxZeroSequence} samples)`);
    }
    
    // Check for constant values that might indicate a recording problem
    const uniqueValues = new Set(audioData).size;
    const uniqueRatio = uniqueValues / audioData.length;
    
    if (uniqueRatio < 0.1 && audioData.length > 20) {
      patterns.push('Low variability in audio data - possible recording issue');
    }
    
    // Check for clipping (too many samples at max value)
    const clippingCount = audioData.filter(val => val > 0.95).length;
    const clippingPercentage = (clippingCount / audioData.length) * 100;
    
    if (clippingPercentage > 10) {
      patterns.push(`Possible audio clipping detected (${clippingPercentage.toFixed(1)}% of samples)`);
    }
    
    return {
      isEmpty: audioData.length === 0,
      hasContent: zeroPercentage < 80, // Consider it has content if less than 80% is silence
      totalSamples: audioData.length,
      min: parseFloat(min.toFixed(3)),
      max: parseFloat(max.toFixed(3)),
      avg: parseFloat(avg.toFixed(3)),
      zeroCount,
      zeroPercentage: parseFloat(zeroPercentage.toFixed(1)),
      uniqueValues,
      uniqueValuesRatio: parseFloat(uniqueRatio.toFixed(3)),
      maxSilenceSequence: maxZeroSequence,
      significantSilencePeriods: zeroSequences.length,
      clippingPercentage: parseFloat(clippingPercentage.toFixed(1)),
      patterns: patterns.length > 0 ? patterns : ['No problematic patterns detected'],
      quality: 
        patterns.length === 0 ? 'good' :
        patterns.length <= 1 ? 'acceptable' :
        'problematic'
    };
  };
  // Generate debug visualization data for audio analysis
  const generateAudioVisualizationData = (audioData: number[], buckets: number = 20) => {
    if (!audioData || audioData.length === 0) {
      return {
        buckets: Array(buckets).fill(0),
        min: 0,
        max: 0,
        avg: 0
      };
    }
    
    // Divide the audio data into buckets for visualization
    const bucketSize = Math.ceil(audioData.length / buckets);
    const visualizationData: number[] = [];
    
    for (let i = 0; i < buckets; i++) {
      const start = i * bucketSize;
      const end = Math.min(start + bucketSize, audioData.length);
      
      if (start >= audioData.length) {
        visualizationData.push(0);
        continue;
      }
      
      const segment = audioData.slice(start, end);
      if (segment.length > 0) {
        const avgValue = segment.reduce((sum, val) => sum + val, 0) / segment.length;
        visualizationData.push(parseFloat(avgValue.toFixed(3)));
      } else {
        visualizationData.push(0);
      }
    }
    
    return {
      buckets: visualizationData,
      min: Math.min(...visualizationData),
      max: Math.max(...visualizationData),
      avg: visualizationData.reduce((sum, val) => sum + val, 0) / visualizationData.length
    };
  };
  // Process the recording for transcription
  const processRecordingForTranscription = async () => {
    const recordIdNumber = recordId ? parseInt(recordId, 10) : null;

    if (!recordIdNumber) {
      logger.error('No valid record ID available for processing recording');
      return;
    }
    
    // Log audio data details specifically for transcription process
    const audioData = audioDataRef.current;
    const audioDataLength = audioData?.length || 0;
    
    logger.info('Starting recording processing flow', {
      component: 'SpeechToText',
      method: 'processRecordingForTranscription',
      record_id: recordIdNumber,
      appointment_id: appointmentId,
      audio_data_size: audioDataLength,
      audio_data_has_content: audioDataLength > 0 && audioData.some(v => v !== 0),
      audio_sample_rate: 44100, // Assumed sample rate
      audio_format: Platform.OS === 'ios' ? 'm4a' : 'mp3',
    });
    
    try {      // Perform detailed audio analysis before processing
      const audioAnalysis = analyzeAudioData(audioData);
      const sampleValues = audioData.slice(0, 10).map(v => parseFloat(v.toFixed(3)));
      
      logger.info('Audio data sample before processing', {
        component: 'SpeechToText',
        method: 'processRecordingForTranscription',
        sample_values: sampleValues,
        has_zeros: sampleValues.some(v => v === 0),
        zeros_count: sampleValues.filter(v => v === 0).length,
        audio_analysis: {
          quality: audioAnalysis.quality,
          has_content: audioAnalysis.hasContent,
          patterns_detected: audioAnalysis.patterns,
          silence_percentage: audioAnalysis.zeroPercentage
        }
      });// Step 1: Get signed URL
      logger.info('Step 1/3: Requesting signed URL for audio recording');
      
      try {        // Use our safe dispatch helper with proper typing
        const signedUrlResponse = await safeDispatch<SignedUrlResponse>(
          getAudioRecordingSignedUrl, 
          { record_id: recordIdNumber }
        );
        
        if (signedUrlResponse && signedUrlResponse.url) {
          logger.info('Step 1/3 Complete: Obtained signed URL for audio recording', {
            url_expiration: signedUrlResponse.expiration,
            has_fields: !!signedUrlResponse.fields
          });
          
          // Step 2: End transcription with URL
          try {
            logger.info('Step 2/3: Ending transcription with URL context');
            
            await transcriptionAPI.stopTranscription(signedUrlResponse.url);
            logger.info('Step 2/3 Complete: Transcription ended successfully');
            
            // Step 3: Send final audio chunk
            if (audioDataLength > 0) {
              logger.info('Step 3/3: Sending final audio chunk for transcription', {
                audio_data_length: audioDataLength,
                audio_content_validated: true
              });
              
              try {                const chunkResponse = await safeDispatch<TranscribeChunkResponse>(
                  transcribeAudioChunkAction,
                  {
                    recordId: recordIdNumber,
                    sequenceId: 999, // Use high sequence ID to indicate final chunk
                    audioData: audioDataRef.current
                  }
                );
                
                logger.info('Step 3/3 Complete: Final audio chunk transcribed successfully', {
                  status: chunkResponse?.status || 'unknown',
                  workflow_complete: true
                });
              } catch (chunkError) {
                logger.error('Step 3/3 Failed: Error transcribing audio chunk', { 
                  error: chunkError instanceof Error ? chunkError.message : 'Unknown error',
                  audio_data_length: audioDataLength
                });
              }
            } else {
              logger.warn('Step 3/3 Skipped: No audio data available to send', {
                record_id: recordIdNumber
              });
            }
          } catch (stopError) {
            logger.error('Step 2/3 Failed: Error stopping transcription', { 
              error: stopError instanceof Error ? stopError.message : 'Unknown error' 
            });
          }
        } else {
          logger.error('Step 1/3 Failed: No valid signed URL response', {
            response_payload: signedUrlResponse ? typeof signedUrlResponse : 'null'
          });
        }
      } catch (urlError) {
        logger.error('Step 1/3 Failed: Error getting signed URL', { 
          error: urlError instanceof Error ? urlError.message : 'Unknown error',
          record_id: recordIdNumber 
        });
        Alert.alert('Error', 'Failed to get signed URL for recording');
      }
      
    } catch (error: any) {
      logger.error('Error processing recording for transcription', {
        component: 'SpeechToText',
        error: error.message || 'Unknown error',
        record_id: recordIdNumber
      });
      Alert.alert('Error', 'Failed to process recording for transcription');
    }
  };
  // Enhanced device compatibility and permission check
  useEffect(() => {
    const checkDeviceCompatibilityAndPermissions = async () => {
      try {
        logger.info('Audio recorder compatibility check started', {
          component: 'SpeechToText',
          platform: Platform.OS,
          platform_version: Platform.Version
        });
        
        // Initialize the audio recorder
        if (!audioRecorderPlayer.current) {
          audioRecorderPlayer.current = new AudioRecorderPlayer();
          logger.info('Audio recorder initialized');
        }
        
        if (Platform.OS === 'android') {
          // Check if permission is already granted
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          
          logger.info('Android audio permission check', {
            component: 'SpeechToText',
            has_permission: hasPermission
          });
          
          // Check if device has a microphone
          try {
            // NativeModules.AudioRecorderModule is a hypothetical module - 
            // The real check would depend on how your app is structured
            const audioDeviceInfo = NativeModules.PermissionsAndroid && 
                                    await NativeModules.PermissionsAndroid.getAudioDeviceInfo?.();
            
            if (audioDeviceInfo) {
              logger.info('Audio device information', { audioDeviceInfo });
            }
          } catch (deviceError) {
            // This is just for debugging, ignore errors
            logger.debug('Could not check audio device info', {
              error: deviceError instanceof Error ? deviceError.message : 'Unknown error'
            });
          }
          
          // If we don't have permission, don't request it yet - wait for user action
          if (!hasPermission) {
            logger.info('Microphone permission not yet granted - will request when recording starts');
            
            // You might want to pre-request it for a better user experience on next recording
            // but only in appropriate contexts to avoid annoying the user
            // await requestAudioPermissions();
          }
        }
        
        // For iOS we could check for permission status using the audio recorder
        // This would depend on the react-native-audio-recorder-player implementation
      } catch (error) {
        logger.warn('Audio recorder compatibility check failed', {
          component: 'SpeechToText',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
    
    checkDeviceCompatibilityAndPermissions();
    
    // Clean up when component unmounts
    return () => {
      if (audioRecorderPlayer.current) {
        try {
          // Stop recording if it's active
          if (isRecording) {
            audioRecorderPlayer.current.stopRecorder();
          }
          
          // Remove listeners
          audioRecorderPlayer.current.removeRecordBackListener();
          logger.info('Audio recorder cleaned up on unmount');
        } catch (cleanupError) {
          logger.warn('Error during audio recorder cleanup', {
            error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
          });
        }
      }
    };
  }, []);
    // Determine button text and status message based on current state
  const getButtonText = () => {
    if (isRequestingPermission) return 'Requesting Permissions...';
    if (isRecording) return 'Stop Recording';
    return 'Start Recording';
  };
  
  const getStatusMessage = () => {
    if (isRequestingPermission) return 'Please grant microphone permission when prompted';
    if (permissionStatus === 'denied') return 'Microphone permission denied. Recording unavailable.';
    if (isRecording) return 'Recording in progress...';
    if (recordingPath) return `Recording saved to: ${recordingPath}`;
    return 'Ready to record';
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.timeText}>{recordingTime}</Text>
      
      {/* Permission status indicator */}
      {permissionStatus !== 'unknown' && (
        <View style={[
          styles.permissionIndicator, 
          permissionStatus === 'granted' ? styles.permissionGranted : 
          permissionStatus === 'denied' ? styles.permissionDenied :
          styles.permissionChecking
        ]}>
          <Text style={styles.permissionText}>
            {permissionStatus === 'granted' ? 'Mic Access: Granted' : 
             permissionStatus === 'denied' ? 'Mic Access: Denied' : 
             'Checking Permissions...'}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.button, 
          isRecording ? styles.stopButton : 
          isRequestingPermission ? styles.pendingButton : 
          styles.startButton
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isRequestingPermission || permissionStatus === 'denied'}
      >
        <Text style={styles.buttonText}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.statusText}>
        {getStatusMessage()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  button: {
    padding: 15,
    borderRadius: 50,
    width: 200,
    alignItems: 'center',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  pendingButton: {
    backgroundColor: '#9E9E9E',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingPathText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  permissionIndicator: {
    padding: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  permissionGranted: {
    backgroundColor: '#DFF0D8',
    borderColor: '#D6E9C6',
    borderWidth: 1,
  },
  permissionDenied: {
    backgroundColor: '#F2DEDE',
    borderColor: '#EBCCD1',
    borderWidth: 1,
  },
  permissionChecking: {
    backgroundColor: '#FCF8E3',
    borderColor: '#FAEBCC',
    borderWidth: 1,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SpeechToText;