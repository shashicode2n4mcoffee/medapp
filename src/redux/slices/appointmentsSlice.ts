import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  appointmentService,
  AppointmentListResponse,
  Appointment,
  GetAppointmentsParams,
  CreateRecordRequest,
  CreateRecordResponse,
  SignedUrlRequest,
  SignedUrlResponse,
} from '../../api/appointmentService';
import apiClient from '../../api/apiClient';
import {format} from 'date-fns';
import logger from '../../utils/logger';

interface TranscribeAudioChunkResponse {
  status: string;
}

interface AppointmentsState {
  appointments: Appointment[];
  total: number;
  loading: boolean;
  error: string | null;
  currentParams: GetAppointmentsParams;
  record: CreateRecordResponse | null;
  selectedAppointmentDetail: Appointment | null;
  signedUrlResponse: SignedUrlResponse | null;
  transcribeAudioChunk: TranscribeAudioChunkResponse | null;
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

// Helper function to get date from N days ago
const getDateFromDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return format(date, 'yyyy-MM-dd');
};

const initialState: AppointmentsState = {
  appointments: [],
  total: 0,
  loading: false,
  error: null,
  currentParams: {
    appointment_date_start: getTodayDate(),
    appointment_date_end: getTodayDate(),
    status: 'in_progress',
    limit: 30,
    offset: 0,
    order_by_desc: true,
  },  
  record: null,
  selectedAppointmentDetail: null,
  signedUrlResponse: null,
  transcribeAudioChunk: null,
};

export const fetchAppointments = createAsyncThunk<
  AppointmentListResponse,
  GetAppointmentsParams | undefined,
  {rejectValue: string; state: {appointments: AppointmentsState}}
>(
  'appointments/fetchAppointments',
  async (params, {getState, rejectWithValue}) => {
    try {
      // Use provided params or get from current state
      let requestParams: GetAppointmentsParams;

      if (params) {
        requestParams = params;
      } else {
        // Get current parameters from state
        const state = getState();
        if (!state.appointments || !state.appointments.currentParams) {
          // If state or currentParams is not properly initialized, use default parameters
          requestParams = {
            appointment_date_start: getTodayDate(),
            appointment_date_end: getTodayDate(),
            limit: 30,
            offset: 0,
            order_by_desc: true,
          };
        } else {
          requestParams = state.appointments.currentParams;
        }
      }

      const response = await appointmentService.getAppointments(requestParams);

      if (!response.success || !response.data) {
        return rejectWithValue(
          response.error?.message || 'Failed to fetch appointments',
        );
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message ||
          'An unknown error occurred while fetching appointments',
      );
    }
  },
);

export const createRecord = createAsyncThunk<
  CreateRecordResponse,
  CreateRecordRequest,
  {rejectValue: string}
>('appointments/createRecord', async (data, {rejectWithValue}) => {
  try {
    const response = await appointmentService.createRecord(data);

    if (!response.success || !response.data) {
      return rejectWithValue(
        response.error?.message || 'Failed to create record',
      );
    }

    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.message || 'An unknown error occurred while creating record',
    );
  }
});

export const fetchAppointmentDetail = createAsyncThunk<
  Appointment,
  number,
  {rejectValue: string}
>('appointments/fetchAppointmentDetail', async (appointmentId, {rejectWithValue}) => {
  try {
    const response = await appointmentService.getAppointmentDetail(appointmentId);

    if (!response.success || !response.data) {
      return rejectWithValue(
        response.error?.message || 'Failed to fetch appointment details',
      );
    }

    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.message || 'An unknown error occurred while fetching appointment details',
    );
  }
});

export const getAudioRecordingSignedUrl = createAsyncThunk<
  SignedUrlResponse,
  SignedUrlRequest,
  {rejectValue: string}
>('appointments/getAudioRecordingSignedUrl', async (data, {rejectWithValue}) => {  try {
    // Log the Redux action dispatch
    logger.info('Dispatching getAudioRecordingSignedUrl action:', {
      action: 'getAudioRecordingSignedUrl',
      record_id: data.record_id
    });
    
    const response = await appointmentService.getSignedUrl(data);

    if (!response.success || !response.data) {
      logger.error('Failed to get signed URL', {
        action: 'getAudioRecordingSignedUrl',
        record_id: data.record_id,
        error: response.error
      });
      return rejectWithValue(
        response.error?.message || 'Failed to get signed URL',
      );
    }
    
    logger.info('Successfully completed getAudioRecordingSignedUrl action', {
      action: 'getAudioRecordingSignedUrl',
      record_id: data.record_id,
      has_url: !!response.data.url,
      expiration: response.data.expiration
    });

    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.message || 'An unknown error occurred while getting signed URL',
    );
  }
});

