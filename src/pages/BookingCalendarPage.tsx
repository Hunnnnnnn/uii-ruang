import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { Room } from '../types';
import { DatePill } from '../components/layout/DatePill';
import { roomsApi, AvailabilitySlot } from '../services/api';

const FACULTY_LIST = [
  { id: 'FTI', label: 'FTI' },
  { id: 'FMIPA', label: 'FMIPA' },
  { id: 'FPI', label: 'FPI' },
  { id: 'FK', label: 'FK' },
  { id: 'FH', label: 'FH' },
  { id: 'GKU', label: 'GKU' },
];

// 14 slot jam operasional 07:00 - 21:00 (TC_AVL_03)
const OPERATING_HOURS = [
  { startHour: 7, endHour: 8, label: '07:00 - 08:00' },
  { startHour: 8, endHour: 9, label: '08:00 - 09:00' },
  { startHour: 9, endHour: 10, label: '09:00 - 10:00' },
  { startHour: 10, endHour: 11, label: '10:00 - 11:00' },
  { startHour: 11, endHour: 12, label: '11:00 - 12:00' },
  { startHour: 12, endHour: 13, label: '12:00 - 13:00' },
  { startHour: 13, endHour: 14, label: '13:00 - 14:00' },
  { startHour: 14, endHour: 15, label: '14:00 - 15:00' },
  { startHour: 15, endHour: 16, label: '15:00 - 16:00' },
  { startHour: 16, endHour: 17, label: '16:00 - 17:00' },
  { startHour: 17, endHour: 18, label: '17:00 - 18:00' },
  { startHour: 18, endHour: 19, label: '18:00 - 19:00' },
  { startHour: 19, endHour: 20, label: '19:00 - 20:00' },
  { startHour: 20, endHour: 21, label: '20:00 - 21:00' },
];

const START_HOUR_OPTIONS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00'
];

const ALL_END_HOUR_OPTIONS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00'
];

export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Format YYYY-MM-DD ke DD/MM/YYYY
export const formatYmdToDmy = (ymd: string): string => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
};

