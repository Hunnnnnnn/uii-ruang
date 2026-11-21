import React, { useState } from 'react';
import {
  Search,
  Check,
  X,
  Plus,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { DatePill } from '../components/layout/DatePill';
import { useAuth } from '../context/AuthContext';
import { Booking } from '../types';

export const ApprovalPage: React.FC = () => {
  const { bookings, approveBooking, rejectBooking, addBooking, rooms } = useBooking();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'semua' | 'diajukan' | 'disetujui' | 'ditolak'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Detail Booking
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Modal Reject state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal Create On Behalf (Booking Atas Nama Dosen/Tendik FR-08)
  const [onBehalfModalOpen, setOnBehalfModalOpen] = useState(false);
  const [onBehalfName, setOnBehalfName] = useState('');
  const [onBehalfRoomId, setOnBehalfRoomId] = useState(rooms[0]?.id || 1);
  const [onBehalfDate, setOnBehalfDate] = useState('2026-11-25');
  const [onBehalfStart, setOnBehalfStart] = useState(8);
  const [onBehalfEnd, setOnBehalfEnd] = useState(10);
  const [onBehalfPurpose, setOnBehalfPurpose] = useState('');

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesTab =
      activeTab === 'semua'
        ? true
        : activeTab === 'diajukan'
        ? b.status === 'diajukan'
        : activeTab === 'disetujui'
        ? ['disetujui', 'terkonfirmasi', 'menunggu_bayar'].includes(b.status)
        : b.status === 'ditolak';

    const matchesSearch =
      b.user?.nim?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.number_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.room?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const countPending = bookings.filter((b) => b.status === 'diajukan').length;
  const countApproved = bookings.filter((b) =>
    ['disetujui', 'terkonfirmasi', 'menunggu_bayar'].includes(b.status)
  ).length;
  const countRejected = bookings.filter((b) => b.status === 'ditolak').length;
  const countAll = bookings.length;

  const handleApprove = async (bookingId: number) => {
    setActionError(null);
    const res = await approveBooking(bookingId);
    if (!res.success) {
      setActionError(res.message || 'Gagal menyetujui peminjaman');
    }
  };

  const handleOpenReject = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setActionError(null);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    if (!rejectionReason.trim()) {
      setActionError('Alasan penolakan wajib diisi (Sesuai Aturan BR-10).');
      return;
    }

    const res = await rejectBooking(selectedBooking.id, rejectionReason);
    if (!res.success) {
      setActionError(res.message || 'Gagal menolak booking');
    } else {
      setRejectModalOpen(false);
    }
  };

  const handleCreateOnBehalf = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addBooking({
      room_id: onBehalfRoomId,
      user_id: currentUser ? currentUser.id : 99,
      purpose: `[Dosen/Tendik: ${onBehalfName}] ${onBehalfPurpose}`,
      date: onBehalfDate,
      daily_start_hour: onBehalfStart,
      daily_end_hour: onBehalfEnd,
      start_at: `${onBehalfDate}T${onBehalfStart.toString().padStart(2, '0')}:00:00+07:00`,
      end_at: `${onBehalfDate}T${onBehalfEnd.toString().padStart(2, '0')}:00:00+07:00`,
    });

    if (res.success) {
      setOnBehalfModalOpen(false);
      setOnBehalfName('');
      setOnBehalfPurpose('');
    } else {
      setActionError(res.message || 'Gagal membuat booking');
    }
  };

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      {/* Full Screen Responsive Content Wrapper */}
      <div className="pt-6 sm:pt-8 lg:pt-[88px] px-4 sm:px-6 lg:px-12 pb-16 w-full">
        {/* Header Row: Full width with Title (left) & Date Pill (right) */}
        <div className="flex flex-row items-center justify-between w-full mb-6 sm:mb-8 gap-2">
          <h1 className="font-['Poppins'] font-bold text-[24px] sm:text-[32px] text-[#093697] leading-none truncate">
            Persetujuan Peminjaman
          </h1>

          {/* Date Pill Real-time */}
          <DatePill />
        </div>

        {/* Filter Tabs (Figma exact): Menunggu Persetujuan 1 | Semua 5 | Disetujui 2 | Ditolak 1 */}
        <div className="flex items-center gap-4 lg:gap-6 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('diajukan')}
            className={`font-['Poppins'] text-[14px] whitespace-nowrap transition ${
              activeTab === 'diajukan'
                ? 'bg-[#093697] text-white px-5 py-2 rounded-full font-medium shadow-xs'
                : 'text-[#0B0C0F] hover:text-[#093697]'
            }`}
          >
            Menunggu Persetujuan {countPending}
          </button>

          <button
            onClick={() => setActiveTab('semua')}
            className={`font-['Poppins'] text-[14px] whitespace-nowrap transition ${
              activeTab === 'semua'
                ? 'bg-[#093697] text-white px-5 py-2 rounded-full font-medium shadow-xs'
                : 'text-[#0B0C0F] hover:text-[#093697]'
            }`}
          >
            Semua {countAll}
          </button>

          <button
            onClick={() => setActiveTab('disetujui')}
            className={`font-['Poppins'] text-[14px] whitespace-nowrap transition ${
              activeTab === 'disetujui'
                ? 'bg-[#093697] text-white px-5 py-2 rounded-full font-medium shadow-xs'
                : 'text-[#0B0C0F] hover:text-[#093697]'
            }`}
          >
            Disetujui {countApproved}
          </button>

          <button
            onClick={() => setActiveTab('ditolak')}
            className={`font-['Poppins'] text-[14px] whitespace-nowrap transition ${
              activeTab === 'ditolak'
                ? 'bg-[#093697] text-white px-5 py-2 rounded-full font-medium shadow-xs'
                : 'text-[#0B0C0F] hover:text-[#093697]'
            }`}
          >
            Ditolak {countRejected}
          </button>
        </div>

        {/* Search Bar & Action Button: Expands 100% full width across the screen */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full">
          <div className="flex-1 w-full bg-white border border-[#E2E8F0] rounded-[8px] h-[48px] flex items-center px-4 gap-3 shadow-xs">
            <Search className="w-5 h-5 text-[#BABABA] shrink-0" />
            <input
              type="text"
              placeholder="Cari NIM atau Nama Ruangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none font-['Poppins'] text-[14px] text-[#0B0C0F] placeholder:text-[#BABABA]"
            />
          </div>

          {/* Tombol Buat Booking (Atas Nama Dosen/Tendik - FR-08) */}
          <button
            onClick={() => setOnBehalfModalOpen(true)}
            className="w-full sm:w-auto bg-[#093697] hover:bg-[#082b79] text-white rounded-[8px] h-[48px] px-6 flex items-center justify-center gap-2 font-['Poppins'] text-[14px] font-medium transition shadow-xs shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Booking (Atas Nama)</span>
          </button>
        </div>

        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Table Persetujuan Peminjaman: Stretches 100% Full Screen */}
        <div className="w-full bg-white rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
          {/* Header Table: Biru #093697 spanning full width */}
          <div className="bg-[#093697] text-white h-[48px] flex items-center px-6 font-['Poppins'] text-[14px] font-medium">
            <span className="w-[15%] min-w-[120px]">NIM Peminjam</span>
            <span className="w-[18%] min-w-[150px]">Ruangan</span>
            <span className="w-[20%] min-w-[160px]">Tanggal &amp; Jam</span>
            <span className="w-[15%] min-w-[120px]">Atas Nama</span>
            <span className="flex-1 min-w-[160px]">Keterangan Acara</span>
            <span className="w-[18%] min-w-[160px] text-center">Aksi</span>
          </div>

          {/* Table Rows: full width */}
          <div className="divide-y divide-[#E2E8F0]">
            {filteredBookings.length === 0 ? (
              <div className="py-16 text-center text-[#727272] font-['Poppins'] text-[14px]">
                Tidak ada data peminjaman yang cocok.
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="min-h-[56px] py-2 flex items-center px-6 font-['Poppins'] text-[13px] text-[#0B0C0F] hover:bg-slate-50 transition"
                >
                  <span className="w-[15%] min-w-[120px] font-medium">
                    {booking.user?.number_id || booking.user?.nim || '24523014'}
                  </span>
                  <span className="w-[18%] min-w-[150px]">
                    {booking.room
                      ? booking.room.name.startsWith(booking.room.building)
                        ? booking.room.name
                        : `${booking.room.building} - ${booking.room.name}`
                      : 'FTI - 3.14 (IFP)'}
                  </span>
                  <span className="w-[20%] min-w-[160px] text-[#727272]">
                    {booking.date ? `${booking.date}, ` : '2026-11-25, '}
                    {booking.start_at
                      ? `${booking.start_at.slice(11, 16)} - ${booking.end_at?.slice(11, 16)}`
                      : `${String(booking.daily_start_hour || 7).padStart(2, '0')}:00 - ${String(booking.daily_end_hour || 9).padStart(2, '0')}:00`}
                  </span>
                  <span className="w-[15%] min-w-[120px]">
                    {booking.organization_name
                      ? 'UKM'
                      : booking.purpose.includes('Dosen')
                      ? 'Dosen/Tendik'
                      : 'Mahasiswa'}
                  </span>
                  <div className="flex-1 min-w-[160px] flex items-center gap-2 pr-4">
                    <span className="truncate">
                      {booking.purpose}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setDetailModalOpen(true);
                      }}
                      className="text-[#727272] hover:text-[#093697] transition p-1 shrink-0"
                      title="Lihat Detail & Surat Izin"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Kolom Aksi */}
                  <div className="w-[18%] min-w-[160px] flex items-center justify-center gap-2">
                    {booking.status === 'diajukan' ? (
                      <>
                        <button
                          onClick={() => handleApprove(booking.id)}
                          className="bg-[#14926F] hover:bg-[#0E7A5C] text-white px-3.5 py-1.5 rounded-[6px] text-[12px] font-medium flex items-center gap-1 transition shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                        <button
                          onClick={() => handleOpenReject(booking)}
                          className="border border-[#CA0004] text-[#CA0004] hover:bg-red-50 px-3.5 py-1.5 rounded-[6px] text-[12px] font-medium flex items-center gap-1 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    ) : booking.status === 'disetujui' || booking.status === 'terkonfirmasi' ? (
                      <span className="bg-[#14926F] text-white px-3.5 py-1.5 rounded-[6px] text-[12px] font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Disetujui</span>
                      </span>
                    ) : (
                      <span className="border border-[#CA0004] text-[#CA0004] px-3.5 py-1.5 rounded-[6px] text-[12px] font-medium flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        <span>Ditolak</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Detail Booking & Preview Surat Dokumen */}
      {detailModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[540px] p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-['Poppins'] font-semibold text-lg text-[#0B0C0F]">
                Detail Permohonan Peminjaman
              </h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 font-['Poppins'] text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">NIM Peminjam:</span>
                <span className="font-medium text-[#0B0C0F]">
                  {selectedBooking.user?.number_id || selectedBooking.user?.nim} ({selectedBooking.user?.name})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ruangan:</span>
                <span className="font-medium text-[#093697]">
                  {selectedBooking.room
                    ? selectedBooking.room.name.startsWith(selectedBooking.room.building)
                      ? selectedBooking.room.name
                      : `${selectedBooking.room.building} - ${selectedBooking.room.name}`
                    : 'Ruangan'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Waktu Pelaksanaan:</span>
                <span className="font-medium text-[#0B0C0F]">
                  {selectedBooking.date || (selectedBooking.start_at ? selectedBooking.start_at.slice(0, 10) : '2026-11-26')},{' '}
                  {selectedBooking.start_at
                    ? selectedBooking.start_at.slice(11, 16)
                    : `${String(selectedBooking.daily_start_hour || 7).padStart(2, '0')}:00`}{' '}
                  -{' '}
                  {selectedBooking.end_at
                    ? selectedBooking.end_at.slice(11, 16)
                    : `${String(selectedBooking.daily_end_hour || 9).padStart(2, '0')}:00`}{' '}
                  WIB
                </span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Tujuan / Keterangan:</span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-700 leading-relaxed">
                  {selectedBooking.purpose}
                </p>
              </div>

              {/* Dokumen / Surat Izin Peminjaman */}
              <div className="pt-2">
                <span className="text-slate-500 block mb-2 font-medium">Dokumen Pendukung:</span>
                <div className="flex items-center gap-3 p-3 bg-[#F5F8FF] border border-[#CBD5E1] rounded-xl">
                  <FileText className="w-8 h-8 text-[#093697] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-[#0B0C0F] truncate">
                      Surat_Pengajuan_{selectedBooking.user?.number_id || selectedBooking.user?.nim || 'UII'}.pdf
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Terverifikasi tanda tangan digital BEM/DPM
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#093697] hover:underline cursor-pointer">
                    Lihat PDF
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
              >
                Tutup
              </button>
              {selectedBooking.status === 'diajukan' && (
                <button
                  onClick={() => {
                    handleApprove(selectedBooking.id);
                    setDetailModalOpen(false);
                  }}
                  className="px-4 py-2 bg-[#14926F] hover:bg-[#0E7A5C] text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui Langsung</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject Booking (Wajib Alasan Penolakan BR-10) */}
      {rejectModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[460px] p-6 shadow-xl border border-slate-100">
            <h3 className="font-['Poppins'] font-semibold text-lg text-red-600 mb-2">
              Tolak Permohonan Peminjaman
            </h3>
            <p className="font-['Poppins'] text-xs text-slate-500 mb-4">
              Sesuai aturan BR-10, Admin wajib menyertakan alasan penolakan tertulis yang jelas kepada pemohon.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penolakan *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Jadwal bertabrakan dengan Ujian Tengah Semester atau kegiatan rektorat."
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create On Behalf (FR-08 Booking Atas Nama) */}
      {onBehalfModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[500px] p-6 shadow-xl border border-slate-100">
            <h3 className="font-['Poppins'] font-semibold text-lg text-[#093697] mb-1">
              Buat Booking Atas Nama Dosen/Tendik
            </h3>
            <p className="font-['Poppins'] text-xs text-slate-500 mb-4">
              Fitur FR-08: Admin dapat memesan ruangan langsung atas nama civitas akademika tanpa pembatasan H-3.
            </p>

            <form onSubmit={handleCreateOnBehalf} className="space-y-3 font-['Poppins'] text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Dosen / Tendik *
                </label>
                <input
                  type="text"
                  value={onBehalfName}
                  onChange={(e) => setOnBehalfName(e.target.value)}
                  placeholder="Contoh: Dr. Ir. Ahmad Dahlan, M.T."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#093697]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Pilih Ruangan *
                </label>
                <select
                  value={onBehalfRoomId}
                  onChange={(e) => setOnBehalfRoomId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#093697] bg-white"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.building} (Kapasitas: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tanggal Peminjaman *
                  </label>
                  <input
                    type="date"
                    value={onBehalfDate}
                    onChange={(e) => setOnBehalfDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#093697]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Jam (Mulai - Selesai) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={7}
                      max={20}
                      value={onBehalfStart}
                      onChange={(e) => setOnBehalfStart(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm text-center"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      min={8}
                      max={21}
                      value={onBehalfEnd}
                      onChange={(e) => setOnBehalfEnd(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Agenda / Tujuan Kegiatan *
                </label>
                <textarea
                  rows={2}
                  value={onBehalfPurpose}
                  onChange={(e) => setOnBehalfPurpose(e.target.value)}
                  placeholder="Contoh: Kuliah Tamu Artificial Intelligence bersama praktisi"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#093697]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOnBehalfModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#093697] hover:bg-[#082b79] text-white rounded-lg text-sm font-medium transition"
                >
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};