import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import card1HeroImg from '../assets/card1_hero.png';
import card2MedalSvg from '../assets/card2_medal.svg';
import { DatePill } from '../components/layout/DatePill';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { getBookingTimeState, getConfirmWindowState } from '../lib/bookingStatus';
import { Booking } from '../types';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { rooms, bookings, refreshBookings, cancelBooking, confirmBooking } = useBooking();

  const [confirmFeedback, setConfirmFeedback] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isConfirmingId, setIsConfirmingId] = useState<number | null>(null);

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

  const handleConfirmSelfCheckin = async (id: number, bookingItem?: Booking) => {
    try {
      if (bookingItem) {
        const windowInfo = getConfirmWindowState(bookingItem);
        if (windowInfo.state === 'not_opened') {
          setConfirmFeedback({
            text: `Jendela konfirmasi belum dibuka. Self check-in baru dapat dilakukan pada H-3 (mulai ${windowInfo.formattedOpenDate} WIB).`,
            type: 'error',
          });
          return;
        }
        if (windowInfo.state === 'closed') {
          setConfirmFeedback({
            text: 'Batas waktu konfirmasi H-3 telah lewat (melewati batas H-2).',
            type: 'error',
          });
          return;
        }
      }

      setIsConfirmingId(id);
      const res = await confirmBooking(id);
      if (res.success) {
        setConfirmFeedback({
          text: res.message || 'Peminjaman berhasil dikonfirmasi (Self Check-in berhasil)!',
          type: 'success',
        });
        await refreshBookings();
      } else {
        setConfirmFeedback({
          text: res.message || 'Gagal konfirmasi kehadiran. Pastikan waktu berada dalam jendela H-3.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setConfirmFeedback({
        text: err?.response?.data?.message || 'Gagal melakukan konfirmasi self check-in.',
        type: 'error',
      });
    } finally {
      setIsConfirmingId(null);
      setTimeout(() => setConfirmFeedback(null), 4500);
    }
  };

  const handleCancel = async (id: number, isApprovedBooking = false, bookingItem?: Booking) => {
    let confirmMsg = 'Apakah Anda yakin ingin membatalkan permohonan peminjaman ini?';
    if (isApprovedBooking && bookingItem) {
      // Hitung sisa jam sebelum acara dimulai (Aturan Tech Spec: Penalti skor -10 jika <= 72 jam)
      const startDate = bookingItem.date || (bookingItem.start_at ? bookingItem.start_at.slice(0, 10) : '');
      const sH = bookingItem.daily_start_hour || (bookingItem.start_at ? new Date(bookingItem.start_at).getHours() : 7);
      const startDateTime = new Date(`${startDate}T${String(sH).padStart(2, '0')}:00:00+07:00`);
      const now = new Date();
      const diffHours = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 72) {
        confirmMsg =
          'PERINGATAN ATURAN PEMBATALAN (Tech Spec):\nSisa waktu menuju jadwal acara kurang dari 72 jam (H-3).\nPembatalan ini akan dikenakan penalti pemotongan kredit skor -10 poin.\n\nApakah Anda tetap ingin membatalkan peminjaman?';
      } else {
        confirmMsg =
          'Apakah Anda yakin ingin membatalkan peminjaman ini?\n(Pembatalan dilakukan lebih dari 72 jam sebelum acara, tanpa penalti skor).';
      }
    }

    if (window.confirm(confirmMsg)) {
      await cancelBooking(id);
      await refreshBookings();
    }
  };

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      {/* Toast Alert Feedback */}
      {confirmFeedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border transition-all animate-in fade-in slide-in-from-top-4 ${
            confirmFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {confirmFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-['Poppins'] text-[13.5px] font-medium">{confirmFeedback.text}</span>
          <button
            onClick={() => setConfirmFeedback(null)}
            className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full Screen Responsive Content Wrapper */}
      <div className="pt-5 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-12 pb-16 w-full">
        {/* Header Row: Full width with Title (left) & Date Pill (right) */}
        <div className="flex flex-row items-center justify-between w-full mb-6 sm:mb-7 gap-3 min-h-[44px]">
          <h1 className="font-['Poppins'] font-bold text-[24px] sm:text-[32px] text-[#093697] leading-tight pb-0.5 flex-1 min-w-0">
            Dashboard
          </h1>

          {/* Date Pill Real-time */}
          <DatePill />
        </div>

        {/* Row 2 Kartu Utama: Responsive Grid stretching 100% full width */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 w-full mb-8">
          {/* Card 1: Halo Thahir */}
          <div
            className="w-full min-h-[170px] sm:h-[194px] rounded-[16px] relative overflow-hidden shadow-sm flex items-center"
            style={{
              backgroundImage:
                'linear-gradient(87.09deg, rgb(1, 33, 101) 1.16%, rgb(9, 54, 151) 50.34%, rgb(36, 92, 132) 99.52%)',
            }}
          >
            {/* Teks Sisi Kiri (Responsif, tidak tertutup ilustrasi) */}
            <div className="relative z-10 pl-5 sm:pl-8 py-5 pr-2 max-w-[210px] sm:max-w-[260px] flex flex-col items-start text-white">
              <h2 className="font-['Poppins'] font-semibold text-[24px] sm:text-[32px] leading-tight">
                Halo,{' '}
                <span className="text-[#ECCA2E]">
                  {currentUser?.name?.split(' ')[0] || 'Thahir'}
                </span>
              </h2>
              <p className="font-['Poppins'] font-normal text-[13px] sm:text-[15px] text-white/95 leading-snug mt-1.5">
                Cek ruangan yang tersedia, ajukan peminjaman
              </p>
            </div>

            {/* Ilustrasi Isometrik Sisi Kanan (Adaptif di mobile) */}
            <div className="absolute -right-3 sm:right-2 top-1/2 -translate-y-1/2 h-[150px] sm:h-[180px] w-[180px] sm:w-[260px] pointer-events-none opacity-35 sm:opacity-100 transition-opacity">
              <img
                src={card1HeroImg}
                alt="Ruang UII"
                className="w-full h-full object-contain sm:object-cover object-right"
              />
            </div>
          </div>

          {/* Card 2: Skor Kepatuhan Peminjaman */}
          <div className="w-full min-h-[170px] sm:h-[194px] rounded-[16px] bg-[#C1EBE9] relative overflow-hidden flex items-center justify-between px-4 sm:px-8 py-4 sm:py-0 gap-3 sm:gap-6 shadow-sm">
            {/* Medali Sisi Kiri */}
            <div className="relative shrink-0 w-[95px] h-[95px] sm:w-[150px] sm:h-[150px] flex items-center justify-center">
              <img
                src={card2MedalSvg}
                alt="Medali Kepatuhan"
                className="w-full h-full object-contain block"
              />
            </div>

            {/* Teks & Skor Sisi Kanan (Flex-1 responsif tanpa overflow/cut-off) */}
            <div className="flex-1 min-w-0 flex flex-col items-start pr-1 sm:pr-0">
              <span className="font-['Poppins'] font-semibold text-[13px] sm:text-[16px] text-[#093697] truncate w-full">
                Skor Kepatuhan Peminjaman
              </span>
              <span className="font-['Poppins'] font-semibold text-[42px] sm:text-[64px] text-[#093697] leading-none my-0.5 sm:my-1">
                {currentUser?.credit_score ?? 100}%
              </span>
              <div className="bg-[#F2F7A0] rounded-[12px] sm:rounded-[16px] py-1 sm:py-[6px] px-2.5 sm:px-3 w-full max-w-[230px] text-center shadow-xs">
                <span className="font-['Poppins'] font-semibold text-[12px] sm:text-[15px] text-[#093697] truncate block">
                  {(currentUser?.credit_score ?? 100) >= 80 ? 'Sangat Baik!!' : 'Perlu Ditingkatkan'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Peminjaman Aktif */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-['Poppins'] font-normal text-[18px] sm:text-[20px] text-[#0B0C0F]">
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
                const confirmWindow = getConfirmWindowState(item);

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
                        {item.status === 'disetujui' && !isOngoing && (
                          <>
                            {confirmWindow.state === 'open' && (
                              <span className="shrink-0 bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                                Konfirmasi Buka (H-3)
                              </span>
                            )}
                            {confirmWindow.state === 'not_opened' && (
                              <span
                                className="shrink-0 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs"
                                title={`Jendela konfirmasi H-3 dibuka pada ${confirmWindow.formattedOpenDate} WIB`}
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                Disetujui (Konfirmasi Buka H-3)
                              </span>
                            )}
                            {confirmWindow.state === 'closed' && (
                              <span className="shrink-0 bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                Konfirmasi Ditutup
                              </span>
                            )}
                          </>
                        )}
                        {item.status === 'terkonfirmasi' && !isOngoing && (
                          <span className="shrink-0 bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                            Terkonfirmasi
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
                      {item.status === 'disetujui' && !isOngoing && (
                        <div className="ml-auto flex items-center gap-2">
                          {confirmWindow.state === 'open' ? (
                            <button
                              onClick={() => handleConfirmSelfCheckin(item.id, item)}
                              disabled={isConfirmingId === item.id}
                              className="bg-[#14926F] hover:bg-[#0E7A5C] text-white px-3 py-1 rounded-lg text-[11.5px] font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Konfirmasi Kehadiran / Self Check-in H-3"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{isConfirmingId === item.id ? 'Memproses...' : 'Self Check-in (H-3)'}</span>
                            </button>
                          ) : confirmWindow.state === 'not_opened' ? (
                            <div className="flex flex-col items-end">
                              <button
                                disabled
                                className="bg-slate-100 text-slate-400 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-not-allowed opacity-80"
                                title={`Self check-in belum dibuka. Baru dapat diakses pada ${confirmWindow.formattedOpenDate} WIB.`}
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Check-in (Buka H-3)</span>
                              </button>
                              <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                                Buka: {confirmWindow.formattedOpenDate}
                              </span>
                            </div>
                          ) : (
                            <span className="text-rose-600 text-[11px] font-medium">
                              Batas H-2 Lewat
                            </span>
                          )}
                          <button
                            onClick={() => handleCancel(item.id, true, item)}
                            className="text-rose-600 hover:text-rose-800 text-[11.5px] font-medium hover:underline cursor-pointer"
                            title="Batalkan Peminjaman"
                          >
                            Batalkan
                          </button>
                        </div>
                      )}
                      {item.status === 'terkonfirmasi' && !isOngoing && (
                        <div className="ml-auto flex items-center gap-3">
                          <span className="text-[#166534] text-[11.5px] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Siap Dipakai
                          </span>
                          <button
                            onClick={() => handleCancel(item.id, true, item)}
                            className="text-rose-600 hover:text-rose-800 text-[11.5px] font-medium hover:underline cursor-pointer"
                            title="Batalkan Peminjaman"
                          >
                            Batalkan
                          </button>
                        </div>
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
