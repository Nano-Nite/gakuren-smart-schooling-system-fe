# Gakuren — Landing Page

Landing page aplikasi manajemen sekolah "Gakuren", dibangun dengan React + Vite + Tailwind CSS, dan mendukung PWA (bisa di-install & tetap bisa diakses saat offline).

## Versi React
```
NPM  - 11.19.0
NVM  - 1.2.2
NODE - 26.7.0
```

## Struktur modul

- **Vite + React** — build tool & UI library.
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
  components/   -> Navbar, Hero, DashboardPreview, Features, Testimonials, CTA, Footer, OfflineBanner
  data/         -> content.js (teks fitur, testimoni, data grafik — mudah diedit tanpa sentuh komponen)
  hooks/        -> useReveal.js (scroll-reveal animation, menghormati prefers-reduced-motion)
```