interface TranscribeAudioChunkRequest {
  recordId: number;
  sequenceId: number;
  audioData: any[];
}

export const transcribeAudioChunkAction = createAsyncThunk<
  TranscribeAudioChunkResponse,
  TranscribeAudioChunkRequest,
  {rejectValue: string}
>('appointments/transcribeAudioChunk', async (data, {rejectWithValue}) => {
  try {
    // Create a FormData object for the request
    const formData = new FormData();
    
    // Convert audio data to appropriate format
    const audioBlob = new Blob([JSON.stringify(data.audioData)], { 
      type: 'application/json',
      lastModified: Date.now()
    });
      // Append the required fields to the FormData
    formData.append('audio', audioBlob);
    formData.append('sequence_id', data.sequenceId.toString());
    formData.append('record_id', data.recordId.toString());
    
    // Log the payload details from Redux action
    logger.info('Dispatching transcribeAudioChunk with payload:', {
      action: 'transcribeAudioChunkAction',
      endpoint: '/api/V2/account/records/transcribe_audio_chunk/',
      record_id: data.recordId,
      sequence_id: data.sequenceId,
      audio_data_length: data.audioData.length,
      audio_blob_size: audioBlob.size,
    });
    
    // Make the API call with FormData
    const response = await apiClient.post('/api/V2/account/records/transcribe_audio_chunk/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });    if (!response.data) {
      logger.error('Failed to transcribe audio chunk - empty response', {
        action: 'transcribeAudioChunkAction',
        record_id: data.recordId,
        sequence_id: data.sequenceId
      });
      return rejectWithValue('Failed to transcribe audio chunk');
    }

    logger.info('Successfully completed transcribeAudioChunk action', {
      action: 'transcribeAudioChunkAction',
      record_id: data.recordId,
      sequence_id: data.sequenceId,
      status: response.data.status || 'unknown'
    });

    return response.data;
  } catch (error: any) {
    logger.error('Exception in transcribeAudioChunkAction', {
      action: 'transcribeAudioChunkAction',
      record_id: data.recordId,
      sequence_id: data.sequenceId,
      error: error.message || 'Unknown error'
    });
    return rejectWithValue(
      error.message || 'An unknown error occurred while transcribing audio chunk'
    );
  }
});

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    updateParams: (
      state,
      action: PayloadAction<Partial<GetAppointmentsParams>>,
    ) => {
      state.currentParams = {
        ...state.currentParams,
        ...action.payload,
      };
    },
    clearAppointments: state => {
      state.appointments = [];
      state.total = 0;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAppointments.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAppointments.fulfilled,
        (state, action: PayloadAction<AppointmentListResponse>) => {
          state.loading = false;
          state.appointments = action.payload.results || [];
          state.total = action.payload.count || 0;
          state.error = null;
        },
      )
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'An error occurred';
      })
      // Add cases for createRecord
      .addCase(createRecord.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createRecord.fulfilled,
        (state, action: PayloadAction<CreateRecordResponse>) => {
          state.loading = false;
          state.record = action.payload;
          state.error = null;
        },
      )      .addCase(createRecord.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'An error occurred creating record';
      })
      // Add cases for fetchAppointmentDetail
      .addCase(fetchAppointmentDetail.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAppointmentDetail.fulfilled,
        (state, action: PayloadAction<Appointment>) => {
          state.loading = false;
          state.selectedAppointmentDetail = action.payload;
          state.error = null;
        },
      )      .addCase(fetchAppointmentDetail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'An error occurred fetching appointment details';
      })
      // Add cases for getAudioRecordingSignedUrl
      .addCase(getAudioRecordingSignedUrl.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAudioRecordingSignedUrl.fulfilled,
        (state, action: PayloadAction<SignedUrlResponse>) => {
          state.loading = false;
          state.signedUrlResponse = action.payload;
          state.error = null;
        },
      )      .addCase(getAudioRecordingSignedUrl.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'An error occurred getting signed URL';
      })
      // Add cases for transcribeAudioChunk
      .addCase(transcribeAudioChunkAction.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        transcribeAudioChunkAction.fulfilled,
        (state, action: PayloadAction<TranscribeAudioChunkResponse>) => {
          state.loading = false;
          state.transcribeAudioChunk = action.payload;
          state.error = null;
        },
      )
      .addCase(transcribeAudioChunkAction.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'An error occurred transcribing audio chunk';
      });
  },
});

export const {updateParams, clearAppointments, clearError} =
  appointmentsSlice.actions;

export default appointmentsSlice.reducer;
