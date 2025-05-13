import apiClient from './apiClient';
import logger from '../utils/logger';
import { 
  TranscriptionResult, 
  TranscribeChunkResponse, 
  TranscribeChunkRequest 
} from '../types/apiTypes';

/**
 * Sends an audio chunk for transcription
 * 
 * @param recordId - ID of the record being transcribed
 * @param sequenceId - Sequence ID for the current chunk
 * @param audioData - Audio data to be transcribed
 * @returns The transcription response data
 */
export const sendAudioChunkForTranscription = async (
  recordId: number, 
  sequenceId: number, 
  audioData: number[]
): Promise<TranscribeChunkResponse | null> => {
  try {    // If no audio data is available, return null
    if (!audioData || audioData.length === 0) {
      logger.debug('No audio data available for transcription', { 
        sequence_id: sequenceId, 
        record_id: recordId 
      });
      return null;
    }
    
    // Validate and sanitize the audio data
    const sanitizedAudioData = validateAudioData(audioData);
    
    // If validation removed all data points, return null
    if (sanitizedAudioData.length === 0) {
      logger.warn('All audio data was filtered out during validation', { 
        sequence_id: sequenceId,
        record_id: recordId,
        original_length: audioData.length
      });
      return null;
    }    // Based on the API error logs, it appears the API expects JSON data, not form data
    // Create a JSON payload with the required fields
    const payload = {
      audio: sanitizedAudioData,
      sequence_id: sequenceId,
      record_id: recordId
    };
    
    // Log the payload details
    logger.info('Sending audio chunk with JSON payload:', {
      endpoint: '/api/V2/account/records/transcribe_audio_chunk/',
      record_id: recordId,
      sequence_id: sequenceId,
      original_audio_length: audioData.length,
      sanitized_audio_length: sanitizedAudioData.length,
      filtered_items: audioData.length - sanitizedAudioData.length,
      has_non_zero_values: sanitizedAudioData.some(val => val > 0.05),
      timestamp: new Date().toISOString()
    });
    
    // Make the API call with JSON data
    const response = await apiClient.post('/api/V2/account/records/transcribe_audio_chunk/', payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    logger.debug('Successfully sent audio chunk for transcription', { 
      sequenceId, 
      recordId 
    });
    
    return response.data;  } catch (error: any) {
    // Enhanced error logging for audio transcription failures
    logger.error('Error sending audio chunk for transcription', {
      endpoint: '/api/V2/account/records/transcribe_audio_chunk/',
      sequence_id: sequenceId,
      record_id: recordId,
      audio_data_length: audioData?.length || 0,
      error_message: error?.message || 'Unknown error',
      error_code: error?.code,
      error_response: error?.response?.data,
      status_code: error?.response?.status
    });
    throw error;
  }
};

/**
 * Ends a transcription session
 * 
 * @param recordId - ID of the record being transcribed
 * @param url - Optional URL from the signed URL response to include in context
 * @returns The response data from ending the transcription
 */
export const endTranscription = async (
  recordId: number, 
  url?: string
): Promise<TranscriptionResult> => {
  try {    const formData = new FormData();
    formData.append('record_id', recordId.toString());
    
    // If URL context is provided, include it in the request
    if (url) {
      formData.append('url', url);
    }
    
    // Log the payload details
    logger.info('Ending transcription with payload:', {
      endpoint: '/api/V2/account/records/end_transcription',
      record_id: recordId,
      has_url_context: !!url,
      url: url ? url.substring(0, 50) + '...' : undefined // Truncate URL for logging
    });
    
    const response = await apiClient.post('/api/V2/account/records/end_transcription', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    logger.debug('Successfully ended transcription', { recordId, url });
    return response.data;  } catch (error: any) {
    // Enhanced error logging for ending transcription
    logger.error('Error ending transcription', {
      endpoint: '/api/V2/account/records/end_transcription',
      record_id: recordId,
      has_url_context: !!url,
      error_message: error?.message || 'Unknown error',
      error_code: error?.code,
      error_response: error?.response?.data,
      status_code: error?.response?.status
    });
    throw error;
  }
};

/**
 * Validates and sanitizes audio data before sending it for transcription
 * 
 * @param audioData - Raw audio data array
 * @returns Sanitized audio data array
 */
export const validateAudioData = (audioData: any[]): number[] => {
  if (!audioData || !Array.isArray(audioData)) {
    logger.warn('Invalid audio data provided - not an array');
    return [];
  }
  
  // Filter out non-numeric values and sanitize the data
  const sanitizedData = audioData
    .filter(item => typeof item === 'number' && !isNaN(item))
    .map(value => {
      // Ensure values are in expected range (0-1)
      if (value < 0) return 0;
      if (value > 1) return 1;
      return value;
    });
  
  // Log validation results
  if (sanitizedData.length !== audioData.length) {
    logger.warn('Some audio data was filtered out during validation', {
      original_length: audioData.length,
      sanitized_length: sanitizedData.length,
      filtered_count: audioData.length - sanitizedData.length
    });
  }
  
  // Check for silent audio (all zeros or very low values)
  const nonZeroCount = sanitizedData.filter(val => val > 0.05).length;
  const nonZeroPercent = sanitizedData.length > 0 
    ? (nonZeroCount / sanitizedData.length) * 100 
    : 0;
  
  if (nonZeroPercent < 5 && sanitizedData.length > 10) {
    logger.warn('Audio data appears to be mostly silence', {
      non_zero_percent: nonZeroPercent.toFixed(2) + '%',
      data_length: sanitizedData.length
    });
  }
  
  return sanitizedData;
};

const transcriptionService = {
  sendAudioChunkForTranscription,
  endTranscription,
  validateAudioData
};

export default transcriptionService;