// Format YYYY-MM-DD ke Label Indonesia, mis. "28 November 2026"
export const formatYmdToLabel = (ymd: string): string => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  const mIdx = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${MONTH_NAMES[mIdx]} ${y}`;
};

// Format YYYY-MM-DD lengkap dengan nama hari, mis. "Sen, 23 Nov 2026"
export const formatYmdWithDay = (ymd: string): string => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const dayName = DAY_NAMES_ID[dateObj.getDay()];
  const mIdx = parseInt(m, 10) - 1;
  return `${dayName}, ${parseInt(d, 10)} ${MONTH_NAMES[mIdx].slice(0, 3)} ${y}`;
};

// Hitung durasi hari secara inklusif
export const getDaysDuration = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 1;
  const s = new Date(startStr + 'T00:00:00');
  const e = new Date(endStr + 'T00:00:00');
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

export const BookingCalendarPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { rooms, bookings, addBooking } = useBooking();

  // Tanggal hari ini
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDate = today.getDate();
  const todayYmd = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;

  // Navigasi Bulan & Tahun Kalender (BUG_006)
  const [calendarYear, setCalendarYear] = useState<number>(todayYear);
  const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth()); // 0-indexed

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((prev) => prev - 1);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((prev) => prev + 1);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
  };

  // Fakultas yang sedang dipilih (null = level 1 grid kartu fakultas, non-null = level 2 tabel ruangan)
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  // Ruangan yang sedang dipilih (null = tabel ruangan, non-null = tampilan 4 card booking Figma)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form State Detail Peminjaman (Default ke hari ini, mendukung multi-day rentang lintas bulan TC_BOOK_007)
  const [selectedStartDate, setSelectedStartDate] = useState<string>(todayYmd);
  const [selectedEndDate, setSelectedEndDate] = useState<string>(todayYmd);
  const [startDateDropdownOpen, setStartDateDropdownOpen] = useState(false);
  const [endDateDropdownOpen, setEndDateDropdownOpen] = useState(false);
  const startDateRef = useRef<HTMLDivElement>(null);
  const endDateRef = useRef<HTMLDivElement>(null);

  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:00');
  const [eventPurpose, setEventPurpose] = useState('');
  const [participantCount, setParticipantCount] = useState('');
  const [atasNama, setAtasNama] = useState('UKM atau Mahasiswa');
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Opsi dropdown tanggal mulai (60 hari ke depan dari hari ini)
  const startDateOptions = useMemo(() => {
    const opts: string[] = [];
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    for (let i = 0; i < 60; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      opts.push(ymd);
    }
    return opts;
  }, []);

  // Opsi dropdown tanggal selesai (hingga 30 hari ke depan dari selectedStartDate)
  const endDateOptions = useMemo(() => {
    const opts: { ymd: string; days: number }[] = [];
    if (!selectedStartDate) return opts;
    const base = new Date(selectedStartDate + 'T00:00:00');
    for (let i = 0; i < 30; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      opts.push({ ymd, days: i + 1 });
    }
    return opts;
  }, [selectedStartDate]);

  // Tutup dropdown popover saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startDateRef.current && !startDateRef.current.contains(event.target as Node)) {
        setStartDateDropdownOpen(false);
      }
      if (endDateRef.current && !endDateRef.current.contains(event.target as Node)) {
        setEndDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Live Slot Availability State
  const [liveSlots, setLiveSlots] = useState<AvailabilitySlot[] | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live availability from backend when selectedRoom or selectedStartDate changes
  useEffect(() => {
    if (!selectedRoom) {
      setLiveSlots(null);
      return;
    }

    const dateStr = selectedStartDate;
    const roomTypeId = selectedRoom.room_type_id || 1;
    // Hanya query availability backend jika ruangan ada di backend (FTI ID 1-3)
    const backendRoomId = selectedRoom.id <= 3 ? selectedRoom.id : null;

    if (!backendRoomId) {
      setLiveSlots(null);
      setIsLoadingSlots(false);
      return;
    }

    setIsLoadingSlots(true);
    roomsApi
      .getAvailability(roomTypeId, dateStr)
      .then((res) => {
        const foundRoom = res.rooms?.find((r) => r.id === backendRoomId);
        if (foundRoom && foundRoom.slots) {
          setLiveSlots(foundRoom.slots);
        } else {
          setLiveSlots(null);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat ketersediaan slot:', err);
        setLiveSlots(null);
      })
      .finally(() => {
        setIsLoadingSlots(false);
      });
  }, [selectedRoom, selectedStartDate]);

  // Status riil per slot jam (07:00 - 21:00) tanpa dummy data (Mendukung pengecekan tanggal spesifik / multi-day lintas bulan)
  const getSlotStatus = (
    startH: number,
    endH: number,
    checkYmd: string = selectedStartDate
  ): 'terisi' | 'menunggu' | 'kosong' => {
    // 1. Cek dari daftar booking aktif di context (paling akurat dan spesifik per ruangan asli)
    if (selectedRoom) {
      const conflict = bookings.find((b) => {
        const matchesRoom = b.room_id === selectedRoom.id || b.room?.id === selectedRoom.id;
        const bStartDate = b.date || (b.start_at ? b.start_at.slice(0, 10) : '');
        const bEndDate = b.end_date || bStartDate;
        const matchesDate = bStartDate <= checkYmd && checkYmd <= bEndDate;
        if (!matchesRoom || !matchesDate) return false;

        const bStart = b.daily_start_hour || (b.start_at ? new Date(b.start_at).getHours() : 0);
        const bEnd = b.daily_end_hour || (b.end_at ? new Date(b.end_at).getHours() : 0);

        return bStart < endH && bEnd > startH;
      });

      if (conflict) {
        if (conflict.status === 'terkonfirmasi' || conflict.status === 'disetujui') return 'terisi';
        if (conflict.status === 'diajukan') return 'menunggu';
      }
    }

    // 2. Cek dari backend availability untuk ruangan yang memang terdaftar di server
    if (checkYmd === selectedStartDate && selectedRoom && selectedRoom.id <= 3 && liveSlots && liveSlots.length > 0) {
      const match = liveSlots.find((s) => {
        let h = s.hour;
        if (h === undefined && s.start) {
          h = parseInt(s.start.split(':')[0], 10);
        }
        return h === startH;
      });
      if (match) {
        if (match.status === 'terisi') return 'terisi';
        if (match.status === 'menunggu') return 'menunggu';
        if (match.status === 'kosong' || match.status === 'tersedia') return 'kosong';
      }
    }

    // Default: Kosong (tidak ada dummy bookings)
    return 'kosong';
  };

  // Cek apakah satu tanggal sudah penuh terisi seluruh jam operasionalnya (07:00 - 21:00)
  const isDateFull = (ymd: string): boolean => {
    if (!selectedRoom) return false;

    if (ymd === selectedStartDate && liveSlots && liveSlots.length > 0) {
      const allOccupied = liveSlots.every((s) => s.status === 'terisi' || s.status === 'menunggu');
      if (allOccupied) return true;
    }

    const roomBookings = bookings.filter(
      (b) =>
        (b.room_id === selectedRoom.id || b.room?.id === selectedRoom.id) &&
        (b.date === ymd || b.start_at?.startsWith(ymd)) &&
        (b.status === 'terkonfirmasi' || b.status === 'disetujui' || b.status === 'diajukan')
    );

    const occupiedHours = new Set<number>();
    roomBookings.forEach((b) => {
      const sH = b.daily_start_hour || (b.start_at ? new Date(b.start_at).getHours() : 0);
      const eH = b.daily_end_hour || (b.end_at ? new Date(b.end_at).getHours() : 0);
      for (let h = sH; h < eH; h++) {
        if (h >= 7 && h < 21) occupiedHours.add(h);
      }
    });

    return occupiedHours.size >= 14;
  };

  // Cek apakah slot jam tertentu termasuk dalam rentang pilihan user saat ini
  const selStartH = parseInt(startTime.split(':')[0], 10) || 7;
  const selEndH = parseInt(endTime.split(':')[0], 10) || 9;
  const isSlotSelected = (slotStartH: number) => {
    return slotStartH >= selStartH && slotStartH < selEndH;
  };

  // Klik langsung slot jam di Ketersediaan Jadwal untuk memilih atau memblok rentang jam
  const handleSlotClick = (startH: number, endH: number) => {
    const status = getSlotStatus(startH, endH);
    if (status !== 'kosong') return;

    if (startH < selStartH || startH >= selEndH) {
      setStartTime(`${String(startH).padStart(2, '0')}:00`);
      setEndTime(`${String(endH).padStart(2, '0')}:00`);
    } else {
      setEndTime(`${String(endH).padStart(2, '0')}:00`);
    }
    setFormError(null);
  };

  // Helper pencocokan fakultas/gedung secara fleksibel
  const isFacultyMatch = (r: Room, fac: string) => {
    if (!fac || fac === 'Semua') return true;
    return r.faculty === fac || r.building === fac || r.building?.includes(fac);
  };

  // Filter daftar ruangan
  const filteredRooms = rooms.filter((r) => {
    const matchesFaculty = isFacultyMatch(r, selectedFaculty || 'Semua');
    const matchesSearch =
      r.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
      (r.type_name && r.type_name.toLowerCase().includes(roomSearchQuery.toLowerCase())) ||
      (r.floor && r.floor.toLowerCase().includes(roomSearchQuery.toLowerCase()));
    return matchesFaculty && matchesSearch;
  });

  // Hitungan tab fakultas dinamis dari database backend
  const countAll = rooms.length;
  const countFTI = rooms.filter((r) => isFacultyMatch(r, 'FTI')).length;
  const countFMIPA = rooms.filter((r) => isFacultyMatch(r, 'FMIPA')).length;
  const countFPI = rooms.filter((r) => isFacultyMatch(r, 'FPI')).length;
  const countFK = rooms.filter((r) => isFacultyMatch(r, 'FK')).length;
  const countFH = rooms.filter((r) => isFacultyMatch(r, 'FH')).length;
  const countGKU = rooms.filter((r) => isFacultyMatch(r, 'GKU')).length;

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleDayClick = (clickedYmd: string) => {
    if (clickedYmd < todayYmd) return;
    if (isDateFull(clickedYmd)) return;

    // Jika belum ada rentang (selectedStartDate === selectedEndDate) dan user klik tanggal setelahnya, jadikan rentang multi-day (TC_BOOK_007)
    if (selectedStartDate === selectedEndDate && clickedYmd > selectedStartDate) {
      setSelectedEndDate(clickedYmd);
    } else {
      // Set tanggal mulai baru dan reset tanggal selesai
      setSelectedStartDate(clickedYmd);
      setSelectedEndDate(clickedYmd);
    }
    setFormError(null);
  };

  const handleSelectStartDate = (ymd: string) => {
    setSelectedStartDate(ymd);
    if (selectedEndDate < ymd) {
      setSelectedEndDate(ymd);
    }
    // Sinkronkan bulan kalender jika memilih tanggal di bulan lain
    const [y, m] = ymd.split('-');
    setCalendarYear(parseInt(y, 10));
    setCalendarMonth(parseInt(m, 10) - 1);
    setStartDateDropdownOpen(false);
    setFormError(null);
  };

  const handleSelectEndDate = (ymd: string) => {
    setSelectedEndDate(ymd);
    setEndDateDropdownOpen(false);
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setFormError('Berkas persyaratan wajib berformat PDF.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Ukuran berkas melebihi batas maksimal 5 MB.');
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
      setFormError(null);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    if (!selectedRoom) return;

    if (!eventPurpose.trim()) {
      setFormError('Keterangan acara wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    const startH = parseInt(startTime.split(':')[0], 10);
    const endH = parseInt(endTime.split(':')[0], 10);

    if (isNaN(startH) || isNaN(endH) || startH >= endH) {
      setFormError('Jam selesai harus lebih besar dari jam mulai.');
      setIsSubmitting(false);
      return;
    }

    // BUG_010: Validasi dokumen persyaratan wajib untuk ruangan Auditorium / Aula
    const roomNameLower = (selectedRoom.name || '').toLowerCase();
    const buildingLower = (selectedRoom.building || '').toLowerCase();
    const typeLower = (selectedRoom.type_name || '').toLowerCase();
    const isAuditorium =
      roomNameLower.includes('auditorium') ||
      roomNameLower.includes('aula') ||
      buildingLower.includes('auditorium') ||
      typeLower.includes('auditorium') ||
      typeLower.includes('aula');

    if (isAuditorium && !selectedFile) {
      setFormError(
        'Sistem menolak pengajuan: Dokumen persyaratan (Bukti Persetujuan .PDF) wajib diunggah sebelum mengajukan peminjaman Auditorium/Aula.'
      );
      setIsSubmitting(false);
      return;
    }

    const sDate = new Date(selectedStartDate + 'T00:00:00');
    const eDate = new Date(selectedEndDate + 'T00:00:00');

    // Validasi multi-day apakah ada salah satu hari dalam rentang yang bentrok lintas bulan (TC_BOOK_007)
    for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
      const curY = d.getFullYear();
      const curM = String(d.getMonth() + 1).padStart(2, '0');
      const curD = String(d.getDate()).padStart(2, '0');
      const curYmd = `${curY}-${curM}-${curD}`;

      for (let h = startH; h < endH; h++) {
        const status = getSlotStatus(h, h + 1, curYmd);
        if (status !== 'kosong') {
          const dateFormatted = `${curD}/${curM}/${curY}`;
          const timeLabel = `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`;
          setFormError(
            `Permohonan booking ditolak: Jadwal bentrok pada tanggal ${dateFormatted} (Slot jam ${timeLabel} sudah ${
              status === 'terisi' ? 'terpakai' : 'menunggu persetujuan'
            }).`
          );
          setIsSubmitting(false);
          return;
        }
      }
    }

    const res = await addBooking(
      {
        room_id: selectedRoom.id,
        user_id: currentUser?.id || 1,
        purpose: eventPurpose,
        organization_name: atasNama !== 'UKM atau Mahasiswa' ? atasNama : null,
        date: selectedStartDate,
        end_date: selectedEndDate,
        daily_start_hour: startH,
        daily_end_hour: endH,
        start_at: `${selectedStartDate}T${startH.toString().padStart(2, '0')}:00:00+07:00`,
        end_at: `${selectedEndDate}T${endH.toString().padStart(2, '0')}:00:00+07:00`,
        permit_docs: fileName ? [fileName] : [],
      },
      selectedFile
    );

    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.message || 'Gagal mengajukan booking');
    } else {
      setFormSuccess('Peminjaman ruangan berhasil diajukan! Menunggu persetujuan admin.');
      setTimeout(() => {
        setSelectedRoom(null);
        setSelectedFaculty(null);
        setEventPurpose('');
        setParticipantCount('');
        setFileName(null);
        setSelectedFile(null);
        setFormSuccess(null);
      }, 1600);
    }
  };

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      {/* Container utama responsif */}
      <div className="pt-5 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-12 pb-16 w-full">
        {/* Header Row: Judul di kiri, Tanggal di kanan */}
        <div className="flex flex-row items-center justify-between w-full mb-6 gap-3 min-h-[44px]">
          <h1 className="font-['Poppins'] font-bold text-[24px] sm:text-[32px] text-[#093697] leading-tight pb-0.5 flex-1 min-w-0">
            Peminjaman Ruangan
          </h1>

          {/* Date Pill Real-time */}
          <DatePill />
        </div>

        {/* ================= BREADCRUMB NAVIGATION ================= */}
        {/* Breadcrumb Level 3 (Formulir Peminjaman Ruangan) */}
        {selectedRoom && (
          <div className="flex items-center gap-2 font-['Poppins'] text-[15px] text-[#727272] mb-6">
            <button
              type="button"
              onClick={() => {
                setSelectedRoom(null);
                setSelectedFaculty(null);
              }}
              className="hover:text-[#093697] transition flex items-center gap-1 text-[#727272] cursor-pointer"
            >
              <span>&larr; Peminjaman Ruangan</span>
            </button>
            <span>&gt;</span>
            <button
              type="button"
              onClick={() => setSelectedRoom(null)}
              className="hover:text-[#093697] transition text-[#727272] cursor-pointer"
            >
              {selectedRoom.building}
            </button>
            <span>&gt;</span>
            <span className="text-[#0B0C0F] font-semibold">{selectedRoom.name}</span>
          </div>
        )}

        {/* Breadcrumb Level 2 (Daftar Ruangan Fakultas) */}
        {selectedFaculty && !selectedRoom && (
          <div className="flex items-center gap-2 font-['Poppins'] text-[15px] text-[#727272] mb-6">
            <button
              type="button"
              onClick={() => setSelectedFaculty(null)}
              className="hover:text-[#093697] transition flex items-center gap-1 text-[#727272] cursor-pointer"
            >
              <span>&larr; Peminjaman Ruangan</span>
            </button>
            <span>&gt;</span>
            <span className="text-[#0B0C0F] font-semibold">
              {selectedFaculty === 'Semua' ? 'Semua Fakultas' : selectedFaculty}
            </span>
          </div>
        )}

        {/* ================= LEVEL 1: PILIHAN FAKULTAS (Sama Persis Kanan-Kiri & Full Width) ================= */}
        {!selectedFaculty && !selectedRoom && (
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 w-full">
              {FACULTY_LIST.map((fac) => (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() => setSelectedFaculty(fac.id)}
                  className="bg-[#093697] hover:bg-[#072a78] text-white font-['Poppins'] font-bold text-[32px] sm:text-[36px] rounded-[18px] lg:rounded-[22px] flex items-center justify-center h-[140px] sm:h-[150px] lg:h-[160px] shadow-sm hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
                >
                  {fac.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= LEVEL 2: DAFTAR RUANGAN FAKULTAS (Tabel & Filter) ================= */}
        {selectedFaculty && !selectedRoom && (
          <div className="mt-2">
            {/* Filter Tabs: Semua Fakultas 20 | FTI 3 | FMIPA 5 | FPI 1 | FK 2 | FH 5 | GKU 4 */}
            <div className="flex items-center gap-6 mb-6 overflow-x-auto pb-1 font-['Poppins'] text-[15px]">
              <button
                type="button"
                onClick={() => setSelectedFaculty('Semua')}
                className={`transition ${
                  selectedFaculty === 'Semua'
                    ? 'bg-[#093697] text-white px-4 py-1 rounded-full font-medium shadow-xs'
                    : 'text-[#0B0C0F] hover:text-[#093697]'
                }`}
              >
                Semua Fakultas {countAll}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFaculty('FTI')}
                className={`transition ${
                  selectedFaculty === 'FTI'
                    ? 'bg-[#093697] text-white px-4 py-1 rounded-full font-medium shadow-xs'
                    : 'text-[#0B0C0F] hover:text-[#093697]'
                }`}
              >
                FTI {countFTI}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFaculty('FMIPA')}
                className={`transition ${
                  selectedFaculty === 'FMIPA'
                    ? 'bg-[#093697] text-white px-4 py-1 rounded-full font-medium shadow-xs'
                    : 'text-[#0B0C0F] hover:text-[#093697]'
                }`}
              >
                FMIPA {countFMIPA}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFaculty('FPI')}
                className={`transition ${
                  selectedFaculty === 'FPI'
                    ? 'bg-[#093697] text-white px-4 py-1 rounded-full font-medium shadow-xs'
                    : 'text-[#0B0C0F] hover:text-[#093697]'
                }`}
              >
                FPI {countFPI}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFaculty('FK')}
                className={`transition ${
                  selectedFaculty === 'FK'
                    ? 'bg-[#093697] text-white px-4 py-1 rounded-full font-medium shadow-xs'
                    : 'text-[#0B0C0F] hover:text-[#093697]'
                }`}
              >
                FK {countFK}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFaculty('FH')}
                className={`transition ${
                  selectedFaculty === 'FH'
                    ? 'bg-[#093697] text-white px-4 py-1 rounded-full font-medium shadow-xs'
                    : 'text-[#0B0C0F] hover:text-[#093697]'
                }`}
              >
                FH {countFH}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFaculty('GKU')}
                className={`transition ${
                  selectedFaculty === 'GKU'
                    ? 'bg-[#093697] text-white px-4 py-1 rounded-full font-medium shadow-xs'
                    : 'text-[#0B0C0F] hover:text-[#093697]'
                }`}
              >
                GKU {countGKU}
              </button>
            </div>

            {/* Search Bar: Cari Nama Ruangan... */}
            <div className="w-full bg-white rounded-[8px] border border-[#BABABA] h-[48px] px-4 flex items-center gap-3 mb-6 shadow-xs">
              <Search className="w-5 h-5 text-[#BABABA] shrink-0" />
              <input
                type="text"
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                placeholder="Cari Nama Ruangan..."
                className="w-full bg-transparent border-none outline-none font-['Poppins'] text-[15px] text-[#0B0C0F] placeholder:text-[#BABABA]"
              />
            </div>

            {/* Table Ruangan: Ruang | Jenis Ruangan | Lantai | Kapasitas Ruangan */}
            <div className="w-full bg-white rounded-[8px] border border-[#BABABA] overflow-hidden shadow-xs">
              <table className="w-full text-left font-['Poppins']">
                <thead className="bg-[#093697] text-white text-[15px] font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Ruang</th>
                    <th className="py-3.5 px-6">Jenis Ruangan</th>
                    <th className="py-3.5 px-6">Lantai</th>
                    <th className="py-3.5 px-6">Kapasitas Ruangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BABABA] text-[15px] text-[#0B0C0F]">
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[#727272]">
                        Ruangan tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map((room) => (
                      <tr
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className="hover:bg-blue-50/50 cursor-pointer transition h-[52px]"
                      >
                        <td className="py-3 px-6 font-semibold text-[#0B0C0F]">
                          {room.name}
                        </td>
                        <td className="py-3 px-6 text-[#0B0C0F]">
                          {room.type_name || (room.room_type_id === 3 ? 'Auditorium' : room.room_type_id === 2 ? 'Laboratorium' : 'Ruang Kelas')}
                        </td>
                        <td className="py-3 px-6 text-[#0B0C0F]">
                          {room.floor || 'Lt. 3'}
                        </td>
                        <td className="py-3 px-6 text-[#0B0C0F]">
                          {room.capacity}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Baris kosong pembatas persis Figma */}
                  {Array.from({ length: Math.max(0, 7 - filteredRooms.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-[52px]">
                      <td className="py-3 px-6">&nbsp;</td>
                      <td className="py-3 px-6">&nbsp;</td>
                      <td className="py-3 px-6">&nbsp;</td>
                      <td className="py-3 px-6">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= LEVEL 3: 4 CARD BOOKING SESUAI FIGMA EXACT ================= */}
        {selectedRoom && (
          <div>
            {formError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 font-['Poppins'] text-[13px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-['Poppins'] text-[13px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* 4 Cards Layout: 2 Kolom Seimbang (Kiri: Kalender + Dokumen, Kanan: Ketersediaan + Detail) */}
            <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 w-full">
              {/* ================= SISI KIRI ================= */}
              <div className="flex flex-col gap-8 w-full">
                {/* CARD 1: Kalender Bulan Interaktif (BUG_006: Navigasi Bulan & Tahun) */}
                <div className="w-full bg-white border border-[#BABABA] rounded-[16px] p-4 sm:p-7 shadow-xs">
                  {/* Month Header: Dynamic Month Year + Nav Buttons */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-['Poppins'] font-semibold text-[18px] text-[#0B0C0F]">
                      {MONTH_NAMES[calendarMonth]} {calendarYear}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="w-8 h-8 rounded-full border border-[#BABABA] flex items-center justify-center hover:bg-slate-50 transition cursor-pointer"
                        title="Bulan sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4 text-[#727272]" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="w-8 h-8 rounded-full border border-[#BABABA] flex items-center justify-center hover:bg-slate-50 transition cursor-pointer"
                        title="Bulan berikutnya"
                      >
                        <ChevronRight className="w-4 h-4 text-[#727272]" />
                      </button>
                    </div>
                  </div>

                  {/* Day Names: Min Sen Sel Rab Kam Jum Sab */}
                  <div className="grid grid-cols-7 gap-2 text-center font-['Poppins'] text-[14px] font-medium text-[#0B0C0F] mb-3">
                    <span>Min</span>
                    <span>Sen</span>
                    <span>Sel</span>
                    <span>Rab</span>
                    <span>Kam</span>
                    <span>Jum</span>
                    <span>Sab</span>
                  </div>

                  {/* Days Matrix Dinamis (BUG_006) */}
                  {(() => {
                    const daysInCurrentMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Min, 1 = Sen
                    const prevMonthDaysCount = new Date(calendarYear, calendarMonth, 0).getDate();
                    const prevDays = Array.from(
                      { length: firstDayOfWeek },
                      (_, idx) => prevMonthDaysCount - firstDayOfWeek + 1 + idx
                    );
                    const trailingDaysCount = (7 - ((firstDayOfWeek + daysInCurrentMonth) % 7)) % 7;
                    const trailingDays = Array.from({ length: trailingDaysCount }, (_, idx) => idx + 1);

                    const prevMonthYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
                    const prevMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
                    const nextMonthYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
                    const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;

                    const renderDayCell = (d: number, year: number, month: number, isCurrentMonth: boolean) => {
                      const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const isPast = ymd < todayYmd;
                      const isFull = isDateFull(ymd);
                      const isRange = selectedEndDate > selectedStartDate;
                      const isStart = ymd === selectedStartDate;
                      const isEnd = ymd === selectedEndDate;
                      const isInBetween = isRange && ymd > selectedStartDate && ymd < selectedEndDate;

                      if (isPast) {
                        return (
                          <button
                            key={ymd}
                            type="button"
                            disabled
                            className="w-8 h-8 rounded-full flex items-center justify-center mx-auto text-[#CBD5E1] bg-slate-50/50 cursor-not-allowed select-none line-through"
                            title={`Tanggal ${d} ${MONTH_NAMES[month]} telah berlalu`}
                          >
                            {d}
                          </button>
                        );
                      }

                      if (isFull) {
                        return (
                          <button
                            key={ymd}
                            type="button"
                            disabled
                            className="w-8 h-8 rounded-full flex items-center justify-center mx-auto text-rose-500 bg-rose-50 border border-rose-200 cursor-not-allowed font-medium select-none line-through"
                            title={`Tanggal ${d} ${MONTH_NAMES[month]}: Jadwal Penuh`}
                          >
                            {d}
                          </button>
                        );
                      }

                      let cellStyle = isCurrentMonth
                        ? 'text-[#0B0C0F] hover:bg-blue-50 hover:text-[#093697] font-normal'
                        : 'text-[#94A3B8] hover:bg-blue-50/70 hover:text-[#093697] font-normal';

                      if (isRange) {
                        if (isStart) {
                          cellStyle =
                            'bg-[#093697] text-white font-bold rounded-l-full shadow-xs ring-2 ring-[#093697]/30';
                        } else if (isEnd) {
                          cellStyle =
                            'bg-[#093697] text-white font-bold rounded-r-full shadow-xs ring-2 ring-[#093697]/30';
                        } else if (isInBetween) {
                          cellStyle = 'bg-blue-100 text-[#093697] font-semibold rounded-none';
                        }
                      } else if (isStart) {
                        cellStyle = 'bg-[#093697] text-white font-bold shadow-xs ring-2 ring-[#093697]/30';
                      }

                      return (
                        <button
                          key={ymd}
                          type="button"
                          onClick={() => handleDayClick(ymd)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition cursor-pointer ${cellStyle}`}
                          title={`Pilih tanggal ${d} ${MONTH_NAMES[month]} ${year}`}
                        >
                          {d}
                        </button>
                      );
                    };

                    return (
                      <div className="grid grid-cols-7 gap-y-3.5 gap-x-2 text-center font-['Poppins'] text-[15px]">
                        {/* Hari abu-abu dari bulan sebelumnya (bisa diklik) */}
                        {prevDays.map((d) => renderDayCell(d, prevMonthYear, prevMonth, false))}

                        {/* Hari-hari dalam bulan aktif */}
                        {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((d) =>
                          renderDayCell(d, calendarYear, calendarMonth, true)
                        )}

                        {/* Sisa hari bulan berikutnya (bisa diklik) */}
                        {trailingDays.map((d) => renderDayCell(d, nextMonthYear, nextMonth, false))}
                      </div>
                    );
                  })()}

                  <p className="mt-4 text-[12px] text-[#727272] flex items-center gap-1.5 font-['Poppins']">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#093697] inline-block shrink-0" />
                    <span>Pilih tanggal di kalender. Untuk peminjaman beberapa hari berturut-turut, klik tanggal awal lalu klik tanggal akhir.</span>
                  </p>
                </div>

                {/* CARD 2: Dokumen Persyaratan */}
                <div className="w-full bg-white border border-[#BABABA] rounded-[16px] p-4 sm:p-7 shadow-xs">
                  <h3 className="font-['Poppins'] font-semibold text-[18px] text-[#0B0C0F] mb-4">
                    Dokumen Persyaratan
                  </h3>

                  <div className="space-y-4 font-['Poppins']">
                    {/* Atas Nama */}
                    <div>
                      <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                        Atas Nama
                      </label>
                      <div className="relative">
                        <select
                          value={atasNama}
                          onChange={(e) => setAtasNama(e.target.value)}
                          className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-white outline-none cursor-pointer"
                        >
                          <option value="UKM atau Mahasiswa">UKM atau Mahasiswa</option>
                          <option value="Mahasiswa Individu">Mahasiswa Individu</option>
                          <option value="Himpunan Mahasiswa (HMTI)">Himpunan Mahasiswa (HMTI)</option>
                          <option value="Lembaga Eksekutif Mahasiswa (LEM)">LEM FTI UII</option>
                        </select>
                      </div>
                    </div>

                    {/* Bukti Persetujuan */}
                    <div>
                      <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                        Bukti Persetujuan
                      </label>
                      <div className="border border-[#BABABA] rounded-[8px] p-2 flex items-center gap-3 bg-white">
                        <label
                          htmlFor="doc-upload"
                          className="bg-[#E2E8F0] hover:bg-slate-300 text-[#0B0C0F] px-3.5 py-1.5 rounded text-[13px] font-medium cursor-pointer transition shrink-0"
                        >
                          Choose File
                        </label>
                        <input
                          id="doc-upload"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <span className="text-[13px] text-[#727272] truncate">
                          {fileName || 'No file chosen'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#727272] mt-1.5">
                        Wajib .PDF, maksimal 5 MB. Maksimal 5 file
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SISI KANAN ================= */}
              <div className="flex flex-col gap-8 w-full">
                {/* CARD 3: Ketersediaan Jadwal (Tiap Jam 07:00 - 21:00, Tanpa Data Dummy) */}
                <div className="w-full bg-white border border-[#BABABA] rounded-[16px] p-4 sm:p-7 shadow-xs overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <h3 className="font-['Poppins'] font-semibold text-[18px] text-[#0B0C0F] leading-tight">
                        Ketersediaan Jadwal
                      </h3>
                      <p className="text-[12px] text-[#727272] mt-0.5 font-['Poppins']">
                        {selectedStartDate === selectedEndDate
                          ? formatYmdToLabel(selectedStartDate)
                          : `${formatYmdToLabel(selectedStartDate)} - ${formatYmdToLabel(selectedEndDate)}`} • Operasional 07:00 - 21:00
                      </p>
                    </div>
                    {isLoadingSlots ? (
                      <span className="text-[12px] text-[#727272] animate-pulse font-['Poppins'] shrink-0">
                        Memuat data...
                      </span>
                    ) : (
                      <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-[11px] sm:text-[11.5px] font-['Poppins'] shrink-0 pt-0.5">
                        <span className="inline-flex items-center gap-1.5 text-[#166534] font-medium whitespace-nowrap">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shrink-0"></span> Kosong
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#854D0E] font-medium whitespace-nowrap">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] shrink-0"></span> Menunggu
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#991B1B] font-medium whitespace-nowrap">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shrink-0"></span> Terpakai
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Daftar Slot Tiap Jam (15 Slot: 07:00 - 22:00) */}
                  <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 font-['Poppins']">
                    {OPERATING_HOURS.map((slot) => {
                      const status = getSlotStatus(slot.startHour, slot.endHour);
                      const isSelected = isSlotSelected(slot.startHour);

                      return (
                        <div
                          key={slot.startHour}
                          onClick={() => handleSlotClick(slot.startHour, slot.endHour)}
                          className={`h-[38px] px-4 rounded-[8px] flex items-center justify-between transition border ${
                            isSelected
                              ? 'bg-[#EFF6FF] border-[#093697] ring-2 ring-[#093697]/25 cursor-pointer'
                              : status === 'terisi'
                              ? 'bg-[#FFE2E2] border-transparent text-[#991B1B] cursor-not-allowed opacity-90'
                              : status === 'menunggu'
                              ? 'bg-[#FEF08A] border-transparent text-[#854D0E] cursor-not-allowed'
                              : 'bg-[#DCFCE7] border-transparent hover:border-[#16A34A] text-[#166534] cursor-pointer'
                          }`}
                          title={
                            status === 'kosong'
                              ? `Klik untuk memilih jam ${slot.label}`
                              : `Slot jam ${slot.label} sudah ${
                                  status === 'terisi' ? 'terpakai' : 'menunggu persetujuan'
                                }`
                          }
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[#0B0C0F] font-medium text-[13px]">
                              {slot.label}
                            </span>
                            {isSelected && (
                              <span className="text-[10.5px] bg-[#093697] text-white font-semibold px-2 py-0.5 rounded-full">
                                Pilihan Anda
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[12px] font-semibold ${
                              status === 'terisi'
                                ? 'text-[#991B1B]'
                                : status === 'menunggu'
                                ? 'text-[#854D0E]'
                                : 'text-[#166534]'
                            }`}
                          >
                            {status === 'terisi'
                              ? 'Terpakai'
                              : status === 'menunggu'
                              ? 'Menunggu Persetujuan'
                              : 'Kosong'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CARD 4: Detail Peminjaman */}
                <div className="w-full bg-white border border-[#BABABA] rounded-[16px] p-4 sm:p-7 shadow-xs">
                  <h3 className="font-['Poppins'] font-semibold text-[18px] text-[#0B0C0F] mb-4">
                    Detail Peminjaman
                  </h3>

                  <div className="space-y-4 font-['Poppins']">
                    {/* Row 1: Tanggal Mulai & Jam Mulai */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                          Tanggal Mulai
                        </label>
                        <div className="relative" ref={startDateRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setStartDateDropdownOpen(!startDateDropdownOpen);
                              setEndDateDropdownOpen(false);
                            }}
                            className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-white hover:border-[#093697] flex items-center justify-between text-left transition cursor-pointer shadow-xs"
                          >
                            <span>{formatYmdToDmy(selectedStartDate)}</span>
                            <CalendarIcon className="w-4 h-4 text-[#727272] shrink-0 pointer-events-none" />
                          </button>

                          {startDateDropdownOpen && (
                            <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-[#BABABA] rounded-[8px] shadow-lg max-h-56 overflow-y-auto z-30 py-1 font-['Poppins']">
                              {startDateOptions.map((ymd) => {
                                const isSelected = ymd === selectedStartDate;
                                return (
                                  <button
                                    key={ymd}
                                    type="button"
                                    onClick={() => handleSelectStartDate(ymd)}
                                    className={`w-full px-3.5 py-2 text-left text-[13px] flex items-center justify-between transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-50 text-[#093697] font-semibold'
                                        : 'text-[#0B0C0F] hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>{formatYmdWithDay(ymd)}</span>
                                    {isSelected && (
                                      <span className="text-[11px] bg-[#093697] text-white px-1.5 py-0.5 rounded">
                                        Dipilih
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                          Jam Mulai
                        </label>
                        <div className="relative">
                          <select
                            value={startTime}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              setStartTime(newStart);
                              const newStartH = parseInt(newStart.split(':')[0], 10);
                              const curEndH = parseInt(endTime.split(':')[0], 10);
                              if (curEndH <= newStartH) {
                                setEndTime(`${String(newStartH + 1).padStart(2, '0')}:00`);
                              }
                              setFormError(null);
                            }}
                            className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-white outline-none cursor-pointer"
                          >
                            {START_HOUR_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Tanggal Selesai & Jam Selesai */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                          Tanggal Selesai
                        </label>
                        <div className="relative" ref={endDateRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setEndDateDropdownOpen(!endDateDropdownOpen);
                              setStartDateDropdownOpen(false);
                            }}
                            className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-white hover:border-[#093697] flex items-center justify-between text-left transition cursor-pointer shadow-xs"
                          >
                            <span>
                              {formatYmdToDmy(selectedEndDate)} ({getDaysDuration(selectedStartDate, selectedEndDate)} Hari)
                            </span>
                            <CalendarIcon className="w-4 h-4 text-[#727272] shrink-0 pointer-events-none" />
                          </button>

                          {endDateDropdownOpen && (
                            <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-[#BABABA] rounded-[8px] shadow-lg max-h-56 overflow-y-auto z-30 py-1 font-['Poppins']">
                              {endDateOptions.map((opt) => {
                                const isSelected = opt.ymd === selectedEndDate;
                                return (
                                  <button
                                    key={opt.ymd}
                                    type="button"
                                    onClick={() => handleSelectEndDate(opt.ymd)}
                                    className={`w-full px-3.5 py-2 text-left text-[13px] flex items-center justify-between transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-50 text-[#093697] font-semibold'
                                        : 'text-[#0B0C0F] hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>
                                      {formatYmdWithDay(opt.ymd)} ({opt.days} Hari)
                                    </span>
                                    {isSelected && (
                                      <span className="text-[11px] bg-[#093697] text-white px-1.5 py-0.5 rounded">
                                        Dipilih
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                          Jam Selesai
                        </label>
                        <div className="relative">
                          <select
                            value={endTime}
                            onChange={(e) => {
                              setEndTime(e.target.value);
                              setFormError(null);
                            }}
                            className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-white outline-none cursor-pointer"
                          >
                            {ALL_END_HOUR_OPTIONS
                              .filter(
                                (opt) =>
                                  parseInt(opt.split(':')[0], 10) >
                                  parseInt(startTime.split(':')[0], 10)
                              )
                              .map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Info blok rentang yang dipilih */}
                    <div className="bg-blue-50/70 border border-blue-200 rounded-[8px] px-3.5 py-2 text-[12px] text-[#093697] flex items-center justify-between">
                      <span>
                        Rentang Waktu: <strong>{startTime} - {endTime}</strong> ({selEndH - selStartH} Jam)
                      </span>
                      <span className="text-emerald-700 font-medium">
                        {Array.from({ length: selEndH - selStartH }, (_, idx) => selStartH + idx).every(
                          (h) => getSlotStatus(h, h + 1) === 'kosong'
                        )
                          ? '✓ Semua slot kosong'
                          : '⚠ Menabrak jadwal terisi'}
                      </span>
                    </div>

                    {/* Row 3: Keterangan Acara */}
                    <div>
                      <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                        Keterangan Acara
                      </label>
                      <input
                        type="text"
                        required
                        value={eventPurpose}
                        onChange={(e) => setEventPurpose(e.target.value)}
                        placeholder="Contoh: Rapat Kerja Panitia Informatika 2026"
                        className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] outline-none"
                      />
                    </div>

                    {/* Row 4: Jumlah Peserta */}
                    <div>
                      <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                        Jumlah Peserta
                      </label>
                      <input
                        type="number"
                        required
                        value={participantCount}
                        onChange={(e) => setParticipantCount(e.target.value)}
                        placeholder="Contoh: 40"
                        className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] outline-none"
                      />
                    </div>

                    {/* Tombol Cancel & Booking → */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedRoom(null)}
                        className="px-6 py-2 border border-[#BABABA] text-[#0B0C0F] rounded-[8px] font-medium hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-[#093697] hover:bg-blue-800 text-white rounded-[8px] font-medium transition shadow-xs flex items-center gap-1.5 active:scale-98"
                      >
                        <span>{isSubmitting ? 'Memproses...' : 'Booking →'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
