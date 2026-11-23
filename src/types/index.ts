export type UserRole = 'mahasiswa' | 'admin';
export type UserStatus = 'aktif' | 'peringatan' | 'banned';

export interface User {
  id: number;
  name: string;
  nim?: string;
  number_id?: string | null;
  email: string;
  role: UserRole;
  credit_score: number;
  status: UserStatus;
  banned_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type BookingStatus =
  | 'diajukan'
  | 'disetujui'
  | 'menunggu_bayar'
  | 'terkonfirmasi'
  | 'ditolak'
  | 'dilepas'
  | 'dibatalkan'
  | 'selesai';

export interface RoomType {
  id: number;
  name: string; // Kelas, laboratorium, auditorium
  requires_payment: boolean;
  fee_amount?: number;
}

export interface Room {
  id: number;
  name: string;
  building: string; // FTI, FMIPA, FPI, FK, FH, GKU
  faculty?: string;
  capacity: number;
  status: 'tersedia' | 'rusak';
  facilities?: string;
  room_type_id: number;
  floor?: string;
  type_name?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  user?: User;
  organization_id?: number | null;
  organization_name?: string | null;
  room_id: number;
  room?: Room;
  purpose: string;
  start_at: string; // ISO
  end_at: string; // ISO
  date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  daily_start_hour: number; // 7..20
  daily_end_hour: number; // 8..21
  status: BookingStatus;
  approved_by?: number | null;
  rejection_reason?: string | null;
  decision_deadline_at?: string;
  confirm_deadline_at?: string;
  confirmed_at?: string;
  on_behalf_of?: string | null;
  permit_docs?: string[];
  created_at: string;
}

export interface DamageReport {
  id: number;
  room_id: number;
  room?: Room;
  booking_id?: number | null;
  reported_by: number;
  reporter?: User;
  category?: string;
  description: string;
  photos: string[];
  status: 'dilaporkan' | 'ditangani' | 'selesai';
  is_urgent?: boolean;
  cause: 'belum_dinilai' | 'lalai' | 'bukan_lalai';
  handled_by?: number | null;
  created_at: string;
}

export interface CreditScoreLog {
  id: number;
  user_id: number;
  booking_id?: number | null;
  damage_report_id?: number | null;
  event_type: string;
  points_delta: number;
  score_after: number;
  note?: string;
  created_at: string;
}

export interface SlotAvailability {
  hour: number; // 7..20 (jam mulai slot 1 jam, misal 7 = 07:00-08:00)
  label: string; // "07:00", "08:00", dsb.
  status: 'kosong' | 'menunggu' | 'terisi';
  booking?: Booking;
}

export interface RoomAvailability {
  room: Room;
  slots: SlotAvailability[];
}
