import React, { useState } from 'react';
import { Clock, AlertTriangle, Calendar, Check, X } from 'lucide-react';
import card1HeroImg from '../assets/card1_hero.png';
import { useBooking } from '../context/BookingContext';
import { DatePill } from '../components/layout/DatePill';

export const AdminDashboardPage: React.FC = () => {
  const { bookings, damageReports, approveBooking, rejectBooking } = useBooking();
  const [actionFeedback, setActionFeedback] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Pending bookings from live state
  const pendingBookings = bookings.filter((b) => b.status === 'diajukan');
  const countPending = pendingBookings.length;
  const countDamage = damageReports.filter((d) => d.status === 'dilaporkan').length;
  const countActive = bookings.filter(
    (b) => b.status === 'disetujui' || b.status === 'terkonfirmasi'
  ).length;

  const queueItems = pendingBookings.map((b) => ({
    id: b.id,
    nim: b.user?.number_id || b.user?.nim || '-',
    room: b.room
      ? b.room.name.startsWith(b.room.building)
        ? b.room.name
        : `${b.room.building} - ${b.room.name}`
      : 'Ruangan',
    allowApprove: true,
    allowReject: true,
  }));

  const handleApprove = async (id: number) => {
    const res = await approveBooking(id);
    if (!res.success) {
      setActionFeedback({
        text: res.message || 'Gagal menyetujui peminjaman.',
        type: 'error',
      });
    } else {
      setActionFeedback({
        text: 'Permohonan peminjaman berhasil disetujui!',
        type: 'success',
      });
    }
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleReject = async (id: number) => {
    const res = await rejectBooking(id, 'Ditolak oleh admin melalui dashboard.');
    if (!res.success) {
      setActionFeedback({
        text: res.message || 'Gagal menolak peminjaman.',
        type: 'error',
      });
    } else {
      setActionFeedback({
        text: 'Permohonan peminjaman telah ditolak.',
        type: 'success',
      });
    }
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Dapatkan daftar kegiatan peminjaman ruangan yang disetujui / aktif
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const currentHour = today.getHours();

  const approvedBookings = bookings.filter(
    (b) => b.status === 'disetujui' || b.status === 'terkonfirmasi'
  );

  const todayBookings = approvedBookings.filter(
    (b) => b.date === todayStr || (b.start_at && b.start_at.startsWith(todayStr))
  );

  const displayActivities =
    todayBookings.length > 0 ? todayBookings : approvedBookings.slice(0, 4);

  const activeActivities = displayActivities.map((b) => {
    const roomLabel = b.room
      ? b.room.name.startsWith(b.room.building)
        ? b.room.name
        : `${b.room.building} - ${b.room.name}`
      : 'Ruangan';
    const sH = b.daily_start_hour || (b.start_at ? new Date(b.start_at).getHours() : 7);
    const eH = b.daily_end_hour || (b.end_at ? new Date(b.end_at).getHours() : 9);
    const timeText = `${String(sH).padStart(2, '0')}:00 - ${String(eH).padStart(2, '0')}:00`;
    const isCurrent =
      (b.date === todayStr || (b.start_at && b.start_at.startsWith(todayStr))) &&
      currentHour >= sH &&
      currentHour < eH;

    return {
      id: b.id,
      roomLabel,
      timeText,
      purpose: b.purpose || 'Kegiatan Mahasiswa',
      isCurrent,
      statusBadge: isCurrent ? 'SAAT INI' : 'DISETUJUI',
    };
  });

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      {/* Full Screen Responsive Content Wrapper */}
      <div className="pt-[88px] px-8 lg:px-12 pb-16 w-full">
        {/* Header Row: Full width with Title (left) & Date Pill (right) */}
        <div className="flex items-center justify-between w-full mb-8">
          <h1 className="font-['Poppins'] font-bold text-[32px] text-[#093697] leading-none">
            Dashboard Admin
          </h1>

          {/* Date Pill Real-time */}
          <DatePill />
        </div>

        {/* 2 Main Columns Layout: Left Content (flex-1) & Right Content (w-[400px]-w-[420px]) */}
        <div className="flex flex-col xl:flex-row items-stretch gap-8 w-full">
          {/* SISI KIRI (Fills remaining width) */}
          <div className="flex-1 w-full min-w-0 flex flex-col justify-between">
            <div>
              {/* 1. Hero Card: Halo, Admin (Full width of left column, matching Figma) */}
              <div
                className="w-full h-[155px] rounded-[16px] relative overflow-hidden mb-6 shadow-sm"
                style={{
                  backgroundImage:
                    'linear-gradient(87.09deg, rgb(1, 33, 101) 1.16%, rgb(9, 54, 151) 50.34%, rgb(36, 92, 132) 99.52%)',
                }}
              >
                {/* Teks Sisi Kiri: Clean "Halo, Admin" without extra subtext */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-white z-10">
                  <h2 className="font-['Poppins'] font-semibold text-[34px] leading-tight">
                    Halo, <span className="text-[#ECCA2E]">Admin</span>
                  </h2>
                </div>

                {/* Ilustrasi Isometrik Sisi Kanan */}
                <div className="absolute right-0 top-0 h-full w-[360px] opacity-90 pointer-events-none">
                  <img
                    src={card1HeroImg}
                    alt="Ruang UII"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* 2. Row 3 Stat Cards (Stretches full width via Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
                {/* Stat 1: Menunggu Persetujuan */}
                <div className="h-[149px] rounded-[16px] bg-[#FFFBEA] border border-[#FDE68A] p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="font-['Poppins'] font-medium text-[13px] text-[#78350F] leading-tight">
                      Menunggu Persetujuan
                    </span>
                  </div>
                  <div className="flex items-center justify-center pb-1">
                    <span className="font-['Poppins'] font-bold text-[52px] text-[#ECCA2E] leading-none">
                      {countPending}
                    </span>
                  </div>
                </div>

                {/* Stat 2: Laporan Kerusakan Baru */}
                <div className="h-[149px] rounded-[16px] bg-[#FFF1F2] border border-[#FECDD3] p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#FFE4E6] flex items-center justify-center text-[#E11D48] shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="font-['Poppins'] font-medium text-[13px] text-[#9F1239] leading-tight">
                      Laporan Kerusakan Baru
                    </span>
                  </div>
                  <div className="flex items-center justify-center pb-1">
                    <span className="font-['Poppins'] font-bold text-[52px] text-[#EF4444] leading-none">
                      {countDamage}
                    </span>
                  </div>
                </div>

                {/* Stat 3: Ruang Sedang Dipakai */}
                <div className="h-[149px] rounded-[16px] bg-[#F0FDF4] border border-[#BBF7D0] p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-['Poppins'] font-medium text-[13px] text-[#14532D] leading-tight">
                      Ruang Sedang Dipakai
                    </span>
                  </div>
                  <div className="flex items-center justify-center pb-1">
                    <span className="font-['Poppins'] font-bold text-[52px] text-[#22C55E] leading-none">
                      {countActive}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Section: Antrian Approval Terbaru (Full width) */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-['Poppins'] font-normal text-[20px] text-[#0B0C0F]">
                    Antrian Approval Terbaru
                  </h3>
                  {pendingBookings.length > 0 && (
                    <span className="font-['Poppins'] text-[12px] bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full">
                      {pendingBookings.length} permohonan riil menunggu
                    </span>
                  )}
                </div>

                {/* Banner Feedback Aksi (Setujui / Tolak) */}
                {actionFeedback && (
                  <div
                    className={`mb-3 px-4 py-2.5 rounded-[8px] text-[13px] font-['Poppins'] flex items-center justify-between border transition shadow-xs ${
                      actionFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <span className="font-medium">{actionFeedback.text}</span>
                    <button
                      onClick={() => setActionFeedback(null)}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                      title="Tutup pesan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="w-full bg-white rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
                  {/* Header Table matching Figma column names */}
                  <div className="bg-[#093697] text-white h-[44px] flex items-center px-6 font-['Poppins'] text-[14px] font-medium">
                    <span className="w-[32%] min-w-[120px]">NIM Peminjam</span>
                    <span className="w-[46%] min-w-[160px]">Ruan</span>
                    <span className="w-[22%] min-w-[120px] text-center">Aksi</span>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-[#E2E8F0]">
                    {queueItems.length === 0 ? (
                      <div className="py-10 text-center font-['Poppins'] text-[#727272] text-[13px] flex flex-col items-center justify-center gap-1.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-0.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="font-medium text-[#0B0C0F]">Tidak ada antrean approval</p>
                        <p className="text-[12px] text-slate-400">
                          Semua permohonan peminjaman telah selesai diproses.
                        </p>
                      </div>
                    ) : (
                      queueItems.map((item) => (
                        <div
                          key={item.id}
                          className="h-[48px] flex items-center px-6 font-['Poppins'] text-[13px] text-[#0B0C0F] hover:bg-slate-50 transition"
                        >
                          <span className="w-[32%] min-w-[120px] font-medium">{item.nim}</span>
                          <span className="w-[46%] min-w-[160px] font-normal truncate pr-2">
                            {item.room}
                          </span>
                          <div className="w-[22%] min-w-[120px] flex items-center justify-center gap-1.5">
                            {item.allowApprove && (
                              <button
                                onClick={() => handleApprove(item.id)}
                                className="bg-[#149775] hover:bg-[#0E7A5C] text-white px-3 py-1 rounded-[6px] text-[12px] font-medium flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                                title="Setujui Peminjaman"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Setujui</span>
                              </button>
                            )}
                            {item.allowReject && (
                              <button
                                onClick={() => handleReject(item.id)}
                                className="border border-[#CA0004] text-[#CA0004] bg-white hover:bg-red-50 px-3 py-1 rounded-[6px] text-[12px] font-medium flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                                title="Tolak Peminjaman"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Tolak</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SISI KANAN: Booking & Kegiatan Hari Ini (Dinamis dari data riil) */}
          <div className="w-full xl:w-[400px] 2xl:w-[420px] rounded-[16px] bg-white border border-[#BABABA] p-6 shrink-0 flex flex-col justify-start shadow-sm self-stretch">
            <h3 className="font-['Poppins'] font-semibold text-[17px] text-[#0B0C0F]">
              Booking &amp; Kegiatan Hari Ini
            </h3>

            {/* Date Capsule Pill Real-time: Hari, DD MMMM YYYY */}
            <DatePill
              includeWeekday
              className="w-full max-w-[270px] h-[32px] mx-auto mt-3 mb-5 px-4"
              textClassName="font-['Poppins'] font-normal text-[12px] text-[#727272] leading-none"
            />

            <h4 className="font-['Poppins'] font-semibold text-[14px] text-[#0B0C0F] mb-3">
              Daftar Kegiatan Aktif
            </h4>

            {activeActivities.length === 0 ? (
              <div className="py-8 text-center text-[#727272] font-['Poppins'] text-[13px] flex flex-col items-center justify-center">
                <p className="font-medium text-[#0B0C0F]">Belum ada kegiatan aktif</p>
                <p className="text-[12px] text-slate-400 mt-1">
                  Tidak ada jadwal peminjaman ruangan yang sedang berlangsung.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {activeActivities.map((act, idx) => (
                  <React.Fragment key={act.id}>
                    {idx > 0 && <div className="border-b border-[#E5E7EB] my-3" />}
                    <div className="py-2 flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-['Poppins'] font-medium text-[13px] text-[#0B0C0F] leading-tight truncate">
                          {act.roomLabel}
                        </p>
                        <p className="font-['Poppins'] font-normal text-[12px] text-[#727272] mt-1 truncate">
                          {act.timeText} | {act.purpose}
                        </p>
                      </div>
                      <span
                        className={`text-white text-[10.5px] font-semibold tracking-wide px-3 py-1 rounded-full shadow-xs shrink-0 ${
                          act.isCurrent ? 'bg-[#149775]' : 'bg-[#BA8F30]'
                        }`}
                      >
                        {act.statusBadge}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};