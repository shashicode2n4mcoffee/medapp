import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  appointmentService,
  AppointmentListResponse,
  Appointment,
  GetAppointmentsParams,
  CreateRecordRequest,
  CreateRecordResponse,
} from '../../api/appointmentService';
import {format} from 'date-fns';

interface AppointmentsState {
  appointments: Appointment[];
  total: number;
  loading: boolean;
  error: string | null;
  currentParams: GetAppointmentsParams;
  record: CreateRecordResponse | null;
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
      )
      .addCase(createRecord.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'An error occurred creating record';
      });
  },
});

export const {updateParams, clearAppointments, clearError} =
  appointmentsSlice.actions;

export default appointmentsSlice.reducer;
