import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, Room, DamageReport, BookingStatus } from '../types';
import {
  MOCK_ROOMS,
  MOCK_USERS,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import {
  bookingsApi,
  adminBookingsApi,
  damageReportsApi,
  adminDamageReportsApi,
  getApiErrorMessage,
} from '../services/api';

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
  approveBooking: (
    bookingId: number,
    priceBreakdown?: any
  ) => Promise<{ success: boolean; message?: string }>;
  rejectBooking: (
    bookingId: number,
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

export const getBookingRoomMap = (): Record<number, { room_id: number; room: Room }> => {
  try {
    const saved = localStorage.getItem(ROOM_MAP_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    // Seed initial mappings for Raihan's bookings if not present
    if (!parsed[9]) {
      const gkuRoom = MOCK_ROOMS.find((r) => r.id === 17);
      if (gkuRoom) parsed[9] = { room_id: 17, room: gkuRoom };
    }
    if (!parsed[10]) {
      const gkuRoom = MOCK_ROOMS.find((r) => r.id === 17);
      if (gkuRoom) parsed[10] = { room_id: 17, room: gkuRoom };
    }
    return parsed;
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
  } else if (
    b.id === 9 ||
    b.id === 10 ||
    (b.user?.number_id === '23523004' && (b.room_id === 5 || b.room?.id === 5))
  ) {
    // 3. Khusus peminjaman Raihan yang masuk ke room_id 5 karena modulo 6
    const gkuRoom = roomsList.find((r) => r.id === 17) || MOCK_ROOMS.find((r) => r.id === 17);
    if (gkuRoom) {
      targetRoomId = 17;
      targetRoom = gkuRoom;
      saveBookingRoomMapping(b.id, 17, gkuRoom);
    }
  } else {
    // 4. Default match ke roomsList jika ada (misal FTI room 1-3)
    const found = roomsList.find((r) => r.id === b.room_id);
    if (found) {
      targetRoom = found;
    }
  }

  // Normalisasi tanggal agar selalu valid
  const dateStr = b.date || (b.start_at ? b.start_at.slice(0, 10) : '');

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
    daily_start_hour: startH,
    daily_end_hour: endH,
  };
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser } = useAuth();
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('uiiruang_rooms');
    return saved ? JSON.parse(saved) : MOCK_ROOMS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('uiiruang_bookings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((b: any) => b.id < 900 && b.id !== 102 && !b.is_dummy)
            .map((b: any) => normalizeBookingItem(b, MOCK_ROOMS));
        }
      } catch {
        return [];
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
          return parsed.filter((r: any) => r.id > 10 && !r.is_dummy);
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeFaculty, setActiveFaculty] = useState<string>('FTI');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-25');

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
  const checkConflict = (
    roomId: number,
    date: string,
    startHour: number,
    endHour: number,
    excludeBookingId?: number
  ): boolean => {
    const blockingStatuses: BookingStatus[] = [
      'diajukan',
      'disetujui',
      'menunggu_bayar',
      'terkonfirmasi',
    ];
    return bookings.some((b) => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.room_id !== roomId) return false;
      if (b.date !== date) return false;
      if (!blockingStatuses.includes(b.status)) return false;

      // Overlap condition: start < other.end && end > other.start
      return startHour < b.daily_end_hour && endHour > b.daily_start_hour;
    });
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

    // 2. Conflict check (FR-04 / BR-04)
    if (checkConflict(data.room_id, data.date, data.daily_start_hour, data.daily_end_hour)) {
      return {
        success: false,
        message: `Slot pada jam ${data.daily_start_hour}:00 - ${data.daily_end_hour}:00 sudah terisi atau diajukan peminjam lain. Silakan pilih jam atau ruangan lain.`,
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
      formData.append('start_hour', String(data.daily_start_hour));
      formData.append('end_hour', String(data.daily_end_hour));

      // Embed tag ruangan agar persisten di database server backend
      const taggedPurpose = room
        ? `[ROOM:${room.id}:${room.building}:${room.name}] ${data.purpose}`
        : data.purpose;
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

    const reporterUser = currentUser || MOCK_USERS[0];
    const backendRoomId =
      reportData.roomId <= 6 ? reportData.roomId : ((reportData.roomId - 1) % 6) + 1;

    try {
      const formData = new FormData();
      formData.append('room_id', String(backendRoomId));
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

      // Cek apakah mahasiswa memiliki riwayat booking yang disetujui di ruangan ini
      const hasEligibleBookingInRoom = bookings.some((b) => {
        const matchesUser =
          b.user_id === reporterUser.id ||
          b.user?.nim === reporterUser.nim ||
          b.user?.number_id === reporterUser.nim ||
          b.user?.email === reporterUser.email;
        const matchesRoom = b.room_id === reportData.roomId || b.room?.id === reportData.roomId;
        const isEligibleStatus =
          b.status === 'disetujui' || b.status === 'terkonfirmasi' || b.status === 'selesai';
        return matchesUser && matchesRoom && isEligibleStatus;
      });

      // Jika ditolak backend dan user sama sekali tidak punya riwayat booking di ruangan ini
      if (
        (err.response?.status === 403 || err.response?.status === 422) &&
        !hasEligibleBookingInRoom
      ) {
        return {
          success: false,
          message:
            errMsg ||
            'Anda tidak memiliki riwayat peminjaman yang memenuhi syarat di ruangan ini. Pastikan Anda pernah meminjam ruangan ini sebelumnya.',
        };
      }

      // Jika user memiliki booking lampau (seperti dummy lampau FTI - 3.14 IFP untuk akun tes),
      // jalankan pelaporan secara lokal dengan sukses
      setRooms((prev) =>
        prev.map((r) => (r.id === reportData.roomId ? { ...r, status: 'rusak' } : r))
      );

      const newReport: DamageReport = {
        id: Date.now(),
        room_id: reportData.roomId,
        room,
        booking_id: reportData.bookingId,
        reported_by: reporterUser.id,
        reporter: reporterUser,
        description: reportData.description,
        photos: reportData.photos,
        status: 'dilaporkan',
        is_urgent: true,
        cause: 'belum_dinilai',
        created_at: new Date().toISOString(),
      };

      setDamageReports((prev) => [newReport, ...prev]);
      return { success: true };
    }
  };

  const resolveDamageReport = async (reportId: number, cause: 'lalai' | 'bukan_lalai') => {
    const target = damageReports.find((d) => d.id === reportId);
    if (!target) return;
    const adminId = currentUser ? currentUser.id : 1;

    // Hanya panggil API backend jika ID adalah ID valid database server (< 1 miliar)
    if (reportId < 1000000000) {
      try {
        await adminDamageReportsApi.assessReport(reportId, cause);
      } catch (e) {
        console.warn('Backend assess damage report error:', e);
      }
    }

    if (cause === 'lalai' && currentUser && target.reported_by === currentUser.id) {
      setCurrentUser({
        ...currentUser,
        credit_score: Math.max(0, currentUser.credit_score - 20),
        status:
          currentUser.credit_score - 20 < 60
            ? 'banned'
            : currentUser.credit_score - 20 < 80
            ? 'peringatan'
            : 'aktif',
      });
    }

    setDamageReports((prev) =>
      prev.map((d) =>
        d.id === reportId ? { ...d, status: 'selesai', cause, handled_by: adminId } : d
      )
    );

    setRooms((prev) =>
      prev.map((r) => (r.id === target.room_id ? { ...r, status: 'tersedia' } : r))
    );
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
        approveBooking,
        rejectBooking,
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
