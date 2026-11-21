import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  X,
  Eye,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { MOCK_FACULTIES } from '../data/mockData';
import { Room } from '../types';
import { DatePill } from '../components/layout/DatePill';

export const PengaduanFasilitasPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { rooms, damageReports, addDamageReport } = useBooking();

  const [level, setLevel] = useState<1 | 2>(1);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('FTI');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form State
  const [category, setCategory] = useState('Proyektor / Display');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [rawImageFiles, setRawImageFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Constants aturan bukti foto: PNG/JPG, maks 5 MB, maks 5 file
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_FILES = 5;

  // Lightbox Preview Modal State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Rooms in selected faculty
  const facultyRooms = rooms.filter((r) => r.building === selectedFaculty);

  // Filter my damage reports
  const myReports = damageReports.filter((r) => r.reported_by === (currentUser?.id || 1));

  const handleSelectFaculty = (facId: string) => {
    setSelectedFaculty(facId);
    const roomsInFac = rooms.filter((r) => r.building === facId);
    setSelectedRoom(roomsInFac[0] || null);
    setLevel(2);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    // 1. Validasi batas maksimal 5 file
    if (photos.length + files.length > MAX_FILES) {
      setError(`Maksimal 5 file foto bukti yang dapat dilampirkan (saat ini sudah ada ${photos.length} foto).`);
      e.target.value = '';
      return;
    }

    // 2. Validasi format PNG/JPG dan ukuran maksimal 5 MB per file
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isPngOrJpg =
        file.type === 'image/png' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/jpg' ||
        ext === 'png' ||
        ext === 'jpg' ||
        ext === 'jpeg';

      if (!isPngOrJpg) {
        setError('Format bukti foto harus berupa PNG atau JPG.');
        e.target.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`Ukuran file "${file.name}" melebihi batas maksimal 5 MB.`);
        e.target.value = '';
        return;
      }
    }

    // Baca seluruh berkas yang valid
    const promises = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve(event.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        })
    );

    Promise.all(promises).then((newPhotos) => {
      setPhotos((prev) => [...prev, ...newPhotos]);
      setRawImageFiles((prev) => [...prev, ...files]);
      e.target.value = '';
    });
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setRawImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setError(null);
  };

  const handleApplySamplePhoto = (sampleUrl: string) => {
    setError(null);
    if (photos.length >= MAX_FILES) {
      setError('Maksimal 5 file foto bukti yang dapat dilampirkan.');
      return;
    }
    setPhotos((prev) => [...prev, sampleUrl]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi kelengkapan form laporan kendala
    if (!selectedRoom || !description.trim() || description.trim().length < 5) {
      setError('Isi semua laporan kendala terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await addDamageReport({
      roomId: selectedRoom.id,
      description: `[Kategori: ${category}] ${description.trim()}`,
      photos,
      rawFiles: rawImageFiles,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message || 'Laporan gagal diproses oleh sistem');
    } else {
      setSuccess('Pengaduan berhasil dikirim! Admin akan segera menindaklanjuti.');
      setDescription('');
      setPhotos([]);
      setRawImageFiles([]);
      setTimeout(() => {
        setSuccess(null);
        setLevel(1);
      }, 1500);
    }
  };

  return (
    <div className="bg-[#F5F8FF] min-h-screen w-full select-none">
      <div className="pt-5 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-12 pb-16 w-full">
        {/* Header Row: Judul di kiri, Tanggal Real-time di kanan */}
        <div className="flex flex-row items-center justify-between w-full mb-6 gap-3 min-h-[44px]">
          <h1 className="font-['Poppins'] font-bold text-[24px] sm:text-[32px] text-[#093697] leading-tight pb-0.5 flex-1 min-w-0">
            Pengaduan Fasilitas
          </h1>

          {/* Date Pill Real-time */}
          <DatePill />
        </div>

        <div className="space-y-6">
          {/* ================= LEVEL 1: PILIH FAKULTAS (Figma Frame 48:178 / 69:952) ================= */}
          {level === 1 && (
            <div className="space-y-6">
              <h3 className="font-['Poppins'] text-[16px] font-bold text-[#0B0C0F]">
                Pilih Fakultas Lokasi Fasilitas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8">
                {MOCK_FACULTIES.map((fac) => (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => handleSelectFaculty(fac.id)}
                    className="bg-[#093697] hover:bg-[#072a78] text-white h-[140px] sm:h-[150px] lg:h-[160px] rounded-[18px] lg:rounded-[22px] flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
                  >
                    <span className="font-['Poppins'] text-[32px] sm:text-[36px] font-bold leading-none">
                      {fac.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Riwayat Pengaduan Saya dengan Tampilan Foto */}
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs mt-8 font-['Poppins']">
                <h4 className="text-[16px] font-bold text-[#0B0C0F] mb-4">
                  Riwayat Pengaduan Fasilitas Saya
                </h4>
                {myReports.length === 0 ? (
                  <div className="text-center py-8 text-[#727272] text-[13px]">
                    Belum ada laporan pengaduan fasilitas yang Anda kirimkan.
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {myReports.map((report) => (
                      <div key={report.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail Foto Bukti Jika Ada */}
                          {report.photos && report.photos.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setLightboxImage(report.photos[0])}
                              className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group hover:ring-2 hover:ring-[#093697] transition cursor-pointer"
                              title="Klik untuk memperbesar foto bukti"
                            >
                              <img
                                src={report.photos[0]}
                                alt="Foto Bukti"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                              {report.photos.length > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs">
                                  +{report.photos.length - 1}
                                </span>
                              )}
                            </button>
                          ) : (
                            <div className="shrink-0 w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                              <ImageIcon className="w-5 h-5" />
                              <span className="text-[9px] mt-0.5">No Foto</span>
                            </div>
                          )}

                          <div>
                            <div className="font-semibold text-[#093697] text-[14px]">
                              {report.room?.name || `Ruang #${report.room_id}`}
                            </div>
                            <p className="text-[13px] text-[#0B0C0F] mt-0.5 line-clamp-2 max-w-xl">
                              {report.description}
                            </p>
                            <span className="text-[11px] text-[#727272] block mt-1">
                              {new Date(report.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                            report.status === 'dilaporkan'
                              ? 'bg-rose-100 text-rose-800'
                              : report.status === 'ditangani'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {report.status === 'dilaporkan'
                            ? 'Diterima Admin'
                            : report.status === 'ditangani'
                            ? 'Sedang Diperbaiki'
                            : 'Selesai'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= LEVEL 2: FORM PENGADUAN ================= */}
          {level === 2 && (
            <div className="space-y-4 w-full max-w-4xl font-['Poppins']">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-[15px] text-[#0B0C0F]">
                <button
                  onClick={() => setLevel(1)}
                  className="font-normal text-[#727272] hover:text-[#093697] transition"
                >
                  &larr; Pengaduan Fasilitas
                </button>
                <span className="text-[#727272]">&gt;</span>
                <span className="font-semibold text-[#093697]">{selectedFaculty}</span>
              </div>

              {/* Alert Gagal Terkirim Persis Figma Frame Frame 48:178 */}
              {error && (
                <div className="bg-[#FFF1F2] border border-[#CA0004] rounded-[6px] p-4 flex items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full border-[1.5px] border-[#CA0004] flex items-center justify-center shrink-0 text-[#CA0004]">
                      <span className="font-['Poppins'] font-bold text-[19px] leading-none mb-0.5">!</span>
                    </div>
                    <div>
                      <h5 className="font-['Poppins'] font-bold text-[14px] text-[#A81919] leading-tight">
                        Laporan Gagal Terkirim!
                      </h5>
                      <p className="font-['Poppins'] font-normal text-[12.5px] text-[#A81919] mt-0.5 leading-snug">
                        {error}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-[#CA0004] hover:opacity-75 transition p-1 shrink-0 cursor-pointer"
                    title="Tutup pesan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Alert Berhasil */}
              {success && (
                <div className="bg-[#F0FDF4] border border-[#16A34A] rounded-[6px] p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-9 h-9 rounded-full border-[1.5px] border-[#16A34A] flex items-center justify-center shrink-0 text-[#16A34A]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-['Poppins'] font-bold text-[14px] text-[#166534] leading-tight">
                      Laporan Berhasil Terkirim!
                    </h5>
                    <p className="font-['Poppins'] font-normal text-[12.5px] text-[#166534] mt-0.5 leading-snug">
                      {success}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#BABABA] rounded-[16px] p-7 shadow-xs">
                <h3 className="font-semibold text-[18px] text-[#0B0C0F] mb-5">
                  Formulir Pengaduan Kerusakan Fasilitas
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#0B0C0F] mb-1.5">
                      Pilih Ruangan di Gedung {selectedFaculty} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedRoom?.id || ''}
                      onChange={(e) => {
                        const found = facultyRooms.find((r) => r.id === Number(e.target.value));
                        setSelectedRoom(found || null);
                      }}
                      className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] outline-none bg-white"
                    >
                      {facultyRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.floor || 'Lt. 3'} - {r.type_name || 'Ruang Kelas'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#0B0C0F] mb-1.5">
                      Kategori Kendala
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] outline-none bg-white"
                    >
                      <option value="Proyektor / Display">Proyektor / Display HDMI</option>
                      <option value="Pendingin Ruangan (AC)">Pendingin Ruangan (AC)</option>
                      <option value="Kelistrikan & Saklar">Kelistrikan, Stopkontak & Lampu</option>
                      <option value="Kursi & Meja">Kursi, Meja & Papan Tulis</option>
                      <option value="Audio & Mic">Sound System & Microphone</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#0B0C0F] mb-1.5">
                      Deskripsi Masalah / Kerusakan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Jelaskan secara spesifik kerusakan fasilitas yang ditemui (misal: AC baris belakang bocor menetes ke meja server, kabel HDMI display proyektor putus)..."
                      className="w-full border border-[#BABABA] rounded-[8px] px-3.5 py-2.5 text-[14px] outline-none"
                    />
                  </div>

                  {/* Input Foto Bukti Kerusakan (File Upload + Multi-photo + Preset Demo) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[13px] font-medium text-[#0B0C0F]">
                        Lampiran Foto Bukti Kerusakan (Opsional)
                      </label>
                      <span className="font-['Poppins'] text-[12px] font-medium text-[#727272]">
                        {photos.length} / {MAX_FILES} foto terlampir
                      </span>
                    </div>

                    {/* Preview Gallery Jika Sudah Ada Foto yang Diunggah */}
                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                        {photos.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-[#BABABA] bg-slate-50 aspect-square shadow-xs"
                          >
                            <img
                              src={url}
                              alt={`Bukti ${idx + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                              onClick={() => setLightboxImage(url)}
                              title="Klik untuk memperbesar foto"
                            />
                            {/* Tombol Hapus Foto */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(idx);
                              }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition shadow-sm cursor-pointer z-10"
                              title="Hapus foto ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Area Upload Berkas Gambar (Hanya aktif jika belum mencapai 5 foto) */}
                    {photos.length < MAX_FILES ? (
                      <div className="border border-dashed border-[#BABABA] rounded-[12px] p-5 text-center bg-white hover:bg-slate-50/50 transition">
                        <input
                          id="file-photo-upload"
                          type="file"
                          accept=".png, .jpg, .jpeg, image/png, image/jpeg"
                          multiple
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="file-photo-upload"
                          className="cursor-pointer flex flex-col items-center justify-center gap-2"
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#093697] flex items-center justify-center">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[13px] font-semibold text-[#093697] hover:underline">
                              Klik untuk pilih foto dari perangkat (bisa pilih beberapa sekaligus)
                            </span>
                            <p className="text-[11px] text-[#727272] mt-0.5">
                              Format wajib: <strong>PNG atau JPG</strong> (Maksimal <strong>5 MB</strong> per foto, maksimal <strong>5 file</strong>)
                            </p>
                          </div>
                        </label>

                        {/* Preset Contoh Foto Cepat untuk Demo Presentasi */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <span className="text-[11px] text-[#727272] block mb-2">
                            Atau gunakan contoh foto bukti kerusakan instan:
                          </span>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleApplySamplePhoto(
                                  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80'
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 hover:bg-blue-100 text-[#093697] transition border border-slate-200"
                            >
                              📷 Proyektor Rusak
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplySamplePhoto(
                                  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 hover:bg-blue-100 text-[#093697] transition border border-slate-200"
                            >
                              📷 AC Bocor
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplySamplePhoto(
                                  'https://images.unsplash.com/photo-1580481077195-c22ae2890656?w=600&auto=format&fit=crop&q=80'
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 hover:bg-blue-100 text-[#093697] transition border border-slate-200"
                            >
                              📷 Kursi Patah
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-[10px] text-center text-[12px] text-[#727272]">
                        ✓ Batas maksimal 5 foto bukti telah tercapai. Hapus salah satu foto di atas jika ingin mengganti.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setLevel(1)}
                      className="px-5 py-2 border border-[#BABABA] rounded-[8px] text-[13px] font-medium text-[#0B0C0F] hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-[#093697] hover:bg-blue-800 text-white rounded-[8px] text-[13px] font-medium transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 active:scale-98"
                    >
                      <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pengaduan →'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal untuk Preview Foto Bukti Layar Penuh */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-['Poppins'] font-semibold text-[16px] text-[#0B0C0F] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#093697]" />
                <span>Foto Bukti Kerusakan Fasilitas</span>
              </h4>
              <button
                onClick={() => setLightboxImage(null)}
                className="text-slate-400 hover:text-slate-600 transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 rounded-xl overflow-hidden max-h-[460px] bg-slate-100 flex items-center justify-center border border-slate-200">
              <img
                src={lightboxImage}
                alt="Foto Bukti Kerusakan"
                className="w-full h-full object-contain max-h-[440px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
