import apiClient from './apiClient';
import logger from '../utils/logger';

/**
 * Sends an audio chunk for transcription
 * 
 * @param recordId - ID of the record being transcribed
 * @param sequenceId - Sequence ID for the current chunk
 * @param audioData - Audio data to be transcribed
 * @returns The transcription response data
 */
export const sendAudioChunkForTranscription = async (recordId: number, sequenceId: number, audioData: any[]) => {
  try {
    // If no audio data is available, return null
    if (!audioData || audioData.length === 0) {
      logger.debug('No audio data available for transcription', { sequenceId });
      return null;
    }
    
    // Create a FormData object for the request
    const formData = new FormData();
    
    // Convert audio data to appropriate format
    const audioBlob = new Blob([JSON.stringify(audioData)], { 
      type: 'application/json',
      lastModified: Date.now()
    });
      // Append the required fields to the FormData
    formData.append('audio', audioBlob);
    formData.append('sequence_id', sequenceId.toString());
    formData.append('record_id', recordId.toString());
    
    // Log the payload details
    logger.info('Sending audio chunk with payload:', {
      endpoint: '/api/V2/account/records/transcribe_audio_chunk/',
      record_id: recordId,
      sequence_id: sequenceId,
      audio_data_length: audioData.length,
      audio_blob_size: audioBlob.size,
    });
    
    // Make the API call with FormData
    const response = await apiClient.post('/api/V2/account/records/transcribe_audio_chunk/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    logger.debug('Successfully sent audio chunk for transcription', { 
      sequenceId, 
      recordId 
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error sending audio chunk for transcription', {
      sequenceId,
      recordId,
      error
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
export const endTranscription = async (recordId: number, url?: string) => {
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
    return response.data;
  } catch (error) {
    logger.error('Error ending transcription', error);
    throw error;
  }
};

const transcriptionService = {
  sendAudioChunkForTranscription,
  endTranscription
};

export default transcriptionService;