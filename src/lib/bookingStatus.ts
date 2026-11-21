import { Booking } from '../types';

export type BookingTimeState = 'upcoming' | 'in_progress' | 'completed';

/**
 * Menghitung fase waktu peminjaman berdasarkan waktu saat ini:
 * - 'upcoming': Waktu sekarang belum mencapai jam mulai (Akan Datang / Siap Dipakai)
 * - 'in_progress': Waktu sekarang berada dalam jam peminjaman (Sedang Berlangsung / Digunakan)
 * - 'completed': Jam peminjaman telah lewat (Selesai)
 */
export function getBookingTimeState(
  booking: Pick<Booking, 'start_at' | 'end_at' | 'date' | 'daily_start_hour' | 'daily_end_hour'>,
  now: Date = new Date()
): BookingTimeState {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  // 1. Cek dari start_at & end_at (format ISO dari backend atau local fallback)
  if (booking.start_at && booking.end_at) {
    const s = new Date(booking.start_at);
    const e = new Date(booking.end_at);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      startDate = s;
      endDate = e;
    }
  }

  // 2. Fallback jika hanya ada date dan daily_start_hour / daily_end_hour
  if (!startDate || !endDate) {
    if (booking.date) {
      let year = now.getFullYear();
      let month = now.getMonth();
      let day = now.getDate();

      if (booking.date.includes('-')) {
        const parts = booking.date.split('-');
        if (parts.length === 3) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        }
      } else if (booking.date.includes('/')) {
        const parts = booking.date.split('/');
        if (parts.length === 3) {
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          year = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
        }
      }

      const sHour = booking.daily_start_hour ?? 7;
      const eHour = booking.daily_end_hour ?? (sHour + 2);

      startDate = new Date(year, month, day, sHour, 0, 0);
      endDate = new Date(year, month, day, eHour, 0, 0);
    }
  }

  if (!startDate || !endDate) {
    return 'upcoming';
  }

  const nowMs = now.getTime();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  if (nowMs < startMs) {
    return 'upcoming';
  }
  if (nowMs > endMs) {
    return 'completed';
  }
  return 'in_progress';
}
