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
    
    sendAudioChunk();
    
    intervalRef.current = setInterval(() => {
      sendAudioChunk();
    }, intervalMilliseconds);
    
    logger.debug('Started audio chunk transcription', { 
      recordId, 
      intervalMilliseconds 
    });
  };

  const stopTranscription = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsTranscribing(false);
    
    try {
      const response = await transcriptionService.endTranscription(recordId);
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(response);
      }
      
      return response;
    } catch (error) {
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