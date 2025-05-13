import { useState, useEffect, useRef } from 'react';
import { transcriptionService } from '../api';
import logger from '../utils/logger';

interface TranscriptionOptions {
  recordId: number;
  onTranscriptionComplete?: (result: any) => void;
  onError?: (error: any) => void;
  intervalMilliseconds?: number;
}

const useTranscriptionAPI = ({
  recordId,
  onTranscriptionComplete,
  onError,
  intervalMilliseconds = 120000, 
}: TranscriptionOptions) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sequenceId, setSequenceId] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioDataRef = useRef<any[]>([]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
  const startTranscription = (initialAudioData?: any[]) => {
    if (initialAudioData) {
      audioDataRef.current = initialAudioData;
    }
    
    setIsTranscribing(true);
    
    logger.info('Starting transcription process', {
      hook: 'useTranscriptionAPI',
      method: 'startTranscription',
      record_id: recordId,
      initial_data_length: initialAudioData?.length || 0,
      interval_ms: intervalMilliseconds
    });
    
    sendAudioChunk();
    
    intervalRef.current = setInterval(() => {
      logger.debug('Sending periodic audio chunk via interval', {
        hook: 'useTranscriptionAPI',
        record_id: recordId,
        sequence_id: sequenceId,
        data_length: audioDataRef.current.length
      });
      sendAudioChunk();
    }, intervalMilliseconds);
  };  const stopTranscription = async (url?: string) => {
    logger.info('Stopping transcription process', {
      hook: 'useTranscriptionAPI',
      method: 'stopTranscription',
      record_id: recordId,
      has_url_context: !!url,
      current_sequence_id: sequenceId,
      accumulated_data_points: audioDataRef.current.length
    });
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      logger.debug('Cleared transcription interval timer', {
        hook: 'useTranscriptionAPI',
        record_id: recordId
      });
    }
    
    setIsTranscribing(false);
    
    try {
      logger.info('Calling endTranscription API', {
        hook: 'useTranscriptionAPI',
        method: 'stopTranscription',
        record_id: recordId,
        endpoint: '/api/V2/account/records/end_transcription',
        has_url_context: !!url
      });
      
      const response = await transcriptionService.endTranscription(recordId, url);
      
      logger.info('Successfully ended transcription', {
        hook: 'useTranscriptionAPI',
        method: 'stopTranscription',
        record_id: recordId,
        response_status: 'success'
      });
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(response);
      }
      
      return response;
    } catch (error: any) {
      logger.error('Failed to end transcription', {
        hook: 'useTranscriptionAPI',
        method: 'stopTranscription',
        record_id: recordId,
        error: error?.message || 'Unknown error',
        has_url_context: !!url
      });
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  };

  const sendAudioChunk = async () => {
    if (!isTranscribing) return;
    
    try {
      const audioData = audioDataRef.current;
      
      const response = await transcriptionService.sendAudioChunkForTranscription(
        recordId,
        sequenceId,
        audioData
      );
      
      if (response !== null) {
        setSequenceId(prev => prev + 1);
        
        audioDataRef.current = [];
      }
      
      return response;
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  const updateAudioData = (newAudioData: any[]) => {
    if (Array.isArray(newAudioData) && newAudioData.length > 0) {
      audioDataRef.current = [...audioDataRef.current, ...newAudioData];
    }
  };

  return {
    startTranscription,
    stopTranscription,
    sendAudioChunk,
    updateAudioData,
    isTranscribing,
    sequenceId,
  };
};

export default useTranscriptionAPI;