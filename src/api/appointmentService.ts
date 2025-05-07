import apiClient, { ApiResponse } from './apiClient';

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
}

// Export singleton instance
export const appointmentService = new AppointmentService();

// Default export
export default appointmentService;