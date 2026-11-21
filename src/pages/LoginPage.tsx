import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import logoInformatika from '../assets/logo_informatika_uii.png';
import logoITSolution from '../assets/logo_it_solution_enablers.png';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' (Masuk Ke UIIRuang) atau 'register' (Daftar Akun Mahasiswa)
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('mahasiswa');

  // Form Fields
  const [name, setName] = useState('Thahir Al Faruq');
  const [nim, setNim] = useState('24523014');
  const [email, setEmail] = useState('24523014@students.uii.ac.id');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Validation States
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setSuccessMsg(null);

    let hasError = false;

    // Validasi Email
    if (!email.trim()) {
      setEmailError('Email wajib diisi');
      hasError = true;
    } else if (role === 'mahasiswa' && !email.toLowerCase().endsWith('@students.uii.ac.id')) {
      setEmailError('Harus menggunakan email resmi UII @students.uii.ac.id');
      hasError = true;
    } else if (role === 'admin' && !email.toLowerCase().endsWith('@uii.ac.id')) {
      setEmailError('Email admin wajib berdomain resmi @uii.ac.id');
      hasError = true;
    }

    // Validasi Password
    if (!password.trim()) {
      setPasswordError('Sandi wajib diisi');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Kata sandi minimal 6 karakter');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);

    if (mode === 'register') {
      const res = await register({
        name: name.trim() || 'Thahir Al Faruq',
        nim: nim.trim() || '24523014',
        email: email.trim(),
        password: password,
        role: 'mahasiswa',
      });

      setIsSubmitting(false);

      if (!res.success) {
        setGeneralError(res.message || 'Pendaftaran akun gagal.');
        return;
      }

      setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
      return;
    }

    // Mode Login
    const res = await login(email.trim(), password, role);
    setIsSubmitting(false);

    if (!res.success) {
      setGeneralError(res.message || 'Email atau password salah.');
      return;
    }

    setSuccessMsg('Berhasil masuk! Mengalihkan...');
    setTimeout(() => {
      const userRole = res.user?.role || role;
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }, 500);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-white select-none font-['Poppins']">
      {/* ================= SISI KIRI: BRANDING HERO (Figma Exact 100%) ================= */}
      <div className="w-full lg:w-[50%] xl:w-[50%] bg-gradient-to-b from-[#043AB8] via-[#01287B] to-[#00113C] text-white p-8 sm:p-12 lg:px-14 lg:pt-24 lg:pb-12 xl:px-16 xl:pt-28 xl:pb-14 flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[520px] lg:min-h-screen">
        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="font-['Poppins'] text-[36px] sm:text-[40px] font-bold text-white leading-none tracking-tight">
              UII
            </span>
            <span className="font-['Poppins'] text-[36px] sm:text-[40px] font-bold text-[#ECCA2E] leading-none tracking-tight">
              Ruang
            </span>
          </div>

          <h2 className="font-['Poppins'] text-[34px] sm:text-[40px] lg:text-[44px] font-bold mt-7 sm:mt-8 text-white leading-[1.18] tracking-tight">
            Sistem Peminjaman<br />Ruang Terpadu
          </h2>
        </div>

        {/* 3 Core Value Bullet Points */}
        <div className="space-y-6 sm:space-y-7 relative z-10 my-10 lg:my-14">
          {/* Point 1: Anti Bentrok Jadwal */}
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#ECCA2E] shrink-0 mt-0.5" strokeWidth={2.2} />
            <div>
              <h3 className="font-['Poppins'] text-[17px] sm:text-[18px] font-semibold text-white leading-snug">
                Anti Bentrok Jadwal
              </h3>
              <p className="font-['Poppins'] text-[13.5px] sm:text-[14.5px] text-white/80 mt-0.5 leading-snug">
                Jadwal ruang terlihat jelas saat booking.
              </p>
            </div>
          </div>

          {/* Point 2: Credit Score Transparan */}
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#ECCA2E] shrink-0 mt-0.5" strokeWidth={2.2} />
            <div>
              <h3 className="font-['Poppins'] text-[17px] sm:text-[18px] font-semibold text-white leading-snug">
                Credit Score Transparan
              </h3>
              <p className="font-['Poppins'] text-[13.5px] sm:text-[14.5px] text-white/80 mt-0.5 leading-snug">
                Bangun reputasi dengan check in tepat waktu.
              </p>
            </div>
          </div>

          {/* Point 3: Terhubung dengan Fasilitas UII */}
          <div className="flex items-start gap-4">
            <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#ECCA2E] shrink-0 mt-0.5" strokeWidth={2.2} />
            <div>
              <h3 className="font-['Poppins'] text-[17px] sm:text-[18px] font-semibold text-white leading-snug">
                Terhubung dengan Fasilitas UII
              </h3>
              <p className="font-['Poppins'] text-[13.5px] sm:text-[14.5px] text-white/80 mt-0.5 leading-snug">
                Temukan ruang sesuai fakultas dan fasilitas.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Brand Badges (UII Informatika + We Are IT Solution Enablers) */}
        <div className="flex items-center gap-7 sm:gap-9 pt-8 relative z-10 mt-auto justify-start">
          {/* UII Informatika Logo */}
          <div className="flex items-center">
            <img
              src={logoInformatika}
              alt="Program Studi Informatika Program Sarjana UII"
              className="h-[46px] sm:h-[54px] lg:h-[60px] w-auto object-contain"
            />
          </div>

          {/* We are IT Solution Enablers Logo */}
          <div className="flex items-center">
            <img
              src={logoITSolution}
              alt="We are IT Solution Enablers"
              className="h-[42px] sm:h-[48px] lg:h-[54px] w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* ================= SISI KANAN: FORM MASUK / DAFTAR ================= */}
      <div className="w-full lg:w-[50%] xl:w-[50%] bg-white flex flex-col justify-center px-8 sm:px-14 lg:px-20 xl:px-24 py-12 lg:py-16">
        <div className="w-full max-w-[520px] mx-auto flex flex-col justify-between min-h-[560px]">
          {/* Header Form */}
          <div>
            {mode === 'login' ? (
              <>
                <span className="font-['Poppins'] text-[14px] text-[#727272] block">
                  Selamat Datang
                </span>
                <h1 className="font-['Poppins'] text-[32px] sm:text-[36px] font-bold text-[#0B0C0F] leading-tight mt-1">
                  Masuk Ke UIIRuang
                </h1>
                <p className="font-['Poppins'] text-[14px] text-[#727272] mt-1">
                  Gunakan Email UII Terdaftar untuk Melanjutkan
                </p>
              </>
            ) : (
              <>
                <h1 className="font-['Poppins'] text-[32px] sm:text-[36px] font-bold text-[#0B0C0F] leading-tight">
                  Daftar Akun Mahasiswa
                </h1>
                <p className="font-['Poppins'] text-[14px] text-[#727272] mt-1">
                  Khusus Mahasiswa Aktif Universitas Islam Indonesia
                </p>
              </>
            )}

            {generalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[13px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORMULIR UTAMA */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Field Khusus Register: Nama Lengkap */}
              {mode === 'register' && (
                <div>
                  <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Thahir Al Faruq"
                    className="w-full h-[48px] px-4 rounded-[8px] border border-[#BABABA] text-[14px] text-[#0B0C0F] outline-none focus:border-[#093697] transition"
                  />
                </div>
              )}

              {/* Baris Khusus Register: NIM & Email Berdampingan 2 Kolom */}
              {mode === 'register' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* NIM */}
                  <div>
                    <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                      NIM
                    </label>
                    <input
                      type="text"
                      required
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      placeholder="24523014"
                      className="w-full h-[48px] px-4 rounded-[8px] border border-[#BABABA] text-[14px] text-[#0B0C0F] outline-none focus:border-[#093697] transition"
                    />
                  </div>

                  {/* Email UII */}
                  <div>
                    <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                      Email UII
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(null);
                      }}
                      placeholder="24523014@students.uii.ac.id"
                      className={`w-full h-[48px] px-4 rounded-[8px] border text-[14px] outline-none transition ${
                        emailError
                          ? 'border-[#EF4444] bg-[#FFF5F5] text-red-900'
                          : 'border-[#BABABA] text-[#0B0C0F] focus:border-[#093697]'
                      }`}
                    />
                    <p className="text-[11px] text-[#EF4444] mt-1 leading-tight">
                      Harus menggunakan email resmi UII<br />@students.uii.ac.id
                    </p>
                  </div>
                </div>
              ) : (
                /* Mode Login: Email UII 1 Baris Penuh */
                <div>
                  <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                    Email UII
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null);
                    }}
                    placeholder={
                      role === 'admin'
                        ? 'admin@uii.ac.id'
                        : '24523014@students.uii.ac.id'
                    }
                    className={`w-full h-[48px] px-4 rounded-[8px] border text-[14px] outline-none transition ${
                      emailError
                        ? 'border-[#EF4444] bg-[#FFF5F5] text-red-900'
                        : 'border-[#BABABA] text-[#0B0C0F] focus:border-[#093697]'
                    }`}
                  />
                  {emailError && (
                    <span className="text-[11px] text-[#EF4444] mt-1 block">
                      {emailError}
                    </span>
                  )}
                </div>
              )}

              {/* Field Kata Sandi */}
              <div>
                <label className="block text-[14px] font-medium text-[#0B0C0F] mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Masukkan kata sandi"
                    className={`w-full h-[48px] pl-4 pr-12 rounded-[8px] border text-[14px] outline-none transition ${
                      passwordError
                        ? 'border-[#EF4444] bg-[#FFF5F5] text-red-900'
                        : 'border-[#BABABA] text-[#0B0C0F] focus:border-[#093697]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-[#727272] hover:text-[#0B0C0F] transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <span className="text-[11px] text-[#EF4444] mt-1 block">
                    {passwordError}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[48px] bg-[#093697] hover:bg-blue-800 text-white rounded-[8px] font-['Poppins'] font-semibold text-[15px] transition shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : mode === 'login' ? (
                    <span>
                      Masuk Ke UII<span className="text-[#ECCA2E]">Ruang</span> &rarr;
                    </span>
                  ) : (
                    <span>Daftar Sekarang &rarr;</span>
                  )}
                </button>
              </div>

              {/* Switch Antara Masuk & Daftar */}
              <div className="text-center pt-1">
                {mode === 'login' ? (
                  <p className="font-['Poppins'] text-[13px] text-[#727272]">
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setRole('mahasiswa');
                        setEmail('24523014@students.uii.ac.id');
                        setEmailError(null);
                        setPasswordError(null);
                        setGeneralError(null);
                      }}
                      className="text-[#093697] font-medium underline hover:text-blue-900 transition"
                    >
                      Daftar di sini
                    </button>
                  </p>
                ) : (
                  <p className="font-['Poppins'] text-[13px] text-[#727272]">
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setEmailError(null);
                        setPasswordError(null);
                        setGeneralError(null);
                      }}
                      className="text-[#093697] font-medium underline hover:text-blue-900 transition"
                    >
                      Masuk di sini
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Role Switcher Tabs di Bagian Bawah (Khusus Mode Login persis Figma) */}
          {mode === 'login' && (
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-start gap-10">
              {/* Tab 1: Mahasiswa */}
              <button
                type="button"
                onClick={() => {
                  setRole('mahasiswa');
                  setEmail('24523014@students.uii.ac.id');
                  setEmailError(null);
                  setPasswordError(null);
                }}
                className="text-left cursor-pointer group pb-1"
              >
                <span
                  className={`block font-['Poppins'] font-bold text-[17px] transition leading-tight ${
                    role === 'mahasiswa'
                      ? 'text-[#0B0C0F]'
                      : 'text-[#BABABA] hover:text-[#727272]'
                  }`}
                >
                  Mahasiswa
                </span>
                <span
                  className={`block font-['Poppins'] text-[12px] mt-1 transition leading-tight ${
                    role === 'mahasiswa' ? 'text-[#0B0C0F]' : 'text-[#BABABA]'
                  }`}
                >
                  Masuk Sebagai Mahasiswa
                </span>
                {/* Yellow Underline Indicator */}
                <div
                  className={`h-[3px] rounded-full mt-2 transition-all duration-200 ${
                    role === 'mahasiswa' ? 'bg-[#ECCA2E] w-full' : 'bg-transparent w-0'
                  }`}
                />
              </button>

              {/* Tab 2: Admin */}
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setEmail('admin@uii.ac.id');
                  setEmailError(null);
                  setPasswordError(null);
                }}
                className="text-left cursor-pointer group pb-1"
              >
                <span
                  className={`block font-['Poppins'] font-bold text-[17px] transition leading-tight ${
                    role === 'admin'
                      ? 'text-[#0B0C0F]'
                      : 'text-[#BABABA] hover:text-[#727272]'
                  }`}
                >
                  Admin
                </span>
                <span
                  className={`block font-['Poppins'] text-[12px] mt-1 transition leading-tight ${
                    role === 'admin' ? 'text-[#0B0C0F]' : 'text-[#BABABA]'
                  }`}
                >
                  Masuk Sebagai Admin/Staff
                </span>
                {/* Yellow Underline Indicator */}
                <div
                  className={`h-[3px] rounded-full mt-2 transition-all duration-200 ${
                    role === 'admin' ? 'bg-[#ECCA2E] w-full' : 'bg-transparent w-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
