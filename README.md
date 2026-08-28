# Gakuren Smart Schooling System — Frontend

Frontend aplikasi manajemen sekolah Gakuren yang dibangun dengan React, Vite, dan Tailwind CSS. Aplikasi menyediakan landing page, autentikasi yang terhubung ke backend, dashboard terproteksi, serta dukungan Progressive Web App (PWA).

## Fitur

- Landing page responsif
- Login dan logout melalui backend API
- Enkripsi password dengan RSA-OAEP sebelum dikirim
- Penyimpanan access token, refresh token, data pengguna, menu, dan permission di `sessionStorage`
- Proteksi route dashboard
- PWA dengan service worker, dukungan instalasi, dan cache aset
- Banner status koneksi saat perangkat offline

## Teknologi

- React 18
- Vite 8
- React Router
- Tailwind CSS
- Recharts
- Lucide React
- React Helmet Async
- Vite PWA

## Prasyarat

- Node.js yang kompatibel dengan Vite 8
- npm
- Backend Gakuren yang dapat diakses oleh browser
- RSA public key dari backend

## Menjalankan aplikasi

1. Instal dependency:

   ```bash
   npm ci
   ```

2. Buat file `.env` di root project:

   ```dotenv
   VITE_API_URL=http://localhost:3000
   VITE_RSA_PUBLIC_KEY=<base64-encoded-PEM-public-key>
   ```

   `VITE_RSA_PUBLIC_KEY` harus berisi seluruh PEM public key yang telah di-encode ke Base64. Jangan menyimpan private key di frontend.

3. Jalankan development server:

   ```bash
   npm run dev
   ```

4. Buka [http://localhost:5173](http://localhost:5173). Halaman login tersedia di [http://localhost:5173/login](http://localhost:5173/login).

Backend lokal secara umum berjalan di `http://localhost:3000`. Pastikan konfigurasi CORS backend mengizinkan origin `http://localhost:5173`.

## Script npm

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan development server di port `5173` |
| `npm run build` | Membuat production build di folder `dist/` |
| `npm run preview` | Menjalankan preview dari production build |

## Route

| Route | Keterangan |
| --- | --- |
| `/` | Landing page |
| `/login` | Halaman login |
| `/dashboard` | Dashboard yang hanya dapat diakses setelah login |

Route yang tidak dikenal akan diarahkan kembali ke `/`.

## Struktur project

```text
src/
├── components/   # Komponen landing page dan OfflineBanner
├── config/       # Konfigurasi endpoint API
├── data/         # Konten fitur, testimoni, dan data grafik
├── hooks/        # Custom React hooks
├── pages/        # Home, Login, dan Dashboard
├── utils/        # API client dan pengelolaan autentikasi
├── App.jsx       # Router dan protected route
├── index.css     # Global styles
└── main.jsx      # Entry point aplikasi
```

Konfigurasi Vite dan PWA berada di `vite.config.js`. Ikon aplikasi berada di `public/icons/`.

## Production build

```bash
npm run build
npm run preview
```

Build akan menghasilkan folder `dist/` beserta manifest dan service worker PWA. Karena aplikasi menggunakan `BrowserRouter`, server production perlu dikonfigurasi agar semua route frontend mengarah ke `index.html`.
