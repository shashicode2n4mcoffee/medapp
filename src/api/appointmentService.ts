import apiClient, { ApiResponse } from './apiClient';
import logger from '../utils/logger';

// Define appointment types
export interface AppointmentMetadata {
  age: string;
  sex_at_birth: string;
}

export interface Appointment {
  id: number;
  identifier: string;
  appointment_name: string;
  appointment_time: string;
  appointment_start_time: string;
  appointment_type: string;
  doctor: number;
  patient: number | null;
  reason_for_visit: string;
  metadata: AppointmentMetadata;
  appointment_status: string;
  emr_push_status: string;
}

export interface AppointmentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Appointment[];
}

export interface GetAppointmentsParams {
  appointment_date_start: string;
  appointment_date_end: string;
  status?: string;
  limit?: number;
  offset?: number;
  order_by_desc?: boolean;
}

export interface CreateRecordRequest {
  appointment_id: number;
  start_time: string;
  content_type: string;
  file_type: string;
}

export interface CreateRecordResponse {
  record_id: number;
  appointment_id: number;
}

// Define the interfaces for the signed URL API
export interface SignedUrlRequest {
  record_id: number;
}

export interface SignedUrlResponse {
  url: string;
  fields: {
    'Content-Type': string;
    key: string;
    AWSAccessKeyId: string;
    'x-amz-security-token': string;
    policy: string;
    signature: string;
  };
  record_id: number;
  expiration: string;
}

/**
 * Appointment service to handle all appointment-related API calls
 */
class AppointmentService {
  /**
   * Get appointments list with optional filters
   * @param params - Filter parameters for the appointment list
   * @returns Promise with appointment list response
   */
  async getAppointments(params: GetAppointmentsParams): Promise<ApiResponse<AppointmentListResponse>> {
    // Convert params to query string
    const queryParams = new URLSearchParams();
    
    // Add all params to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = `/api/V2/account/appointments/?${queryParams.toString()}`;
    
    return apiClient.get<AppointmentListResponse>(url);
  }
  /**
   * Create a new record for an appointment
   * @param data - Record creation data
   * @returns Promise with record creation response
   */
  async createRecord(data: CreateRecordRequest): Promise<ApiResponse<CreateRecordResponse>> {
    const url = '/api/V2/account/records/create/';
    return apiClient.post<CreateRecordResponse>(url, data);
  }
  /**
   * Get a signed URL for uploading audio recording
   * @param data - Request with record_id
   * @returns Promise with signed URL response
   */
  async getSignedUrl(data: SignedUrlRequest): Promise<ApiResponse<SignedUrlResponse>> {
    const url = '/api/V2/account/records/signed_url/';
    
    // Log the request payload
    if (logger) {
      logger.info('Getting signed URL with payload:', {
        endpoint: '/api/V2/account/records/signed_url/',
        record_id: data.record_id,
      });
    }
    
    const response = await apiClient.post<SignedUrlResponse>(url, data);
    
    // Log the response
    if (logger && response.success) {
      logger.debug('Successfully received signed URL', {
        record_id: data.record_id,
        url_expiration: response.data?.expiration,
        has_fields: !!response.data?.fields,
      });
    }
    
    return response;
  }

  /**
   * Get appointment details by ID
   * @param appointmentId - ID of the appointment
   * @returns Promise with appointment details
   */
  async getAppointmentDetail(appointmentId: number): Promise<ApiResponse<Appointment>> {
    const url = `/api/V2/account/appointment/${appointmentId}/detail/`;
    return apiClient.get<Appointment>(url);
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();

// Default export
export default appointmentService;