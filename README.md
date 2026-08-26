# Gakuren — Landing Page & Backend-Integrated Authentication

Landing page aplikasi manajemen sekolah "Gakuren", dibangun dengan React + Vite + Tailwind CSS, dan mendukung PWA (bisa di-install & tetap bisa diakses saat offline).

## ✨ Fitur Utama: Sistem Autentikasi Terintegrasi Backend

Frontend sudah **fully integrated** dengan backend API Anda:

- ✅ **Login Real** — Koneksi ke `http://localhost:3000/v1/auth/login`
- ✅ **JWT Token Management** — Access & refresh token otomatis
- ✅ **User Data Display** — Dashboard menampilkan data user dari API
- ✅ **Protected Routes** — Dashboard hanya bisa diakses setelah login
- ✅ **API Utilities** — Fungsi-fungsi siap pakai untuk API calls

### 🚀 Quick Start

```bash
# 1. Pastikan backend berjalan di http://localhost:3000
# 2. Start frontend
npm run dev

# 3. Buka http://localhost:5174/login
# 4. Login dengan kredensial Anda
```

### 📚 Dokumentasi Lengkap

| Dokumen | Isi |
|---------|-----|
| [READY_TO_USE.md](./READY_TO_USE.md) | 🎉 **START HERE** — Ringkasan lengkap & next steps |
| [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) | 🔌 Dokumentasi integrasi backend lengkap |
| [API_EXAMPLES.md](./API_EXAMPLES.md) | 💡 10 contoh code untuk API calls |
| [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) | 🔧 Setup environment variables |
| [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) | ✅ Testing & verification checklist |
| [LOGIN_GUIDE.md](./LOGIN_GUIDE.md) | 🔐 Detail fitur login page |
| [LOGIN_QUICKSTART.md](./LOGIN_QUICKSTART.md) | 🚀 Quick reference login page |

## Versi React
```
NPM  - 11.19.0
NVM  - 1.2.2
NODE - 26.7.0
```

## Struktur modul

- **Vite + React** — build tool & UI library.
- **React Router** — routing client-side untuk navigasi multi-halaman.
- **Tailwind CSS** — styling berbasis utility, token warna brand ada di `tailwind.config.js`.
- **lucide-react** — ikon.
- **recharts** — grafik kehadiran pada preview dashboard di hero.
- **react-helmet-async** — kelola tag `<title>` & meta SEO per halaman.
- **vite-plugin-pwa** — generate `manifest.webmanifest` + service worker (precache assets, cache gambar & halaman) sehingga situs bisa di-install ke home screen dan tetap terbuka saat offline.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Build produksi (service worker & manifest otomatis ter-generate di `dist/`):

```bash
npm run build
npm run preview
```

## Catatan PWA

- Ikon aplikasi ada di `public/icons/icon-192.svg` dan `icon-512.svg` (SVG, ringan). Ganti dengan PNG/branding resmi bila diperlukan sebelum rilis produksi.
- Konfigurasi manifest & caching ada di `vite.config.js` (bagian `VitePWA(...)`).
- `OfflineBanner` menampilkan status koneksi ke pengguna saat mereka offline.

## Struktur folder

```
src/
  pages/        -> Home.jsx, Login.jsx, Dashboard.jsx (halaman-halaman utama)
  components/   -> Navbar, Hero, DashboardPreview, Features, Testimonials, CTA, Footer, OfflineBanner
  data/         -> content.js (teks fitur, testimoni, data grafik — mudah diedit tanpa sentuh komponen)
  hooks/        -> useReveal.js (scroll-reveal animation, menghormati prefers-reduced-motion)
```

### Halaman yang Tersedia
- `/` — Halaman landing (Home)
- `/login` — Halaman login
- `/dashboard` — Dashboard (hanya untuk pengguna yang login)
