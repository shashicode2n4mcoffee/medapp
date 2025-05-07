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
    
    // Make the API call with FormData
    const response = await apiClient.post('/api/V2/account/records/transcribe_audio_chunk', formData, {
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
 * @returns The response data from ending the transcription
 */
export const endTranscription = async (recordId: number) => {
  try {
    const formData = new FormData();
    formData.append('record_id', recordId.toString());
    
    const response = await apiClient.post('/api/V2/account/records/end_transcription', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    logger.debug('Successfully ended transcription', { recordId });
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