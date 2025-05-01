import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../axios';

// Define types for our state
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

// Create login thunk action with axios
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // For development/testing - use dummy response if it matches test credentials
    //   if (email === 't@t.com' && password === 'ttttttt') {
    //     // Simulate API delay
    //     await new Promise(resolve => setTimeout(resolve, 1000));
        
    //     // Return dummy successful response
    //     return {
    //       user: {
    //         id: '1',
    //         email: 't@t.com',
    //         name: 'Test User',
    //       },
    //       token: 'dummy-jwt-token-12345',
    //     };
    //   }
      
      // Real API call using axios
      debugger; // This will pause execution when Chrome DevTools is open
      const response = await axiosInstance.post('/auth/login', { 
        email, 
        password 
      });
      
      // Process the API response
      return {
        user: response.data.user,
        token: response.data.token || response.data.accessToken,
      };
    } catch (error: any) {
      // Enhanced error handling
      if (error.response) {
        // The request was made and the server responded with an error status
        return rejectWithValue(
          error.response.data?.message || 
          error.response.data?.error || 
          `Login failed with status: ${error.response.status}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        return rejectWithValue('Network error: No response from server');
      }
      
      // Something else caused the error
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
      state.token = null;
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
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
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