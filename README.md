# UIIRuang - Frontend Peminjaman Ruangan & Pengaduan Fasilitas Kampus UII

Aplikasi Web Frontend untuk reservasi ruangan dan pelaporan fasilitas kampus Universitas Islam Indonesia (UII) berbasis React, TypeScript, Vite, Tailwind CSS, dan Nginx.

---

## 🚀 Cara Menjalankan dengan Docker (Rekomendasi untuk BE / Deployment)

Proyek ini telah dilengkapi dengan `Dockerfile` (multi-stage build) dan `docker-compose.yml` yang siap dijalankan tanpa perlu menginstal Node.js secara lokal.

### 1. Jalankan Menggunakan Docker Compose
```bash
docker compose up -d --build
```
Aplikasi akan otomatis ter-build dan berjalan di port **5173**:
- Buka browser: [http://localhost:5173](http://localhost:5173)

### 2. Menghentikan Container
```bash
docker compose down
```

### 3. Build & Run Manual Docker
```bash
# Build image
docker build -t uiiruang-frontend .

# Jalankan container
docker run -d -p 5173:80 --name uiiruang-frontend uiiruang-frontend
```

---

## 💻 Cara Menjalankan Secara Lokal (Development)

Pastikan telah menginstal **Node.js (v18+)** dan **npm**.

```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
npm run dev
```
Aplikasi berjalan di [http://localhost:5173](http://localhost:5173).

```bash
# 3. Build production lokal
npm run build
```

---

## 🔑 Akun Uji Coba

- **Mahasiswa:** `24523001@students.uii.ac.id` / `password123` (Nama: tes, NIM: 24523001)
- **Mahasiswa:** `24523014@students.uii.ac.id` / `password123` (Nama: Thahir Al Faruq, NIM: 24523014)
- **Mahasiswa:** `23523004@students.uii.ac.id` / `password123` (Nama: Raihan Arhab, NIM: 23523004)
- **Admin Fasilitas:** `admin@uii.ac.id` / `password123`

---

## 🛠️ Tech Stack
- **Framework:** React 18, Vite 5, TypeScript
- **Styling:** Tailwind CSS, Lucide Icons, Custom Poppins Font
- **State & Data Fetching:** React Context, Axios, React Hook Form, Zod
- **Production Web Server:** Nginx Alpine (SPA Routing with `try_files`)
- **Containerization:** Docker & Docker Compose
