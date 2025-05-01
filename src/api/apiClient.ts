// filepath: c:\Projects\aiapp\AIApp\src\api\apiClient.ts
import axiosInstance from '../axios/instance';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Interface for API response
 * @template T - The type of data returned by the API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  statusCode?: number;
}

/**
 * Generic API class with methods for making HTTP requests
 */
class ApiClient {
  /**
   * Make a GET request to the specified endpoint
   * 
   * @param endpoint - The API endpoint to call
   * @param params - Query parameters 
   * @param config - Additional axios config
   * @returns Promise with the response data
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await axiosInstance.get(endpoint, {
        params,
        ...config,
      });
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Make a POST request to the specified endpoint
   * 
   * @param endpoint - The API endpoint to call
   * @param data - The data to send in the request body
   * @param config - Additional axios config
   * @returns Promise with the response data
   */
  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await axiosInstance.post(endpoint, data, config);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Make a PUT request to the specified endpoint
   * 
   * @param endpoint - The API endpoint to call
   * @param data - The data to send in the request body
   * @param config - Additional axios config
   * @returns Promise with the response data
   */
  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await axiosInstance.put(endpoint, data, config);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Make a PATCH request to the specified endpoint
   * 
   * @param endpoint - The API endpoint to call
   * @param data - The data to send in the request body
   * @param config - Additional axios config
   * @returns Promise with the response data
   */
  async patch<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await axiosInstance.patch(endpoint, data, config);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Make a DELETE request to the specified endpoint
   * 
   * @param endpoint - The API endpoint to call
   * @param config - Additional axios config
   * @returns Promise with the response data
   */
  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await axiosInstance.delete(endpoint, config);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Handle API errors and standardize the error response format
   * 
   * @param error - The error object from axios
   * @returns Standardized error response
   */
  private handleApiError<T = any>(error: any): ApiResponse<T> {
    const errorResponse: ApiResponse<T> = {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
      statusCode: 500,
    };

    if (error.response) {
      // Server responded with an error status code
      errorResponse.statusCode = error.response.status;
      errorResponse.error = {
        code: `ERROR_${error.response.status}`,
        message: error.response.data?.message || `Error ${error.response.status}`,
        details: error.response.data,
      };
    } else if (error.request) {
      // Request was made but no response received
      errorResponse.error = {
        code: 'NETWORK_ERROR',
        message: 'Network error, no response received from server',
        details: error.request,
      };
    } else {
      // Something happened in setting up the request
      errorResponse.error = {
        code: 'REQUEST_SETUP_ERROR',
        message: error.message || 'Error setting up the request',
      };
    }

    return errorResponse;
  }

  /**
   * Upload a file to the specified endpoint
   * 
   * @param endpoint - The API endpoint to upload to
   * @param file - The file to upload
   * @param fieldName - The field name for the file in the form data
   * @param additionalData - Any additional data to include in the form
   * @param config - Additional axios config
   * @returns Promise with the response data
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: any,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      // Add any additional data to the form
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response: AxiosResponse = await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config,
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Download a file from the specified endpoint
   * 
   * @param endpoint - The API endpoint to download from
   * @param params - Query parameters
   * @param config - Additional axios config
   * @returns Promise with the response data including a blob
   */
  async downloadFile<T = Blob>(
    endpoint: string, 
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await axiosInstance.get(endpoint, {
        params,
        responseType: 'blob',
        ...config,
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Make a request with custom configuration
   * 
   * @param config - Complete axios request config
   * @returns Promise with the response data
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await axiosInstance.request(config);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError<T>(error);
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Default export for direct import
export default apiClient;