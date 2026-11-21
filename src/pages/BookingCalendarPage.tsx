import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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

// 15 slot jam operasional 07:00 - 22:00
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
  { startHour: 21, endHour: 22, label: '21:00 - 22:00' },
];

const START_HOUR_OPTIONS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00'
];

const ALL_END_HOUR_OPTIONS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00'
];

export const BookingCalendarPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { rooms, bookings, addBooking } = useBooking();

  // Tanggal hari ini (November 2026)
  const today = new Date();
  const todayDay = today.getDate(); // 21
  const todayFormatted = `${String(todayDay).padStart(2, '0')}/11/2026`;

  // Fakultas yang sedang dipilih (null = level 1 grid kartu fakultas, non-null = level 2 tabel ruangan)
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  // Ruangan yang sedang dipilih (null = tabel ruangan, non-null = tampilan 4 card booking Figma)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form State Detail Peminjaman (Default ke hari ini, tanpa data dummy)
  const [selectedDay, setSelectedDay] = useState<number>(todayDay);
  const [startDate, setStartDate] = useState(todayFormatted);
  const [startTime, setStartTime] = useState('07:00');
  const [endDate, setEndDate] = useState(todayFormatted);
  const [endTime, setEndTime] = useState('09:00');
  const [eventPurpose, setEventPurpose] = useState('');
  const [participantCount, setParticipantCount] = useState('');
  const [atasNama, setAtasNama] = useState('UKM atau Mahasiswa');
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Live Slot Availability State
  const [liveSlots, setLiveSlots] = useState<AvailabilitySlot[] | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live availability from backend when selectedRoom or selectedDay changes
  useEffect(() => {
    if (!selectedRoom) {
      setLiveSlots(null);
      return;
    }

    const dateStr = `2026-11-${selectedDay.toString().padStart(2, '0')}`;
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
  }, [selectedRoom, selectedDay]);

  // Status riil per slot jam (07:00 - 22:00) tanpa dummy data
  const getSlotStatus = (startH: number, endH: number): 'terisi' | 'menunggu' | 'kosong' => {
    // 1. Cek dari daftar booking aktif di context (paling akurat dan spesifik per ruangan asli)
    if (selectedRoom) {
      const dayStr = `2026-11-${String(selectedDay).padStart(2, '0')}`;
      const conflict = bookings.find((b) => {
        const matchesRoom = b.room_id === selectedRoom.id || b.room?.id === selectedRoom.id;
        const matchesDate = b.date === dayStr || b.start_at?.startsWith(dayStr);
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
    if (selectedRoom && selectedRoom.id <= 3 && liveSlots && liveSlots.length > 0) {
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

  // Cek apakah satu hari sudah penuh terisi seluruh jam operasionalnya (07:00 - 22:00)
  const isDayFull = (day: number): boolean => {
    if (!selectedRoom) return false;
    const dayStr = `2026-11-${String(day).padStart(2, '0')}`;

    if (day === selectedDay && liveSlots && liveSlots.length > 0) {
      const allOccupied = liveSlots.every((s) => s.status === 'terisi' || s.status === 'menunggu');
      if (allOccupied) return true;
    }

    const roomBookings = bookings.filter(
      (b) =>
        (b.room_id === selectedRoom.id || b.room?.id === selectedRoom.id) &&
        (b.date === dayStr || b.start_at?.startsWith(dayStr)) &&
        (b.status === 'terkonfirmasi' || b.status === 'disetujui' || b.status === 'diajukan')
    );

    const occupiedHours = new Set<number>();
    roomBookings.forEach((b) => {
      const sH = b.daily_start_hour || (b.start_at ? new Date(b.start_at).getHours() : 0);
      const eH = b.daily_end_hour || (b.end_at ? new Date(b.end_at).getHours() : 0);
      for (let h = sH; h < eH; h++) {
        if (h >= 7 && h < 22) occupiedHours.add(h);
      }
    });

    return occupiedHours.size >= 15;
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

  // Filter daftar ruangan
  const filteredRooms = rooms.filter((r) => {
    const matchesFaculty =
      !selectedFaculty || selectedFaculty === 'Semua' ? true : r.building === selectedFaculty;
    const matchesSearch =
      r.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
      (r.type_name && r.type_name.toLowerCase().includes(roomSearchQuery.toLowerCase())) ||
      (r.floor && r.floor.toLowerCase().includes(roomSearchQuery.toLowerCase()));
    return matchesFaculty && matchesSearch;
  });

  // Hitungan tab fakultas dinamis (total 20)
  const countAll = rooms.length;
  const countFTI = rooms.filter((r) => r.building === 'FTI').length;
  const countFMIPA = rooms.filter((r) => r.building === 'FMIPA').length;
  const countFPI = rooms.filter((r) => r.building === 'FPI').length;
  const countFK = rooms.filter((r) => r.building === 'FK').length;
  const countFH = rooms.filter((r) => r.building === 'FH').length;
  const countGKU = rooms.filter((r) => r.building === 'GKU').length;

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleDayClick = (day: number) => {
    if (day < todayDay) return;
    if (isDayFull(day)) return;
    setSelectedDay(day);
    const dayStr = day.toString().padStart(2, '0');
    setStartDate(`${dayStr}/11/2026`);
    setEndDate(`${dayStr}/11/2026`);
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

    // Validasi apakah rentang jam yang diblok menabrak slot yang sudah terisi / menunggu
    for (let h = startH; h < endH; h++) {
      const status = getSlotStatus(h, h + 1);
      if (status !== 'kosong') {
        const timeLabel = `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`;
        setFormError(
          `Slot jam ${timeLabel} sudah ${
            status === 'terisi' ? 'terpakai' : 'menunggu persetujuan'
          }. Silakan pilih jam lain yang kosong.`
        );
        setIsSubmitting(false);
        return;
      }
    }

    const res = await addBooking(
      {
        room_id: selectedRoom.id,
        user_id: currentUser?.id || 1,
        purpose: eventPurpose,
        organization_name: atasNama !== 'UKM atau Mahasiswa' ? atasNama : null,
        date: `2026-11-${selectedDay.toString().padStart(2, '0')}`,
        daily_start_hour: startH,
        daily_end_hour: endH,
        start_at: `2026-11-${selectedDay.toString().padStart(2, '0')}T${startH.toString().padStart(2, '0')}:00:00+07:00`,
        end_at: `2026-11-${selectedDay.toString().padStart(2, '0')}T${endH.toString().padStart(2, '0')}:00:00+07:00`,
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
      <div className="pt-6 sm:pt-8 lg:pt-[88px] px-4 sm:px-6 lg:px-12 pb-16 w-full">
        {/* Header Row: Judul di kiri, Tanggal di kanan */}
        <div className="flex flex-row items-center justify-between w-full mb-6 gap-2">
          <h1 className="font-['Poppins'] font-bold text-[24px] sm:text-[32px] text-[#093697] leading-none truncate">
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
            <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
              {/* ================= SISI KIRI ================= */}
              <div className="flex flex-col gap-8 w-full">
                {/* CARD 1: November 2026 Kalender Bulan */}
                <div className="w-full bg-white border border-[#BABABA] rounded-[16px] p-4 sm:p-7 shadow-xs">
                  {/* Month Header: November 2026 + Nav Buttons */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-['Poppins'] font-semibold text-[18px] text-[#0B0C0F]">
                      November 2026
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full border border-[#BABABA] flex items-center justify-center hover:bg-slate-50 transition"
                      >
                        <ChevronLeft className="w-4 h-4 text-[#727272]" />
                      </button>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full border border-[#BABABA] flex items-center justify-center hover:bg-slate-50 transition"
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

                  {/* Days Matrix */}
                  <div className="grid grid-cols-7 gap-y-3.5 gap-x-2 text-center font-['Poppins'] text-[15px]">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                      const isPast = d < todayDay;
                      const isFull = isDayFull(d);
                      const isSelected = selectedDay === d;

                      if (isPast) {
                        return (
                          <button
                            key={d}
                            type="button"
                            disabled
                            className="w-8 h-8 rounded-full flex items-center justify-center mx-auto text-[#CBD5E1] bg-slate-50/50 cursor-not-allowed select-none line-through"
                            title={`Tanggal ${d} November telah berlalu`}
                          >
                            {d}
                          </button>
                        );
                      }

                      if (isFull) {
                        return (
                          <button
                            key={d}
                            type="button"
                            disabled
                            className="w-8 h-8 rounded-full flex items-center justify-center mx-auto text-rose-500 bg-rose-50 border border-rose-200 cursor-not-allowed font-medium select-none line-through"
                            title={`Tanggal ${d} November: Jadwal Penuh`}
                          >
                            {d}
                          </button>
                        );
                      }

                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleDayClick(d)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#093697] text-white font-bold shadow-xs ring-2 ring-[#093697]/30'
                              : 'text-[#0B0C0F] hover:bg-blue-50 hover:text-[#093697] font-normal'
                          }`}
                          title={`Pilih tanggal ${d} November 2026`}
                        >
                          {d}
                        </button>
                      );
                    })}

                    {/* Sisa hari bulan berikutnya (1-5 Desember) abu-abu */}
                    {[1, 2, 3, 4, 5].map((d) => (
                      <span
                        key={`next-${d}`}
                        className="text-[#BABABA] flex items-center justify-center select-none"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
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
                          className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-white outline-none appearance-none cursor-pointer pr-10"
                        >
                          <option value="UKM atau Mahasiswa">UKM atau Mahasiswa</option>
                          <option value="Mahasiswa Individu">Mahasiswa Individu</option>
                          <option value="Himpunan Mahasiswa (HMTI)">Himpunan Mahasiswa (HMTI)</option>
                          <option value="Lembaga Eksekutif Mahasiswa (LEM)">LEM FTI UII</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#727272] absolute right-3.5 top-3.5 pointer-events-none" />
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
                {/* CARD 3: Ketersediaan Jadwal (Tiap Jam 07:00 - 22:00, Tanpa Data Dummy) */}
                <div className="w-full bg-white border border-[#BABABA] rounded-[16px] p-4 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-['Poppins'] font-semibold text-[18px] text-[#0B0C0F]">
                        Ketersediaan Jadwal
                      </h3>
                      <p className="text-[12px] text-[#727272] mt-0.5 font-['Poppins']">
                        {selectedDay} November 2026 • Operasional 07:00 - 22:00
                      </p>
                    </div>
                    {isLoadingSlots ? (
                      <span className="text-[12px] text-[#727272] animate-pulse font-['Poppins']">
                        Memuat data...
                      </span>
                    ) : (
                      <div className="flex items-center gap-3 text-[11px] font-['Poppins']">
                        <span className="flex items-center gap-1 text-[#166534]">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span> Kosong
                        </span>
                        <span className="flex items-center gap-1 text-[#854D0E]">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]"></span> Menunggu
                        </span>
                        <span className="flex items-center gap-1 text-[#991B1B]">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span> Terpakai
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
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            value={startDate}
                            className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-slate-50 outline-none cursor-default"
                          />
                          <CalendarIcon className="w-4 h-4 text-[#727272] absolute right-3.5 top-3.5 pointer-events-none" />
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
                            className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-white outline-none cursor-pointer pr-10"
                          >
                            {START_HOUR_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#727272] absolute right-3.5 top-3.5 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Tanggal Selesai & Jam Selesai */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                          Tanggal Selesai
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            value={endDate}
                            className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-slate-50 outline-none cursor-default"
                          />
                          <CalendarIcon className="w-4 h-4 text-[#727272] absolute right-3.5 top-3.5 pointer-events-none" />
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
                            className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#0B0C0F] bg-white outline-none cursor-pointer pr-10"
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
                          <ChevronDown className="w-4 h-4 text-[#727272] absolute right-3.5 top-3.5 pointer-events-none" />
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
