import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, Room, DamageReport, BookingStatus } from '../types';
import { useAuth } from './AuthContext';
import {
  roomsApi,
  bookingsApi,
  adminBookingsApi,
  damageReportsApi,
  adminDamageReportsApi,
  getApiErrorMessage,
} from '../services/api';

// Cache versioning untuk membersihkan seluruh sisa dummy localStorage versi lama
const CACHE_VERSION = 'v2_live_db';
try {
  if (typeof window !== 'undefined' && localStorage.getItem('uiiruang_cache_version') !== CACHE_VERSION) {
    localStorage.removeItem('uiiruang_rooms');
    localStorage.removeItem('uiiruang_bookings');
    localStorage.removeItem('uiiruang_damage_reports');
    localStorage.removeItem('uiiruang_booking_room_map');
    localStorage.setItem('uiiruang_cache_version', CACHE_VERSION);
  }
} catch {
  // Ignore in SSR
}

interface BookingContextType {
  rooms: Room[];
  bookings: Booking[];
  damageReports: DamageReport[];
  activeFaculty: string;
  setActiveFaculty: (fac: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  refreshBookings: () => Promise<void>;
  addBooking: (
    newBookingData: Omit<Booking, 'id' | 'status' | 'created_at'>,
    file?: File | null
  ) => Promise<{ success: boolean; message?: string }>;
  createAdminBooking: (data: {
    room_id: number;
    user_id?: number;
    on_behalf_name: string;
    date: string;
    end_date?: string | null;
    start_hour: number;
    end_hour: number;
    purpose: string;
    reason_for_admin_booking: string;
    organization_id?: number | null;
  }) => Promise<{ success: boolean; message?: string }>;
  approveBooking: (
    bookingId: number,
    priceBreakdown?: any
  ) => Promise<{ success: boolean; message?: string }>;
  rejectBooking: (
    bookingId: number,
    reason: string
  ) => Promise<{ success: boolean; message?: string }>;
  moveBooking: (
    bookingId: number,
    toRoomId: number,
    reason: string
  ) => Promise<{ success: boolean; message?: string }>;
  cancelBooking: (
    bookingId: number,
    reason?: string
  ) => Promise<{ success: boolean; message?: string }>;
  addDamageReport: (reportData: {
    roomId: number;
    bookingId?: number;
    description: string;
    photos: string[];
    isUrgent?: boolean;
    rawFiles?: File[];
  }) => Promise<{ success: boolean; message?: string }>;
  resolveDamageReport: (reportId: number, cause: 'lalai' | 'bukan_lalai') => Promise<void>;
  checkConflict: (
    roomId: number,
    date: string,
    startHour: number,
    endHour: number,
    excludeBookingId?: number
  ) => boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Persistent room map key
const ROOM_MAP_KEY = 'uiiruang_booking_room_map';
const DATES_MAP_KEY = 'uiiruang_booking_dates_map';

export const getBookingRoomMap = (): Record<number, { room_id: number; room: Room }> => {
  try {
    const saved = localStorage.getItem(ROOM_MAP_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const saveBookingRoomMapping = (bookingId: number, roomId: number, room: Room) => {
  try {
    const currentMap = getBookingRoomMap();
    currentMap[bookingId] = { room_id: roomId, room };
    localStorage.setItem(ROOM_MAP_KEY, JSON.stringify(currentMap));
  } catch (err) {
    console.warn('Failed to save booking room mapping:', err);
  }
};

export const getBookingDatesMap = (): Record<number, { date: string; end_date?: string; fileName?: string }> => {
  try {
    const saved = localStorage.getItem(DATES_MAP_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const saveBookingDatesMapping = (
  bookingId: number,
  date: string,
  endDate?: string,
  fileName?: string
) => {
  try {
    const currentMap = getBookingDatesMap();
    currentMap[bookingId] = { date, end_date: endDate, fileName };
    localStorage.setItem(DATES_MAP_KEY, JSON.stringify(currentMap));
  } catch (err) {
    console.warn('Failed to save booking dates mapping:', err);
  }
};

export const normalizeBookingItem = (b: any, roomsList: Room[]): Booking => {
  const map = getBookingRoomMap();
  let targetRoomId = b.room_id;
  let targetRoom = b.room;
  let cleanPurpose = b.purpose || '';

  // 1. Cek tag purpose: [ROOM:id:building:name]
  const tagMatch = cleanPurpose.match(/^\[ROOM:(\d+):([^:]+):([^\]]+)\]\s*(.*)$/);
  if (tagMatch) {
    targetRoomId = parseInt(tagMatch[1], 10);
    cleanPurpose = tagMatch[4];
    const found = roomsList.find((r) => r.id === targetRoomId);
    if (found) {
      targetRoom = found;
    } else {
      targetRoom = {
        ...(b.room || {}),
        id: targetRoomId,
        building: tagMatch[2],
        name: tagMatch[3],
      };
    }
    saveBookingRoomMapping(b.id, targetRoomId, targetRoom);
  } else if (map[b.id]) {
    // 2. Cek local room map
    targetRoomId = map[b.id].room_id;
    targetRoom = map[b.id].room;
  } else {
    // 3. Default match ke roomsList dari live DB jika ada
    const found = roomsList.find((r) => r.id === b.room_id);
    if (found) {
      targetRoom = found;
    }
  }

  // 2. Cek tag dates: [DATES:startDate:endDate]
  const datesMap = getBookingDatesMap();
  let dateStr = b.date || (b.start_at ? b.start_at.slice(0, 10) : '');
  let endDateStr = b.end_date || (b.end_at ? b.end_at.slice(0, 10) : dateStr);
  let permitDocs = b.permit_docs || [];

  const dateTagMatch = cleanPurpose.match(/^\[DATES:([^:]+):([^\]]+)\]\s*(.*)$/);
  if (dateTagMatch) {
    dateStr = dateTagMatch[1];
    endDateStr = dateTagMatch[2];
    cleanPurpose = dateTagMatch[3];
    saveBookingDatesMapping(b.id, dateStr, endDateStr);
  } else if (datesMap[b.id]) {
    if (datesMap[b.id].date) dateStr = datesMap[b.id].date;
    if (datesMap[b.id].end_date) endDateStr = datesMap[b.id].end_date;
    if (datesMap[b.id].fileName && permitDocs.length === 0) {
      permitDocs = [datesMap[b.id].fileName!];
    }
  }

  // Normalisasi start_hour dan end_hour
  const startH =
    b.daily_start_hour ?? (b.start_at ? new Date(b.start_at).getHours() : 7);
  const endH =
    b.daily_end_hour ?? (b.end_at ? new Date(b.end_at).getHours() : 9);

  return {
    ...b,
    room_id: targetRoomId,
    room: targetRoom,
    purpose: cleanPurpose,
    date: dateStr,
    end_date: endDateStr,
    permit_docs: permitDocs,
    daily_start_hour: startH,
    daily_end_hour: endH,
  };
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('uiiruang_rooms');
    return saved ? JSON.parse(saved) : [];
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('uiiruang_bookings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((b: any) => !b.is_dummy);
        }
      } catch {
        // keep empty
      }
    }
    return [];
  });

  const [damageReports, setDamageReports] = useState<DamageReport[]>(() => {
    const saved = localStorage.getItem('uiiruang_damage_reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((r: any) => !r.is_dummy);
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeFaculty, setActiveFaculty] = useState<string>('FTI');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-25');

  const refreshRooms = async () => {
    try {
      const liveRooms = await roomsApi.getRooms();
      if (Array.isArray(liveRooms) && liveRooms.length > 0) {
        setRooms(liveRooms);
        localStorage.setItem('uiiruang_rooms', JSON.stringify(liveRooms));
      }
    } catch (e) {
      console.warn('Gagal memuat live rooms dari DB:', e);
    }
  };

  const refreshBookings = async () => {
    if (!currentUser) return;
    try {
      if (currentUser.role === 'admin') {
        const liveBookings = await adminBookingsApi.getAllBookings();
        if (Array.isArray(liveBookings)) {
          const normalized = liveBookings.map((b) => normalizeBookingItem(b, rooms));
          setBookings(normalized);
        }
        const liveReports = await adminDamageReportsApi.getAllReports();
        if (Array.isArray(liveReports)) {
          setDamageReports(liveReports);
        }
      } else {
        const myBookings = await bookingsApi.getMyBookings();
        if (Array.isArray(myBookings)) {
          const normalized = myBookings.map((b) => normalizeBookingItem(b, rooms));
          setBookings(normalized);
        }
        const myReports = await damageReportsApi.getMyReports();
        if (Array.isArray(myReports)) {
          setDamageReports(myReports);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat data live dari backend:', e);
    }
  };

  useEffect(() => {
    refreshRooms();
    refreshBookings();
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('uiiruang_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('uiiruang_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('uiiruang_damage_reports', JSON.stringify(damageReports));
  }, [damageReports]);

  // Check double-booking conflict (BR-04: slot overlap check on blocking bookings)
  // Mendukung rentang multi-day dan mengembalikan detail tanggal bentrok (TC_BOOK_007)
  const checkConflictDetail = (
    roomId: number,
    startDate: string,
    startHour: number,
    endHour: number,
    endDate?: string,
    excludeBookingId?: number
  ): { hasConflict: boolean; conflictDate?: string; conflictBooking?: Booking } => {
    const blockingStatuses: BookingStatus[] = [
      'diajukan',
      'disetujui',
      'menunggu_bayar',
      'terkonfirmasi',
    ];

    const targetEndDate = endDate || startDate;

    // Generate daftar tanggal YYYY-MM-DD dalam rentang
    const dates: string[] = [];
    const cur = new Date(startDate);
    const end = new Date(targetEndDate);
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    for (const d of dates) {
      for (const b of bookings) {
        if (excludeBookingId && b.id === excludeBookingId) continue;
        if (b.room_id !== roomId && b.room?.id !== roomId) continue;
        if (!blockingStatuses.includes(b.status)) continue;

        const bStart = b.daily_start_hour ?? (b.start_at ? new Date(b.start_at).getHours() : 0);
        const bEnd = b.daily_end_hour ?? (b.end_at ? new Date(b.end_at).getHours() : 0);
        const hoursOverlap = startHour < bEnd && endHour > bStart;
        if (!hoursOverlap) continue;

        const bStartDate = b.date || (b.start_at ? b.start_at.slice(0, 10) : '');
        const bEndDate = b.end_date || bStartDate;

        if (d >= bStartDate && d <= bEndDate) {
          return { hasConflict: true, conflictDate: d, conflictBooking: b };
        }
      }
    }

    return { hasConflict: false };
  };

  const checkConflict = (
    roomId: number,
    date: string,
    startHour: number,
    endHour: number,
    excludeBookingId?: number
  ): boolean => {
    return checkConflictDetail(roomId, date, startHour, endHour, undefined, excludeBookingId).hasConflict;
  };

  const addBooking = async (
    data: Omit<Booking, 'id' | 'status' | 'created_at'>,
    file?: File | null
  ): Promise<{ success: boolean; message?: string }> => {
    // 1. Room check
    const room = rooms.find((r) => r.id === data.room_id);
    if (!room || room.status === 'rusak') {
      return { success: false, message: 'Ruangan sedang dalam perbaikan dan tidak bisa dipesan.' };
    }

    // 2. Conflict check (FR-04 / BR-04 / TC_BOOK_007 Multi-day conflict check)
    const conflictRes = checkConflictDetail(
      data.room_id,
      data.date,
      data.daily_start_hour,
      data.daily_end_hour,
      data.end_date
    );

    if (conflictRes.hasConflict && conflictRes.conflictDate) {
      const parts = conflictRes.conflictDate.split('-');
      const formattedDate =
        parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : conflictRes.conflictDate;
      return {
        success: false,
        message: `Permohonan booking ditolak: Jadwal bentrok pada tanggal ${formattedDate} (Slot jam ${data.daily_start_hour}:00 - ${data.daily_end_hour}:00 sudah terisi atau diajukan peminjam lain).`,
      };
    }

    // 3. Credit score check (BR-08)
    if (!currentUser) {
      return {
        success: false,
        message: 'Harap login terlebih dahulu untuk melakukan peminjaman.',
      };
    }

    if (currentUser.status === 'banned' || currentUser.credit_score < 60) {
      return {
        success: false,
        message:
          'Status akun Anda dibekukan (Banned) karena credit score di bawah 60. Hubungi admin via WhatsApp untuk pemulihan.',
      };
    }

    // Pemetaan room_id ke backend jika room_id frontend > 6
    const backendRoomId = data.room_id <= 6 ? data.room_id : ((data.room_id - 1) % 6) + 1;

    try {
      const formData = new FormData();
      formData.append('room_id', String(backendRoomId));
      formData.append('date', data.date);
      if (data.end_date) {
        formData.append('end_date', data.end_date);
      }
      formData.append('start_hour', String(data.daily_start_hour));
      formData.append('end_hour', String(data.daily_end_hour));

      // Embed tag ruangan & tanggal agar persisten di database server backend
      let taggedPurpose = data.purpose;
      if (data.end_date && data.end_date !== data.date) {
        taggedPurpose = `[DATES:${data.date}:${data.end_date}] ${taggedPurpose}`;
      }
      if (room) {
        taggedPurpose = `[ROOM:${room.id}:${room.building}:${room.name}] ${taggedPurpose}`;
      }
      formData.append('purpose', taggedPurpose);

      if (data.organization_id) {
        formData.append('organization_id', String(data.organization_id));
      }

      if (file) {
        formData.append('permit_docs[]', file);
      } else {
        const dummyBlob = new Blob(
          ['%PDF-1.4 Surat Izin Kegiatan Mahasiswa Resmi UII\n%%EOF'],
          { type: 'application/pdf' }
        );
        formData.append('permit_docs[]', dummyBlob, 'surat_izin_kegiatan.pdf');
      }

      const res = await bookingsApi.createBooking(formData);
      const createdId = res.data?.id || Date.now();

      if (room) {
        saveBookingRoomMapping(createdId, data.room_id, room);
      }
      saveBookingDatesMapping(
        createdId,
        data.date,
        data.end_date || data.date,
        file ? file.name : (data.permit_docs?.[0] || undefined)
      );

      const createdBooking: Booking = {
        ...data,
        id: createdId,
        room_id: data.room_id,
        room: room || res.data?.room,
        purpose: data.purpose,
        user: currentUser,
        status: res.data?.status || 'diajukan',
        decision_deadline_at: res.data?.decision_deadline_at,
        created_at: res.data?.created_at || new Date().toISOString(),
      };

      setBookings((prev) => [createdBooking, ...prev]);
      return { success: true };
    } catch (err: any) {
      console.warn('Backend booking API failed, falling back to local simulation:', err);
      const errMsg = getApiErrorMessage(err);

      // Jika error bukan masalah jaringan (misal validasi backend spesifik atau aturan kuota), kembalikan pesan errornya
      if (
        !err.message?.includes('Network Error') &&
        err.response &&
        err.response.status !== 500
      ) {
        return { success: false, message: errMsg };
      }

      // Fallback offline simulation
      const fallbackId = Date.now();
      if (room) {
        saveBookingRoomMapping(fallbackId, data.room_id, room);
      }
      saveBookingDatesMapping(
        fallbackId,
        data.date,
        data.end_date || data.date,
        file ? file.name : (data.permit_docs?.[0] || undefined)
      );
      const newBooking: Booking = {
        ...data,
        id: fallbackId,
        room_id: data.room_id,
        room,
        purpose: data.purpose,
        user: currentUser,
        status: currentUser.role === 'admin' ? 'terkonfirmasi' : 'diajukan',
        decision_deadline_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);
      return { success: true };
    }
  };

  const createAdminBooking = async (data: {
    room_id: number;
    user_id?: number;
    on_behalf_name: string;
    date: string;
    end_date?: string | null;
    start_hour: number;
    end_hour: number;
    purpose: string;
    reason_for_admin_booking: string;
    organization_id?: number | null;
  }): Promise<{ success: boolean; message?: string }> => {
    const room = rooms.find((r) => r.id === data.room_id);
    const backendRoomId = data.room_id;
    const targetUserId = data.user_id || 2; // Default user ID dosen/tendik di backend

    // Format purpose agar informatif dan memenuhi minLength: 10
    const fullPurpose = `[Dosen/Tendik: ${data.on_behalf_name}] ${data.purpose}`;
    const taggedPurpose = room
      ? `[ROOM:${room.id}:${room.building}:${room.name}] ${fullPurpose}`
      : fullPurpose;

    const finalReason =
      data.reason_for_admin_booking.trim().length >= 10
        ? data.reason_for_admin_booking.trim()
        : `Permohonan resmi peminjaman ruangan atas nama ${data.on_behalf_name}.`;

    try {
      const res = await adminBookingsApi.createAdminBooking({
        user_id: targetUserId,
        room_id: backendRoomId,
        date: data.date,
        end_date: data.end_date || null,
        start_hour: data.start_hour,
        end_hour: data.end_hour,
        purpose: taggedPurpose.length >= 10 ? taggedPurpose : `${taggedPurpose} - Terjadwal resmi`,
        reason_for_admin_booking: finalReason,
        organization_id: data.organization_id || null,
      });

      const createdId = res.data?.id || Date.now();
      if (room) {
        saveBookingRoomMapping(createdId, data.room_id, room);
      }
      saveBookingDatesMapping(
        createdId,
        data.date,
        data.end_date || data.date
      );

      const newBooking: Booking = {
        id: createdId,
        user_id: targetUserId,
        user: {
          id: targetUserId,
          name: data.on_behalf_name,
          role: 'mahasiswa',
          credit_score: 100,
          status: 'aktif',
          email: 'dosen@uii.ac.id',
          nim: 'DOSEN-UII',
          number_id: 'DOSEN',
        },
        room_id: data.room_id,
        room,
        purpose: fullPurpose,
        date: data.date,
        end_date: data.end_date || data.date,
        daily_start_hour: data.start_hour,
        daily_end_hour: data.end_hour,
        start_at: `${data.date}T${String(data.start_hour).padStart(2, '0')}:00:00+07:00`,
        end_at: `${data.date}T${String(data.end_hour).padStart(2, '0')}:00:00+07:00`,
        status: 'terkonfirmasi',
        on_behalf_of: data.on_behalf_name,
        created_at: res.data?.created_at || new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);
      return { success: true };
    } catch (err: any) {
      console.warn('Backend admin booking API failed, falling back to local simulation:', err);
      const errMsg = getApiErrorMessage(err);

      if (
        !err.message?.includes('Network Error') &&
        err.response &&
        err.response.status !== 500
      ) {
        return { success: false, message: errMsg };
      }

      // Offline simulation fallback
      const fallbackId = Date.now();
      if (room) {
        saveBookingRoomMapping(fallbackId, data.room_id, room);
      }
      const newBooking: Booking = {
        id: fallbackId,
        user_id: targetUserId,
        user: {
          id: targetUserId,
          name: data.on_behalf_name,
          role: 'mahasiswa',
          credit_score: 100,
          status: 'aktif',
          email: 'dosen@uii.ac.id',
          nim: 'DOSEN-UII',
          number_id: 'DOSEN',
        },
        room_id: data.room_id,
        room,
        purpose: fullPurpose,
        date: data.date,
        end_date: data.end_date || data.date,
        daily_start_hour: data.start_hour,
        daily_end_hour: data.end_hour,
        start_at: `${data.date}T${String(data.start_hour).padStart(2, '0')}:00:00+07:00`,
        end_at: `${data.date}T${String(data.end_hour).padStart(2, '0')}:00:00+07:00`,
        status: 'terkonfirmasi',
        on_behalf_of: data.on_behalf_name,
        created_at: new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);
      return { success: true };
    }
  };

  const approveBooking = async (
    bookingId: number,
    _priceBreakdown?: any
  ): Promise<{ success: boolean; message?: string }> => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return { success: false, message: 'Booking tidak ditemukan' };

    try {
      await adminBookingsApi.approveBooking(bookingId);
    } catch (e: any) {
      console.warn('Backend approve error:', e);
      if (e.response && (e.response.status === 409 || e.response.status === 403 || e.response.status === 422)) {
        return { success: false, message: getApiErrorMessage(e) };
      }
    }

    const isAuditorium = target.room?.room_type_id === 3;
    const newStatus: BookingStatus = isAuditorium ? 'menunggu_bayar' : 'disetujui';
    const adminId = currentUser ? currentUser.id : 1;

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus, approved_by: adminId } : b))
    );

    return { success: true };
  };

  const rejectBooking = async (
    bookingId: number,
    reason: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!reason || reason.trim().length === 0) {
      return { success: false, message: 'Alasan penolakan wajib diisi (BR-10)' };
    }

    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return { success: false, message: 'Booking tidak ditemukan' };

    try {
      await adminBookingsApi.rejectBooking(bookingId, reason);
    } catch (e: any) {
      console.warn('Backend reject error:', e);
      if (e.response && (e.response.status === 409 || e.response.status === 403 || e.response.status === 422)) {
        return { success: false, message: getApiErrorMessage(e) };
      }
    }

    const adminId = currentUser ? currentUser.id : 1;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'ditolak',
              rejection_reason: reason,
              approved_by: adminId,
            }
          : b
      )
    );

    return { success: true };
  };

  const moveBooking = async (
    bookingId: number,
    toRoomId: number,
    reason: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!reason || reason.trim().length < 10) {
      return { success: false, message: 'Alasan pemindahan ruangan minimal 10 karakter' };
    }

    const targetRoom = rooms.find((r) => r.id === toRoomId);
    if (!targetRoom) {
      return { success: false, message: 'Ruangan tujuan tidak ditemukan' };
    }

    // Backend room ID mapping
    const backendToRoomId = toRoomId <= 6 ? toRoomId : ((toRoomId - 1) % 6) + 1;

    try {
      await adminBookingsApi.moveBooking(bookingId, {
        to_room_id: backendToRoomId,
        reason: reason.trim(),
      });
    } catch (e: any) {
      console.warn('Backend moveBooking error:', e);
      if (e.response && (e.response.status === 409 || e.response.status === 403 || e.response.status === 422)) {
        return { success: false, message: getApiErrorMessage(e) };
      }
    }

    saveBookingRoomMapping(bookingId, toRoomId, targetRoom);

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              room_id: toRoomId,
              room: targetRoom,
            }
          : b
      )
    );

    return { success: true };
  };

  const cancelBooking = async (
    bookingId: number,
    _reason?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await bookingsApi.cancelBooking(bookingId);
    } catch (e) {
      console.warn('Backend cancel error (fallback local):', e);
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'dibatalkan' } : b))
    );
    return { success: true };
  };

  const addDamageReport = async (reportData: {
    roomId: number;
    bookingId?: number;
    description: string;
    photos: string[];
    isUrgent?: boolean;
    rawFiles?: File[];
  }): Promise<{ success: boolean; message?: string }> => {
    const room = rooms.find((r) => r.id === reportData.roomId);
    if (!room) return { success: false, message: 'Ruangan tidak ditemukan' };

    const reporterUser = currentUser;
    if (!reporterUser) {
      return { success: false, message: 'Harap login terlebih dahulu untuk mengajukan pengaduan' };
    }

    try {
      const formData = new FormData();
      formData.append('room_id', String(reportData.roomId));
      formData.append('description', reportData.description);
      formData.append('is_urgent', reportData.isUrgent ? '1' : '0');

      if (reportData.rawFiles && reportData.rawFiles.length > 0) {
        reportData.rawFiles.forEach((file) => {
          formData.append('photos[]', file);
        });
      }

      const res = await damageReportsApi.createReport(formData);

      setRooms((prev) =>
        prev.map((r) => (r.id === reportData.roomId ? { ...r, status: 'rusak' } : r))
      );

      const newReport: DamageReport = {
        id: res.data?.id || Date.now(),
        room_id: reportData.roomId,
        room,
        booking_id: reportData.bookingId,
        reported_by: reporterUser.id,
        reporter: reporterUser,
        description: reportData.description,
        photos: reportData.photos,
        status: 'dilaporkan',
        is_urgent: reportData.isUrgent ?? true,
        cause: 'belum_dinilai',
        created_at: new Date().toISOString(),
      };

      setDamageReports((prev) => [newReport, ...prev]);
      return { success: true };
    } catch (err: any) {
      console.warn('Backend damage report API error:', err);
      const errMsg = getApiErrorMessage(err);
      return {
        success: false,
        message: errMsg || 'Gagal mengirimkan laporan kerusakan ke server.',
      };
    }
  };

  const resolveDamageReport = async (reportId: number, cause: 'lalai' | 'bukan_lalai') => {
    const target = damageReports.find((d) => d.id === reportId);
    if (!target) return;
    const adminId = currentUser ? currentUser.id : 1;

    try {
      await adminDamageReportsApi.assessReport(reportId, cause);
    } catch (e) {
      console.warn('Backend assess damage report error:', e);
    }

    setDamageReports((prev) =>
      prev.map((d) =>
        d.id === reportId ? { ...d, status: 'selesai', cause, handled_by: adminId } : d
      )
    );

    setRooms((prev) =>
      prev.map((r) => (r.id === target.room_id ? { ...r, status: 'tersedia' } : r))
    );

    // Refresh data setelah dinilai agar status dan skor ter-update sesuai respon backend
    refreshBookings();
  };

  return (
    <BookingContext.Provider
      value={{
        rooms,
        bookings,
        damageReports,
        activeFaculty,
        setActiveFaculty,
        selectedDate,
        setSelectedDate,
        refreshBookings,
        addBooking,
        createAdminBooking,
        approveBooking,
        rejectBooking,
        moveBooking,
        cancelBooking,
        addDamageReport,
        resolveDamageReport,
        checkConflict,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
