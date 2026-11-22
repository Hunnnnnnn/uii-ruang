import React, { useState } from 'react';
import {
  Search,
  Check,
  X,
  Plus,
  Eye,
  FileText,
  AlertCircle,
  ExternalLink,
  ArrowRightLeft,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { DatePill } from '../components/layout/DatePill';
import { Booking } from '../types';

export const ApprovalPage: React.FC = () => {
  const { bookings, approveBooking, rejectBooking, createAdminBooking, moveBooking, rooms } =
    useBooking();

  const [activeTab, setActiveTab] = useState<'semua' | 'diajukan' | 'disetujui' | 'ditolak'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Detail Booking
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Modal Preview PDF Dokumen (TC_ADMIN_002)
  const [docPreviewModalOpen, setDocPreviewModalOpen] = useState(false);
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);

  // Modal Reject state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal Move Room state (BUG_014 / POST /api/v1/admin/bookings/{id}/move)
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveBookingTarget, setMoveBookingTarget] = useState<Booking | null>(null);
  const [moveTargetRoomId, setMoveTargetRoomId] = useState<number>(rooms[0]?.id || 1);
  const [moveReason, setMoveReason] = useState('');
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moveSuccess, setMoveSuccess] = useState<string | null>(null);

  // Modal Create On Behalf (Booking Atas Nama Dosen/Tendik FR-08 / TC_ADMBOOK_001)
  const [onBehalfModalOpen, setOnBehalfModalOpen] = useState(false);
  const [onBehalfName, setOnBehalfName] = useState('');
  const [onBehalfRoomId, setOnBehalfRoomId] = useState(rooms[0]?.id || 1);
  const [onBehalfDate, setOnBehalfDate] = useState('2026-11-25');
  const [onBehalfStart, setOnBehalfStart] = useState(8);
  const [onBehalfEnd, setOnBehalfEnd] = useState(10);
  const [onBehalfPurpose, setOnBehalfPurpose] = useState('');
  const [onBehalfReason, setOnBehalfReason] = useState('');

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
      b.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.on_behalf_of && b.on_behalf_of.toLowerCase().includes(searchQuery.toLowerCase()));

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

  const handleViewPdf = (booking: Booking) => {
    setPreviewBooking(booking);
    setDocPreviewModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    const trimmed = rejectionReason.trim();
    if (!trimmed) {
      setActionError('Alasan penolakan wajib diisi (Sesuai Aturan BR-10).');
      return;
    }

    const res = await rejectBooking(selectedBooking.id, trimmed);
    if (!res.success) {
      setActionError(res.message || 'Gagal menolak booking');
    } else {
      setRejectModalOpen(false);
      setSelectedBooking(null);
      setRejectionReason('');
      setActionError(null);
    }
  };

  const handleOpenMove = (booking: Booking) => {
    setMoveBookingTarget(booking);
    const otherRoom = rooms.find((r) => r.id !== booking.room_id) || rooms[0];
    if (otherRoom) setMoveTargetRoomId(otherRoom.id);
    setMoveReason('');
    setMoveError(null);
    setMoveModalOpen(true);
  };

  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveBookingTarget) return;

    if (!moveReason.trim() || moveReason.trim().length < 10) {
      setMoveError('Alasan pemindahan ruangan minimal 10 karakter.');
      return;
    }

    if (moveTargetRoomId === moveBookingTarget.room_id) {
      setMoveError('Ruangan tujuan tidak boleh sama dengan ruangan awal.');
      return;
    }

    const res = await moveBooking(moveBookingTarget.id, moveTargetRoomId, moveReason.trim());
    if (!res.success) {
      setMoveError(res.message || 'Gagal memindahkan ruangan booking.');
    } else {
      setMoveModalOpen(false);
      setMoveBookingTarget(null);
      setMoveSuccess('Ruangan booking berhasil dipindahkan!');
      setTimeout(() => setMoveSuccess(null), 3500);
    }
  };

  const handleCreateOnBehalf = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const nameTrimmed = onBehalfName.trim();
    if (!nameTrimmed) {
      setActionError('Nama Dosen / Pihak yang diwakili wajib diisi.');
      return;
    }

    const purposeTrimmed = onBehalfPurpose.trim();
    if (purposeTrimmed.length < 5) {
      setActionError('Agenda / Tujuan kegiatan minimal 5 karakter.');
      return;
    }

    const reasonTrimmed = onBehalfReason.trim();
    if (reasonTrimmed && reasonTrimmed.length < 10) {
      setActionError('Alasan peminjaman admin minimal 10 karakter.');
      return;
    }

    if (onBehalfStart >= onBehalfEnd) {
      setActionError('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }

    const res = await createAdminBooking({
      room_id: onBehalfRoomId,
      on_behalf_name: nameTrimmed,
      date: onBehalfDate,
      start_hour: onBehalfStart,
      end_hour: onBehalfEnd,
      purpose: purposeTrimmed,
      reason_for_admin_booking:
        reasonTrimmed || `Permohonan resmi peminjaman ruangan atas nama ${nameTrimmed}.`,
    });

    if (res.success) {
      setOnBehalfModalOpen(false);
      setOnBehalfName('');
      setOnBehalfPurpose('');
      setOnBehalfReason('');
      setActionError(null);
    } else {
      setActionError(res.message || 'Gagal membuat booking atas nama');
    }
  };

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      {/* Full Screen Responsive Content Wrapper */}
      <div className="pt-5 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-12 pb-16 w-full">
        {/* Header Row: Full width with Title (left) & Date Pill (right) */}
        <div className="flex flex-row items-center justify-between w-full mb-6 sm:mb-7 gap-3 min-h-[44px]">
          <h1 className="font-['Poppins'] font-bold text-[24px] sm:text-[32px] text-[#093697] leading-tight pb-0.5 flex-1 min-w-0">
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

          {/* Tombol Buat Booking (Atas Nama Dosen/Tendik - FR-08 / TC_ADMBOOK_001) */}
          <button
            onClick={() => {
              setActionError(null);
              setOnBehalfModalOpen(true);
            }}
            className="w-full sm:w-auto bg-[#093697] hover:bg-[#082b79] text-white rounded-[8px] h-[48px] px-6 flex items-center justify-center gap-2 font-['Poppins'] text-[14px] font-medium transition shadow-xs shrink-0 cursor-pointer"
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

        {moveSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-sm">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{moveSuccess}</span>
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
                    {booking.on_behalf_of
                      ? 'Dosen'
                      : booking.user?.number_id || booking.user?.nim || '24523014'}
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
                    {booking.on_behalf_of
                      ? `Dosen (${booking.on_behalf_of})`
                      : booking.organization_name
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
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#14926F] text-white px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Disetujui</span>
                        </span>
                        <button
                          onClick={() => handleOpenMove(booking)}
                          className="bg-blue-50 border border-blue-200 text-[#093697] hover:bg-blue-100 px-2 py-1.5 rounded-[6px] text-[11.5px] font-medium flex items-center gap-1 transition shadow-2xs cursor-pointer"
                          title="Pindahkan ke Ruangan Lain (Move Room - BUG_014)"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Pindah</span>
                        </button>
                      </div>
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
                  <button
                    type="button"
                    onClick={() => handleViewPdf(selectedBooking)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#093697] hover:bg-[#072B7A] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat PDF</span>
                  </button>
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
              {(selectedBooking.status === 'disetujui' || selectedBooking.status === 'terkonfirmasi') && (
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenMove(selectedBooking);
                  }}
                  className="px-4 py-2 bg-blue-50 border border-blue-200 text-[#093697] hover:bg-blue-100 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Pindahkan Ruangan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject Booking (Wajib Alasan Penolakan BR-10 / TC_ADMIN_005) */}
      {rejectModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[460px] p-6 shadow-xl border border-slate-100">
            <h3 className="font-['Poppins'] font-semibold text-lg text-red-600 mb-2">
              Tolak Permohonan Peminjaman
            </h3>
            <p className="font-['Poppins'] text-xs text-slate-500 mb-4">
              Sesuai aturan BR-10, Admin wajib menyertakan alasan penolakan tertulis yang jelas kepada pemohon.
            </p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penolakan *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (actionError) setActionError(null);
                  }}
                  placeholder="Contoh: Jadwal bertabrakan dengan Ujian Tengah Semester atau kegiatan rektorat."
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setActionError(null);
                  }}
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
                  Agenda / Tujuan Kegiatan * (Min. 5 karakter)
                </label>
                <textarea
                  rows={2}
                  value={onBehalfPurpose}
                  onChange={(e) => {
                    setOnBehalfPurpose(e.target.value);
                    if (actionError) setActionError(null);
                  }}
                  placeholder="Contoh: Kuliah Tamu Artificial Intelligence bersama praktisi"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#093697]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Alasan / Dasar Peminjaman Admin * (Min. 10 karakter)
                </label>
                <textarea
                  rows={2}
                  value={onBehalfReason}
                  onChange={(e) => {
                    setOnBehalfReason(e.target.value);
                    if (actionError) setActionError(null);
                  }}
                  placeholder="Contoh: Permintaan resmi jadwal kuliah pengganti dari fakultas/dosen."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#093697]"
                  required
                />
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setOnBehalfModalOpen(false);
                    setActionError(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#093697] hover:bg-[#082b79] text-white rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview PDF Dokumen Surat Izin (TC_ADMIN_002) */}
      {docPreviewModalOpen && previewBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-[#093697]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Poppins'] font-bold text-sm text-[#0B0C0F]">
                    Dokumen Surat Izin Kegiatan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Surat_Pengajuan_{previewBooking.user?.number_id || previewBooking.user?.nim || 'UII'}.pdf
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDocPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content / Preview Canvas (Simulasi Surat Resmi UII) */}
            <div className="p-6 overflow-y-auto bg-slate-100/70 font-['Poppins']">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 text-[#0B0C0F] text-xs leading-relaxed">
                {/* Kop Surat Resmi UII */}
                <div className="border-b-2 border-[#093697] pb-3 mb-4 text-center">
                  <h4 className="font-bold text-[14px] text-[#093697] tracking-wider uppercase">
                    Universitas Islam Indonesia
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-700">
                    DIREKTORAT PENGELOLAAN SARANA & PRASARANA
                  </p>
                  <p className="text-[9.5px] text-slate-500">
                    Gedung Kuliah Umum (GKU) Sayap Timur Lt. 1, Kampus Terpadu UII, Jl. Kaliurang KM 14.5 Sleman
                  </p>
                </div>

                {/* Judul Surat */}
                <div className="text-center mb-5">
                  <h5 className="font-bold text-xs underline uppercase tracking-wide">
                    Surat Permohonan Izin Peminjaman Ruangan
                  </h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Nomor: UII/DPSP/XI/2026/{String(previewBooking.id).padStart(4, '0')}
                  </p>
                </div>

                {/* Isi Informasi Pemohon & Ruangan */}
                <div className="space-y-2 mb-5">
                  <div className="grid grid-cols-3 gap-2 py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Nama Pemohon</span>
                    <span className="col-span-2 font-medium">{previewBooking.user?.name || 'Mahasiswa UII'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">NIM / ID</span>
                    <span className="col-span-2 font-medium">{previewBooking.user?.number_id || previewBooking.user?.nim || '24523014'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Organisasi</span>
                    <span className="col-span-2 font-medium">{previewBooking.organization_name || 'Himpunan / Lembaga Mahasiswa UII'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Ruangan Diminta</span>
                    <span className="col-span-2 font-semibold text-[#093697]">
                      {previewBooking.room?.name || 'Ruang Kuliah'} ({previewBooking.room?.building || 'FTI'})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Tanggal Kegiatan</span>
                    <span className="col-span-2 font-medium">
                      {previewBooking.date}
                      {previewBooking.end_date && previewBooking.end_date !== previewBooking.date
                        ? ` s/d ${previewBooking.end_date}`
                        : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Waktu Pelaksanaan</span>
                    <span className="col-span-2 font-medium">
                      {previewBooking.start_at
                        ? `${previewBooking.start_at.slice(11, 16)} - ${previewBooking.end_at?.slice(11, 16)} WIB`
                        : `${String(previewBooking.daily_start_hour || 7).padStart(2, '0')}:00 - ${String(previewBooking.daily_end_hour || 9).padStart(2, '0')}:00 WIB`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-0.5">
                    <span className="text-slate-500">Tujuan Kegiatan</span>
                    <span className="col-span-2 italic text-slate-700 bg-slate-50 p-2 rounded">
                      "{previewBooking.purpose}"
                    </span>
                  </div>
                </div>

                {/* Stempel Digital Verification */}
                <div className="mt-6 pt-4 border-t border-dashed border-slate-300 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500">
                    <p className="font-semibold text-slate-700">Verifikasi Sistem UII Ruang:</p>
                    <p>UUID: {previewBooking.id}-2026-XI-VERIFIED</p>
                    <p className="text-[9px] text-[#14926F] font-semibold mt-0.5">✓ Tanda Tangan Elektronik Sah</p>
                  </div>
                  <div className="border border-[#14926F] bg-emerald-50 text-[#14926F] px-3 py-1.5 rounded-lg text-center font-bold text-[10px] tracking-wider uppercase">
                    TERVERIFIKASI
                    <span className="block text-[8px] font-normal lowercase tracking-normal">BEM / DPM UII</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                1 Dokumen Terlampir (.PDF)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Surat_Pengajuan_${previewBooking.id}.pdf</title>
                            <style>
                              body { font-family: sans-serif; padding: 40px; color: #1e293b; }
                              .header { text-align: center; border-bottom: 2px solid #093697; padding-bottom: 12px; margin-bottom: 20px; }
                              h2 { margin: 0; color: #093697; }
                              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                              td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                              .label { width: 30%; color: #64748b; font-weight: 500; }
                              .stamp { margin-top: 40px; border: 2px solid #14926F; color: #14926F; padding: 12px; display: inline-block; font-weight: bold; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <h2>UNIVERSITAS ISLAM INDONESIA</h2>
                              <p>SURAT PERMOHONAN IZIN PEMINJAMAN RUANGAN</p>
                              <small>Nomor: UII/DPSP/XI/2026/${String(previewBooking.id).padStart(4, '0')}</small>
                            </div>
                            <table>
                              <tr><td class="label">Nama Pemohon</td><td>${previewBooking.user?.name || 'Mahasiswa UII'}</td></tr>
                              <tr><td class="label">NIM</td><td>${previewBooking.user?.number_id || previewBooking.user?.nim || '24523014'}</td></tr>
                              <tr><td class="label">Ruangan</td><td>${previewBooking.room?.name || 'Ruang Kuliah'} (${previewBooking.room?.building || 'FTI'})</td></tr>
                              <tr><td class="label">Tanggal</td><td>${previewBooking.date}</td></tr>
                              <tr><td class="label">Keperluan</td><td>${previewBooking.purpose}</td></tr>
                            </table>
                            <div class="stamp">TERVERIFIKASI RESMI DPM/BEM UII</div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                    }
                  }}
                  className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Baru</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocPreviewModalOpen(false)}
                  className="px-4 py-2 bg-[#093697] hover:bg-[#072B7A] text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pindahkan Ruangan (Move Room - BUG_014 / POST /api/v1/admin/bookings/{id}/move) */}
      {moveModalOpen && moveBookingTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[480px] p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-['Poppins'] font-semibold text-lg text-[#093697] mb-1 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#093697]" />
              <span>Pindahkan Ruangan (Move Room)</span>
            </h3>
            <p className="font-['Poppins'] text-xs text-slate-500 mb-4">
              Admin dapat memindahkan jadwal peminjaman ke ruangan alternatif yang tersedia jika ruangan saat ini mengalami kendala teknis atau perbaikan.
            </p>

            {moveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{moveError}</span>
              </div>
            )}

            <div className="mb-4 p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-700 font-['Poppins']">
              <p>
                <strong>Peminjam:</strong>{' '}
                {moveBookingTarget.user?.name || moveBookingTarget.on_behalf_of || '-'}
              </p>
              <p>
                <strong>Ruangan Awal:</strong> {moveBookingTarget.room?.building} -{' '}
                {moveBookingTarget.room?.name}
              </p>
              <p>
                <strong>Jadwal:</strong> {moveBookingTarget.date || moveBookingTarget.start_at?.slice(0, 10)}{' '}
                (Pukul {String(moveBookingTarget.daily_start_hour || 7).padStart(2, '0')}:00 -{' '}
                {String(moveBookingTarget.daily_end_hour || 9).padStart(2, '0')}:00)
              </p>
            </div>

            <form onSubmit={handleConfirmMove} className="space-y-4 font-['Poppins']">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Ruangan Tujuan Baru *
                </label>
                <select
                  value={moveTargetRoomId}
                  onChange={(e) => {
                    setMoveTargetRoomId(Number(e.target.value));
                    if (moveError) setMoveError(null);
                  }}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#093697] outline-none bg-white cursor-pointer"
                  required
                >
                  {rooms
                    .filter((r) => r.id !== moveBookingTarget.room_id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.building} - {r.name} (Kapasitas: {r.capacity})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Pemindahan Ruangan * (Minimal 10 karakter)
                </label>
                <textarea
                  rows={3}
                  value={moveReason}
                  onChange={(e) => {
                    setMoveReason(e.target.value);
                    if (moveError) setMoveError(null);
                  }}
                  placeholder="Contoh: Ruangan awal mengalami kendala fasilitas pendingin (AC) dan dialihkan ke ruangan alternatif."
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#093697] outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMoveModalOpen(false);
                    setMoveBookingTarget(null);
                    setMoveError(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#093697] hover:bg-[#072B7A] text-white rounded-lg text-sm font-medium transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Simpan Pemindahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};