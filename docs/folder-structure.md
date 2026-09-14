# Struktur folder frontend

Kode dikelompokkan berdasarkan menu atau fitur. Komponen dan logic yang berlaku lintas menu ditempatkan di `shared`. Nama file tetap deskriptif agar mudah dicari dari IDE.

```text
src/
├── app/
│   ├── App.jsx                  # Routing, proteksi akses, pemulihan sesi
│   ├── layouts/AppLayout.jsx    # Sidebar dan kerangka halaman aplikasi
│   └── pages/                   # Submenu, placeholder, akses ditolak, offline
├── features/
│   ├── landing/                 # Home, section promosi, konten dan pricing
│   ├── auth/                    # Login dan SignUp
│   ├── dashboard/               # Dashboard dan AttendanceStats
│   ├── students/                # Student Management
│   ├── teachers-staff/          # Teacher and Staff
│   ├── classes/                 # Class Management
│   ├── approvals/               # Approval
│   ├── qr-code/                 # Halaman pengelolaan QR
│   ├── attendance/              # Scan, sesi, QR absensi dan sinkronisasi offline
│   ├── profile/                 # Profil pengguna
│   └── settings/
│       ├── device/              # Registrasi perangkat, key store dan signer
│       └── location/            # Pengaturan lokasi
├── shared/
│   ├── components/              # UI dan komponen aplikasi lintas menu
│   ├── hooks/                   # Aktivasi data, transisi langkah, reveal
│   ├── services/                # Pencarian alamat
│   ├── utils/                   # API client, permission, referensi dan helper
│   ├── context/                 # Locale, tema, loading dan login splash
│   ├── config/                  # Konfigurasi endpoint API
│   └── i18n/                    # Terjemahan
├── main.jsx                     # Entry point, provider global dan PWA
└── index.css                    # Style global
```

## Isi folder fitur

Gunakan subfolder sesuai kebutuhan; tidak perlu membuat folder kosong:

| Folder | Isi |
| --- | --- |
| `pages/` | Halaman yang dipasang pada route atau submenu |
| `components/` | Bagian UI khusus fitur, misalnya `StudentDetail.jsx` |
| `hooks/` | State dan lifecycle fitur, misalnya `useAttendanceSession.js` |
| `services/` | Integrasi API atau penyimpanan fitur |
| `utils/` | Transformasi data, payload, validasi dan helper fitur |
| `data/` | Data statis khusus fitur |

Contoh: perubahan alur scan ada di `features/attendance/pages/AttendanceScan.jsx`, sedangkan registrasi perangkat ada di `features/settings/device/pages/DeviceSettings.jsx`. Menu yang masih berupa placeholder menggunakan `app/pages/ModulePlaceholder.jsx`; buat folder fiturnya saat implementasi tersedia.

## Bagian yang dapat digunakan ulang

Semua komponen pada tabel ini berada di `src/shared/components/`.

| Kebutuhan | File |
| --- | --- |
| Input pilihan | `Select.jsx`, `GenderSelect.jsx`, `AcademicTermSelector.jsx` |
| Tanggal dan waktu | `DatePicker.jsx`, `TimePicker.jsx`, `DateTimeInput.jsx` |
| Tabel dan navigasi data | `DataTable.jsx`, `TablePagination.jsx`, `CarouselNavigation.jsx` |
| Form bertahap | `FormDrawer.jsx`, `AnimatedStepper.jsx`, `StepTransition.jsx` |
| Konfirmasi dan error | `ConfirmDialog.jsx`, `FormErrorDialog.jsx`, `UnsavedChangesDialog.jsx` |
| Status dan aksi data | `StatusBadge.jsx`, `StatusRowActions.jsx`, `StatusChangeDialog.jsx`, `ExpandableBadges.jsx` |
| Lokasi | `AddressSearch.jsx`, `LocationMap.jsx` |
| Akses, loading dan tema | `PermissionGate.jsx`, `PageSkeleton.jsx`, `AuthSplash.jsx`, `SessionSplash.jsx`, `ThemeToggle.jsx` |
| Notifikasi, koneksi dan PWA | `NotificationStack.jsx`, `NetworkStatusMonitor.jsx`, `OfflineBanner.jsx`, `PwaInstallBanner.jsx` |

Helper reusable meliputi `shared/utils/api.js` untuk HTTP dan sesi, `permissions.js` untuk akses, `dailyReferenceCache.js` untuk referensi, `notifications.js` untuk notifikasi, serta `academicTerm.js` dan `academicTitleDisplay.js` untuk data akademik. `resolveApprovalReference.js` tetap shared karena dipakai juga untuk pilihan gelar. Hook `shared/hooks/useActivateData.js` digunakan untuk aktivasi data lintas menu.

Komponen khusus domain tetap berada di fitur pemiliknya meskipun dapat dipakai fitur terkait. Misalnya approval memakai formatter dari `teachers-staff/utils/teacherStaffData.js`, dan halaman QR memakai komponen serta layanan `attendance`. Picker jabatan, mata pelajaran, gelar, pendidikan dan status pegawai berada di `teachers-staff/components/` karena terkait domain guru/staf.

## Aturan pengembangan

1. Mulai dari folder menu yang memiliki perilaku tersebut. Letakkan komponen detail dan pembentukan payload bersama fiturnya.
2. Gunakan komponen `shared` yang sudah ada sebelum membuat komponen baru. Pindahkan komponen ke `shared` bila tanggung jawabnya berlaku lintas menu dan tidak terikat alur satu fitur.
3. Import langsung dari file pemiliknya dengan path relatif. Contoh dari `features/students/pages/StudentManagement.jsx`:

   ```jsx
   import StudentDetail from '../components/StudentDetail'
   import Select from '../../../shared/components/Select'
   import { authenticatedRequest } from '../../../shared/utils/api'
   ```

4. `app` merangkai fitur; fitur tidak mengimpor routing atau layout dari `app`. Hindari menambah dependensi fitur pada komponen UI shared. Integrasi yang sudah ada di `shared/utils/api.js` tetap memanggil cache absensi saat pergantian sesi dan signer perangkat untuk request bertanda tangan.
5. Tes berada di `tests/`. Saat memindahkan file, sesuaikan import, path `readFile`, stub modul pada tes, dan referensi dokumentasi. Jalankan `npm test` serta `npm run build`.

Pemindahan folder ini mempertahankan URL route, perilaku aplikasi, dan kontrak API.
