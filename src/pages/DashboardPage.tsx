import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import card1HeroImg from '../assets/card1_hero.png';
import card2MedalSvg from '../assets/card2_medal.svg';
import { DatePill } from '../components/layout/DatePill';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { getBookingTimeState } from '../lib/bookingStatus';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { rooms, bookings, refreshBookings, cancelBooking } = useBooking();

  // Sinkronisasi status booking terbaru dari backend saat Dashboard dibuka
  useEffect(() => {
    refreshBookings();
  }, []);

  // Filter peminjaman yang sedang aktif untuk mahasiswa ini
  // Sesuai kombinasi Pilihan 1 & 3:
  // - Peminjaman dengan status 'diajukan' atau 'menunggu_bayar'
  // - Peminjaman yang 'disetujui' / 'terkonfirmasi' yang belum lewat jamnya (upcoming atau in_progress)
  // Peminjaman yang sudah selesai ('completed') otomatis dipindahkan ke Riwayat Peminjaman di Profil.
  const activeBookings = bookings.filter((b) => {
    const isMine =
      !currentUser ||
      b.user_id === currentUser.id ||
      b.user?.id === currentUser.id ||
      String(b.user?.nim) === String(currentUser.nim) ||
      String(b.user?.number_id) === String(currentUser.number_id) ||
      !b.user_id;

    if (!isMine) return false;

    if (b.status === 'diajukan' || b.status === 'menunggu_bayar') {
      return true;
    }

    if (b.status === 'disetujui' || b.status === 'terkonfirmasi') {
      const timeState = getBookingTimeState(b);
      return timeState !== 'completed';
    }

    return false;
  });

  const handleCancel = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan permohonan peminjaman ini?')) {
      await cancelBooking(id);
      await refreshBookings();
    }
  };

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      {/* Full Screen Responsive Content Wrapper dengan pt-[88px] konsisten Figma */}
      <div className="pt-[88px] px-8 lg:px-12 pb-16 w-full">
        {/* Header Row: Full width with Title (left) & Date Pill (right) */}
        <div className="flex items-center justify-between w-full mb-8">
          <h1 className="font-['Poppins'] font-bold text-[32px] text-[#093697] leading-none">
            Dashboard
          </h1>

          {/* Date Pill Real-time */}
          <DatePill />
        </div>

        {/* Row 2 Kartu Utama: Responsive Grid stretching 100% full width */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full mb-8">
          {/* Card 1: Halo Thahir */}
          <div
            className="w-full h-[194px] rounded-[16px] relative overflow-hidden shadow-sm"
            style={{
              backgroundImage:
                'linear-gradient(87.09deg, rgb(1, 33, 101) 1.16%, rgb(9, 54, 151) 50.34%, rgb(36, 92, 132) 99.52%)',
            }}
          >
            {/* Teks Sisi Kiri */}
            <div className="absolute left-8 top-10 w-[240px] flex flex-col items-start text-white z-10">
              <h2 className="font-['Poppins'] font-semibold text-[32px] leading-tight">
                Halo,{' '}
                <span className="text-[#ECCA2E]">
                  {currentUser?.name?.split(' ')[0] || 'Thahir'}
                </span>
              </h2>
              <p className="font-['Poppins'] font-normal text-[15px] text-white/95 leading-snug mt-1.5">
                Cek ruangan yang tersedia, ajukan peminjaman
              </p>
            </div>

            {/* Ilustrasi Isometrik Sisi Kanan */}
            <div className="absolute right-2 top-2 h-[180px] w-[260px] pointer-events-none">
              <img
                src={card1HeroImg}
                alt="Ruang UII"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Card 2: Skor Kepatuhan Peminjaman */}
          <div className="w-full h-[194px] rounded-[16px] bg-[#C1EBE9] relative overflow-hidden flex items-center justify-between px-8 shadow-sm">
            {/* Medali Sisi Kiri */}
            <div className="relative shrink-0 w-[180px] h-[180px] flex items-center justify-center">
              <img
                src={card2MedalSvg}
                alt="Medali Kepatuhan"
                className="w-[150px] h-[150px] block"
              />
            </div>

            {/* Teks & Skor Sisi Kanan */}
            <div className="w-[260px] flex flex-col items-start shrink-0">
              <span className="font-['Poppins'] font-semibold text-[16px] text-[#093697]">
                Skor Kepatuhan Peminjaman
              </span>
              <span className="font-['Poppins'] font-semibold text-[64px] text-[#093697] leading-none my-1">
                {currentUser?.credit_score ?? 100}%
              </span>
              <div className="bg-[#F2F7A0] rounded-[16px] py-[6px] w-full text-center shadow-xs">
                <span className="font-['Poppins'] font-semibold text-[15px] text-[#093697]">
                  {(currentUser?.credit_score ?? 100) >= 80 ? 'Sangat Baik!!' : 'Perlu Ditingkatkan'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Peminjaman Aktif */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-['Poppins'] font-normal text-[20px] text-[#0B0C0F]">
              Peminjaman Aktif
            </h3>
            {activeBookings.length > 0 && (
              <span className="font-['Poppins'] text-[12px] bg-blue-50 text-[#093697] font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                {activeBookings.length} Peminjaman Berjalan
              </span>
            )}
          </div>

          {activeBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {activeBookings.map((item) => {
                // Cari nama ruangan yang lengkap (prioritaskan item.room yang sudah dinormalisasi)
                const roomObj =
                  item.room ||
                  rooms.find((r) => r.id === item.room_id || r.id === item.room?.id);
                const roomName = roomObj
                  ? roomObj.name.startsWith(roomObj.building)
                    ? roomObj.name
                    : `${roomObj.building ? roomObj.building + ' - ' : ''}${roomObj.name}`
                  : 'Ruang Kelas';

                // Format Tanggal
                const dateText = item.start_at
                  ? new Intl.DateTimeFormat('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(item.start_at))
                  : item.date
                  ? new Intl.DateTimeFormat('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(item.date))
                  : '28 November 2026';

                // Format Jam
                const timeText =
                  item.daily_start_hour && item.daily_end_hour
                    ? `${String(item.daily_start_hour).padStart(2, '0')}:00 - ${String(
                        item.daily_end_hour
                      ).padStart(2, '0')}:00 WIB`
                    : item.start_at && item.end_at
                    ? `${new Date(item.start_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} - ${new Date(item.end_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} WIB`
                    : '13:00 - 15:00 WIB';

                const isApproved = item.status === 'disetujui' || item.status === 'terkonfirmasi';
                const isPending = item.status === 'diajukan';
                const isPay = item.status === 'menunggu_bayar';
                const timeState = getBookingTimeState(item);
                const isOngoing = isApproved && timeState === 'in_progress';

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#BABABA] rounded-[14px] p-5 shadow-xs flex flex-col justify-between hover:border-[#093697] transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="min-w-0 pr-2">
                          <span className="text-[11px] font-semibold text-[#093697] uppercase tracking-wider block mb-0.5">
                            {roomObj?.type_name || 'Fasilitas Kampus'}
                          </span>
                          <h4 className="font-['Poppins'] font-bold text-[17px] text-[#0B0C0F] leading-snug truncate">
                            {roomName}
                          </h4>
                        </div>

                        {/* Status Badge */}
                        {isApproved && isOngoing && (
                          <span className="shrink-0 bg-[#E0EDFF] text-[#093697] border border-[#BFDBFE] px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-[#093697] animate-pulse"></span>
                            Sedang Digunakan
                          </span>
                        )}
                        {isApproved && !isOngoing && (
                          <span className="shrink-0 bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                            Disetujui
                          </span>
                        )}
                        {isPending && (
                          <span className="shrink-0 bg-[#FEF08A] text-[#854D0E] border border-[#FDE047] px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-[#EAB308]"></span>
                            Menunggu Persetujuan
                          </span>
                        )}
                        {isPay && (
                          <span className="shrink-0 bg-[#FEF08A] text-[#854D0E] border border-[#FDE047] px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-[#EAB308]"></span>
                            Menunggu Pembayaran
                          </span>
                        )}
                      </div>

                      <p className="font-['Poppins'] text-[13px] text-[#475569] mb-3 line-clamp-2">
                        {item.purpose || 'Kegiatan Mahasiswa'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[12px] font-['Poppins'] text-[#64748B]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#093697]" />
                        <span>{dateText}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-[#0B0C0F]">
                        <Clock className="w-3.5 h-3.5 text-[#093697]" />
                        <span>{timeText}</span>
                      </div>
                      {isPending && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="text-rose-600 hover:text-rose-800 text-[11.5px] font-medium hover:underline ml-auto cursor-pointer"
                        >
                          Batalkan
                        </button>
                      )}
                      {isApproved && isOngoing && (
                        <span className="text-[#093697] text-[11.5px] font-medium ml-auto flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#093697] animate-pulse"></span> Sedang Digunakan
                        </span>
                      )}
                      {isApproved && !isOngoing && (
                        <span className="text-[#166534] text-[11.5px] font-medium ml-auto flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Siap Dipakai
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full min-h-[180px] bg-white border border-[#BABABA] rounded-[14px] flex flex-col items-center justify-center p-8 text-center shadow-xs">
              <span className="font-['Poppins'] font-normal text-[24px] text-[#727272]">
                Kosong
              </span>
              <p className="font-['Poppins'] text-[13px] text-[#64748B] mt-1.5 max-w-[420px]">
                Belum ada permohonan peminjaman ruangan yang aktif. Peminjaman yang telah selesai otomatis dipindahkan ke{' '}
                <Link
                  to="/profil"
                  className="text-[#093697] font-semibold underline underline-offset-2 hover:text-[#0b48c6]"
                >
                  Riwayat Peminjaman (Profil)
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
