import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../api';

// Define types for our state
interface EmrSystemDetails {
  id: number;
  emr_name: string;
  emr_version: string;
  emr_verbose_name: string;
  emr_code: string;
}

interface Settings {
  [key: string]: string;
}

interface User {
  user_id: number;
  practitioner_id: number;
  practitioner_role: string;
  first_name: string;
  last_name: string;
  timezone: string;
  language: string;
  has_accepted_terms: boolean;
  settings: Settings;
  is_emr_linked: boolean;
  emr_system_details: EmrSystemDetails;
  speciality: string;
  email: string;
  license_number: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

// Define the type for loginUser thunk returned payload
interface LoginUserPayload {
  user: User;
}

// Create login thunk action using authService
export const loginUser = createAsyncThunk<
  LoginUserPayload,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      
      if (!response.success || !response.data) {
        return rejectWithValue(
          response.error?.message || 
          'Login failed'
        );
      }
      
      // Return the user data from response.data
      return {
        user: response.data as User,
      };
    } catch (error: any) {
      // Fallback error handling
      return rejectWithValue(error.message || 'An unknown error occurred during login');
    }
  }
);

// Create auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Manual actions
    logout: (state) => {
      state.user = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login request
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Login success
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginUserPayload>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
      })
      // Login failure
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { logout, clearError } = authSlice.actions;

// Export reducer
export default authSlice.reducer;