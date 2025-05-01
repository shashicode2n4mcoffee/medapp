import apiClient, { ApiResponse } from './apiClient';

// Define types
interface User {
  id: string;
  email: string;
  name: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Authentication service to handle all auth-related API calls
 */
class AuthService {
  /**
   * Authenticate user and get token
   * @param email - User email
   * @param password - User password
   * @returns Promise with login response containing user and token
   */
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<any>('/api/V2/account/auth/login', { email, password });
    
    if (response.success && response.data) {
      // Standardize the response structure
      return {
        success: true,
        data: {
          user: response.data.user,
          token: response.data.token || response.data.accessToken,
        },
        statusCode: response.statusCode,
      };
    }
    
    // If there was an error, pass it through
    return response;
  }

  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Promise with registration response
   */
  async register(userData: { email: string; password: string; name: string }): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/register', userData);
  }

  /**
   * Request password reset
   * @param email - User email
   * @returns Promise with response
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    return apiClient.post('/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Promise with response
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return apiClient.post('/auth/reset-password', { token, password: newPassword });
  }

  /**
   * Logout user (invalidate token on the server)
   * @returns Promise with response
   */
  async logout(): Promise<ApiResponse> {
    return apiClient.post('/auth/logout');
  }

  /**
   * Get current authenticated user profile
   * @returns Promise with user data
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me');
  }
}

// Export singleton instance
export const authService = new AuthService();

// Default export
export default authService;