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

export type ConfirmWindowState = 'not_opened' | 'open' | 'closed';

export interface ConfirmWindowInfo {
  state: ConfirmWindowState;
  hoursLeftUntilOpen: number;
  openDate: Date | null;
  deadlineDate: Date | null;
  formattedOpenDate: string;
}

/**
 * Menghitung status jendela konfirmasi H-3 sesuai aturan BR-13 & FR-09 Tech Spec:
 * - Jendela konfirmasi DIBUKA 72 jam sebelum waktu mulai acara (H-3)
 * - Jendela konfirmasi DITUTUP 48 jam sebelum waktu mulai acara (H-2)
 *
 * Nilai status:
 * - 'not_opened': Sisa waktu masih > 72 jam (Belum H-3, mahasiswa belum boleh check-in)
 * - 'open': Sisa waktu berada di antara 48 jam s.d. 72 jam (Jendela Konfirmasi Sedang Buka)
 * - 'closed': Sisa waktu < 48 jam atau acara telah berlangsung
 */
export function getConfirmWindowState(
  booking: Pick<Booking, 'start_at' | 'date' | 'daily_start_hour'>,
  now: Date = new Date()
): ConfirmWindowInfo {
  let startDate: Date | null = null;
  if (booking.start_at) {
    const isoStr =
      booking.start_at.includes(' ') && !booking.start_at.includes('T')
        ? booking.start_at.replace(' ', 'T')
        : booking.start_at;
    const s = new Date(isoStr);
    if (!isNaN(s.getTime())) startDate = s;
  }
  if (!startDate && booking.date) {
    let cleanDate = booking.date;
    if (cleanDate.includes('/')) {
      const parts = cleanDate.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        cleanDate = `${year}-${month}-${day}`;
      }
    }
    const sH = booking.daily_start_hour ?? 7;
    const timeStr = `${cleanDate}T${String(sH).padStart(2, '0')}:00:00`;
    const s = new Date(timeStr);
    if (!isNaN(s.getTime())) startDate = s;
  }

  if (!startDate || isNaN(startDate.getTime())) {
    return {
      state: 'not_opened',
      hoursLeftUntilOpen: 999,
      openDate: null,
      deadlineDate: null,
      formattedOpenDate: '-',
    };
  }

  // Sesuai BR-13 & FR-09 Tech Spec:
  // Waktu buka: 72 jam sebelum waktu mulai kegiatan (H-3)
  const openMs = startDate.getTime() - 72 * 60 * 60 * 1000;
  // Waktu tutup: 48 jam sebelum waktu mulai kegiatan (H-2 deadline)
  const deadlineMs = startDate.getTime() - 48 * 60 * 60 * 1000;
  const nowMs = now.getTime();

  const openDate = new Date(openMs);
  const deadlineDate = new Date(deadlineMs);

  const formattedOpenDate = openDate.toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (nowMs < openMs) {
    const hoursLeftUntilOpen = Math.ceil((openMs - nowMs) / (1000 * 60 * 60));
    return {
      state: 'not_opened',
      hoursLeftUntilOpen,
      openDate,
      deadlineDate,
      formattedOpenDate,
    };
  } else if (nowMs >= openMs && nowMs <= deadlineMs) {
    return {
      state: 'open',
      hoursLeftUntilOpen: 0,
      openDate,
      deadlineDate,
      formattedOpenDate,
    };
  } else {
    return {
      state: 'closed',
      hoursLeftUntilOpen: 0,
      openDate,
      deadlineDate,
      formattedOpenDate,
    };
  }
}
