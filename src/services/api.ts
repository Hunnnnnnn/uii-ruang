import axios, { AxiosError } from 'axios';
import { User, Room, RoomType, Booking, DamageReport } from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://100.73.128.8:8085/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach Bearer token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('uiiruang_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('uiiruang_token');
    }
    return Promise.reject(error);
  }
);

// Helper function to extract validation or server error messages
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as {
      message?: string;
      errors?: Record<string, string[]>;
    };

    if (data.errors && typeof data.errors === 'object') {
      const keys = Object.keys(data.errors);
      if (keys.length > 0 && Array.isArray(data.errors[keys[0]]) && data.errors[keys[0]].length > 0) {
        return data.errors[keys[0]][0];
      }
    }

    if (data.message) {
      return data.message;
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('Network Error') || (error as { code?: string }).code === 'ERR_NETWORK') {
      return 'Koneksi ke backend Tailscale gagal. Pastikan Tailscale Anda aktif.';
    }
    return error.message;
  }

  return 'Terjadi kesalahan sistem. Silakan coba kembali.';
}

export interface AuthLoginResponse {
  user: User;
  token: string;
}

export interface AuthRegisterResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthLoginResponse> => {
    const response = await apiClient.post<AuthLoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    number_id: string;
  }): Promise<AuthRegisterResponse> => {
    const response = await apiClient.post<AuthRegisterResponse>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  getMe: async (): Promise<{ data: User }> => {
    const response = await apiClient.get<{ data: User }>('/me');
    return response.data;
  },

  getStudentProfile: async (): Promise<{ success: boolean; user: User; message: string }> => {
    const response = await apiClient.get<{ success: boolean; user: User; message: string }>(
      '/student/profile'
    );
    return response.data;
  },

  getAdminProfile: async (): Promise<{ success: boolean; user: User; message: string }> => {
    const response = await apiClient.get<{ success: boolean; user: User; message: string }>(
      '/admin/profile'
    );
    return response.data;
  },
};

export interface AvailabilitySlot {
  start?: string;
  end?: string;
  hour?: number;
  label?: string;
  status: 'kosong' | 'menunggu' | 'terisi';
  booking?: {
    id: number;
    status: string;
    purpose?: string;
  };
}

export interface AvailabilityRoom {
  id: number;
  name: string;
  building: string;
  capacity: number;
  facilities?: string;
  slots: AvailabilitySlot[];
}

export interface AvailabilityResponse {
  date: string;
  can_submit: boolean;
  rooms: AvailabilityRoom[];
}

export const roomsApi = {
  getRooms: async (): Promise<Room[]> => {
    const response = await apiClient.get<{ data?: Room[] } | Room[]>('/rooms');
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.data)) return response.data.data;
    return [];
  },

  getRoomTypes: async (): Promise<RoomType[]> => {
    const response = await apiClient.get<{ data?: RoomType[] } | RoomType[]>('/room-types');
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.data)) return response.data.data;
    return [];
  },

  getAvailability: async (
    room_type_id: number,
    date: string
  ): Promise<AvailabilityResponse> => {
    const response = await apiClient.get<AvailabilityResponse>('/availability', {
      params: { room_type_id, date },
    });
    return response.data;
  },

  getOrganizations: async (): Promise<Array<{ id: number; name: string }>> => {
    const response = await apiClient.get<{ data?: Array<{ id: number; name: string }> }>('/organizations');
    return response.data?.data || [];
  },
};

export const bookingsApi = {
  getMyBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get<{ data?: Booking[] } | Booking[]>('/bookings');
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.data)) return response.data.data;
    return [];
  },

  getBookingDetail: async (id: number): Promise<Booking> => {
    const response = await apiClient.get<{ data: Booking }>(`/bookings/${id}`);
    return response.data.data;
  },

  createBooking: async (formData: FormData): Promise<{ message: string; data: Booking }> => {
    const response = await apiClient.post<{ message: string; data: Booking }>(
      '/bookings',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  cancelBooking: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/bookings/${id}/cancel`);
    return response.data;
  },
};

export const adminBookingsApi = {
  getAllBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get<{ data?: Booking[] } | Booking[]>('/admin/bookings');
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.data)) return response.data.data;
    return [];
  },

  getBookingDetail: async (id: number): Promise<Booking> => {
    const response = await apiClient.get<{ data: Booking }>(`/admin/bookings/${id}`);
    return response.data.data;
  },

  approveBooking: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/admin/bookings/${id}/approve`);
    return response.data;
  },

  rejectBooking: async (id: number, reason: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/admin/bookings/${id}/reject`, {
      rejection_reason: reason,
    });
    return response.data;
  },
};

export const damageReportsApi = {
  getMyReports: async (): Promise<DamageReport[]> => {
    const response = await apiClient.get<{ data?: DamageReport[] } | DamageReport[]>('/damage-reports');
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.data)) return response.data.data;
    return [];
  },

  createReport: async (formData: FormData): Promise<{ message: string; data: DamageReport }> => {
    const response = await apiClient.post<{ message: string; data: DamageReport }>(
      '/damage-reports',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

export const adminDamageReportsApi = {
  getAllReports: async (): Promise<DamageReport[]> => {
    const response = await apiClient.get<{ data?: DamageReport[] } | DamageReport[]>(
      '/admin/damage-reports'
    );
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.data)) return response.data.data;
    return [];
  },

  updateStatus: async (
    id: number,
    status: 'dilaporkan' | 'ditangani' | 'selesai'
  ): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(
      `/admin/damage-reports/${id}/status`,
      { status }
    );
    return response.data;
  },

  assessReport: async (
    id: number,
    cause: 'lalai' | 'bukan_lalai'
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/admin/damage-reports/${id}/assess`,
      { cause }
    );
    return response.data;
  },
};

