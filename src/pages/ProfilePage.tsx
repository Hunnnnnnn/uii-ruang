import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { DatePill } from '../components/layout/DatePill';
import iconAvatar from '../assets/icon_avatar.svg';
import { getBookingTimeState } from '../lib/bookingStatus';

// ============================================================================
// KONFIGURASI NOMOR WHATSAPP ADMIN:
// Ganti nomor HP di bawah ini (format internasional diawali 62, tanpa tanda + atau 0)
// Contoh: '6281234567890' atau nomor Anda sendiri
// ============================================================================
export const ADMIN_WHATSAPP_NUMBER = '6285669871634';
export const ADMIN_WHATSAPP_MESSAGE =
  'Halo Admin UIIRuang, saya ingin bertanya seputar peminjaman ruangan';

export const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { bookings, rooms } = useBooking();

  // Ambil booking milik user saat ini (termasuk dummy appointment yang diminta untuk akun tes)
  const userBookings = bookings.filter((b) => {
    if (!currentUser) return true;
    return (
      b.user_id === currentUser.id ||
      b.user?.id === currentUser.id ||
      String(b.user?.nim) === String(currentUser.nim) ||
      String(b.user?.number_id) === String(currentUser.number_id)
    );
  });

  // Susun data riwayat peminjaman murni dari permohonan riil pengguna (tanpa dummy tambahan)
  // Status dihitung dinamis sesuai kombinasi Pilihan 1 & 3 (Menunggu, Disetujui, Sedang Berlangsung, Selesai, Ditolak)
  const displayHistory = userBookings.map((b) => {
    const r = b.room || rooms.find((room) => room.id === b.room_id);
    const faculty = r?.building || 'FTI';
    const roomName = r?.name || 'Ruang';

    // Format tanggal DD/MM/YY
    let dateStr = '21/11/26';
    if (b.date) {
      if (b.date.includes('-')) {
        const [y, m, d] = b.date.split('-');
        dateStr = `${d}/${m}/${y.slice(-2)}`;
      } else {
        dateStr = b.date;
      }
    } else if (b.start_at) {
      const d = new Date(b.start_at);
      dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
        d.getFullYear()
      ).slice(-2)}`;
    }

    // Format jam
    const sH = b.daily_start_hour || (b.start_at ? new Date(b.start_at).getHours() : 8);
    const eH = b.daily_end_hour || (b.end_at ? new Date(b.end_at).getHours() : 10);
    const timeStr = `${String(sH).padStart(2, '0')}:00 - ${String(eH).padStart(2, '0')}:00`;

    // Status dinamis
    const timeState = getBookingTimeState(b);

    let displayStatus: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected' = 'pending';
    if (b.status === 'diajukan' || b.status === 'menunggu_bayar') {
      displayStatus = 'pending';
    } else if (b.status === 'ditolak' || b.status === 'dibatalkan') {
      displayStatus = 'rejected';
    } else if (b.status === 'disetujui' || b.status === 'terkonfirmasi') {
      if (timeState === 'completed') {
        displayStatus = 'completed';
      } else if (timeState === 'in_progress') {
        displayStatus = 'in_progress';
      } else {
        displayStatus = 'approved';
      }
    }

    // Hapus tag [ROOM:...] dari keterangan acara jika ada
    let cleanEvent = b.purpose || 'Kegiatan Mahasiswa';
    if (cleanEvent.includes('[ROOM:')) {
      cleanEvent = cleanEvent.replace(/\[ROOM:[^\]]+\]\s*/, '');
    }

    return {
      id: b.id,
      faculty,
      roomName,
      date: dateStr,
      time: timeStr,
      event: cleanEvent,
      status: displayStatus,
    };
  });

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      {/* Container utama responsif */}
      <div className="pt-6 sm:pt-8 lg:pt-[88px] px-4 sm:px-6 lg:px-12 pb-16 w-full">
        {/* Header Row: Judul di kiri, Tanggal di kanan */}
        <div className="flex flex-row items-center justify-between w-full gap-2 mb-6 sm:mb-8">
          <h1 className="font-['Poppins'] font-bold text-[24px] sm:text-[32px] text-[#093697] leading-none truncate">
            Profil
          </h1>

          {/* Date Pill Real-time */}
          <DatePill />
        </div>

        {/* 2 Kolom Layout Sesuai Figma: Kiri Profil (~380px), Kanan Riwayat Peminjaman Lebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full">
          {/* ================= SISI KIRI (Informasi Akun + Hubungi Admin) ================= */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6">
            {/* Card 1: Informasi Akun */}
            <div className="w-full bg-white border border-[#BABABA] rounded-[16px] p-5 sm:p-7 shadow-xs">
              {/* Profile Avatar */}
              <div className="mb-3">
                <img
                  src={iconAvatar}
                  alt="Profile Avatar"
                  className="w-[58px] h-[58px] object-contain"
                />
              </div>

              {/* Subtitle */}
              <span className="font-['Poppins'] text-[15px] font-normal text-[#727272] block mb-4">
                Informasi Akun
              </span>

              {/* Field 1: Nama Lengkap */}
              <div className="mb-3.5">
                <label className="block font-['Poppins'] text-[14px] font-semibold text-[#0B0C0F] mb-1.5">
                  Nama Lengkap
                </label>
                <div className="w-full h-[44px] px-4 rounded-[8px] border border-[#BABABA] bg-[#F3F3F3] flex items-center font-['Poppins'] text-[14px] text-[#0B0C0F] font-medium">
                  {currentUser?.name || 'Thahir Al Faruq'}
                </div>
              </div>

              {/* Field 2 & 3: Email UII & NIM (2 Kolom Berdampingan) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Email UII */}
                <div>
                  <label className="block font-['Poppins'] text-[14px] font-semibold text-[#0B0C0F] mb-1.5">
                    Email UII
                  </label>
                  <div
                    className="w-full h-[44px] px-3.5 rounded-[8px] border border-[#BABABA] bg-[#F3F3F3] flex items-center font-['Poppins'] text-[12px] sm:text-[13px] text-[#0B0C0F] font-medium truncate"
                    title={currentUser?.email || '24523014@students.uii.ac.id'}
                  >
                    {currentUser?.email || '24523014@students.uii.ac.id'}
                  </div>
                </div>

                {/* NIM */}
                <div>
                  <label className="block font-['Poppins'] text-[14px] font-semibold text-[#0B0C0F] mb-1.5">
                    NIM
                  </label>
                  <div className="w-full h-[44px] px-3.5 rounded-[8px] border border-[#BABABA] bg-[#F3F3F3] flex items-center font-['Poppins'] text-[13px] text-[#0B0C0F] font-medium">
                    {currentUser?.nim || '24523014'}
                  </div>
                </div>
              </div>

              {/* Box Kredit Score Anda Saat Ini */}
              <div className="mt-5 w-full bg-[#F3F3F3] border border-[#BABABA] rounded-[10px] p-4 flex items-center justify-between">
                <div>
                  <span className="font-['Poppins'] text-[12px] text-[#0B0C0F] block mb-1">
                    Kredit Score Anda Saat Ini:
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-['Poppins'] font-bold text-[38px] text-[#0B0C0F] leading-none">
                      {currentUser?.credit_score ?? 100}
                    </span>
                    <span className="font-['Poppins'] font-medium text-[20px] text-[#0B0C0F]">
                      /100
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-12 h-12 text-[#0B0C0F] stroke-[1.8]" />
                </div>
              </div>
            </div>

            {/* Section Hubungi Admin di Bawah Card Informasi Akun */}
            <div className="w-full">
              <h2 className="font-['Poppins'] font-semibold text-[18px] text-[#0B0C0F] mb-2.5">
                Hubungi Admin
              </h2>
              <a
                href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  ADMIN_WHATSAPP_MESSAGE
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-[46px] bg-[#36B72F] hover:bg-[#2ea028] text-white rounded-[8px] font-['Poppins'] font-semibold text-[15px] flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer active:scale-[0.99]"
              >
                {/* Official WhatsApp SVG Icon */}
                <svg
                  className="w-5 h-5 fill-white shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
                </svg>
                <span>Via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* ================= SISI KANAN (Riwayat Peminjaman) ================= */}
          <div className="lg:col-span-8 xl:col-span-8">
            <div className="w-full bg-white border border-[#BABABA] rounded-[16px] p-6 sm:p-7 shadow-xs">
              {/* Heading */}
              <h2 className="font-['Poppins'] font-bold text-[20px] text-[#0B0C0F] mb-5">
                Riwayat Peminjaman
              </h2>

              {/* Table Container dengan overflow-x-auto responsif */}
              <div className="w-full overflow-x-auto rounded-[8px]">
                <table className="w-full min-w-[560px] text-left font-['Poppins'] border-collapse">
                  <thead className="bg-[#093697] text-white text-[13.5px] font-semibold">
                    <tr>
                      <th className="py-3 px-4 rounded-tl-[8px]">Ruangan</th>
                      <th className="py-3 px-4">Tanggal & Jam</th>
                      <th className="py-3 px-4">Acara</th>
                      <th className="py-3 px-4 text-right rounded-tr-[8px]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                    {displayHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-12 text-center text-[#858585] font-['Poppins'] text-[14px]"
                        >
                          Belum ada riwayat peminjaman ruangan.
                        </td>
                      </tr>
                    ) : (
                      displayHistory.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/40 transition-colors h-[64px]"
                        >
                          {/* Kolom Ruangan (2 Baris) */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#0B0C0F] block leading-tight">
                              {item.faculty}
                            </span>
                            <span className="text-[#0B0C0F] text-[12.5px] block leading-tight mt-0.5">
                              {item.roomName}
                            </span>
                          </td>

                          {/* Kolom Tanggal & Jam (2 Baris) */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-[#0B0C0F] block leading-tight">
                              {item.date}
                            </span>
                            <span className="text-[#0B0C0F] text-[12.5px] block leading-tight mt-0.5">
                              {item.time}
                            </span>
                          </td>

                          {/* Kolom Acara */}
                          <td className="py-3 px-4 text-[#0B0C0F] font-medium max-w-[200px] truncate" title={item.event}>
                            {item.event}
                          </td>

                          {/* Kolom Status Badge Persis Figma + State Dinamis */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {item.status === 'pending' && (
                              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FFE395] text-[#8F6700] whitespace-nowrap shadow-2xs">
                                Menunggu Persetujuan
                              </span>
                            )}
                            {item.status === 'approved' && (
                              <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#95FFC8] text-[#086835] whitespace-nowrap shadow-2xs">
                                Disetujui
                              </span>
                            )}
                            {item.status === 'in_progress' && (
                              <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] whitespace-nowrap shadow-2xs">
                                Sedang Berlangsung
                              </span>
                            )}
                            {item.status === 'completed' && (
                              <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] whitespace-nowrap shadow-2xs">
                                Selesai
                              </span>
                            )}
                            {item.status === 'rejected' && (
                              <span className="inline-block px-4 py-1 rounded-full text-[11px] font-semibold bg-[#FF9E9E] text-[#8A1515] whitespace-nowrap shadow-2xs">
                                Ditolak
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Garis bawah penutup persis desain */}
              <div className="w-full border-t border-[#E2E8F0] mt-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
