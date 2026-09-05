# Kontrak sesi FE–BE untuk PWA

Perubahan FE ini memerlukan penerapan kontrak berikut di BE sebelum rilis.
FE tidak dapat membuat atau memverifikasi atribut cookie HttpOnly melalui JavaScript.

## Login dan refresh

- `POST /v1/auth/login`: tetap menerima email di JSON dan password terenkripsi RSA di header Authorization seperti implementasi sebelumnya.
- `POST /v1/auth/refresh`: menerima JSON `{}`; membaca refresh token dari cookie, bukan body atau bearer token. Endpoint harus dapat dipakai tanpa access token dan tanpa header scope ketika PWA baru dibuka. Identitas/scope berasal dari sesi server.
- Keduanya harus mengirim bentuk respons lengkap berikut. Refresh harus mengembalikan ulang metadata agar aplikasi dapat dibuka kembali tanpa data sesi browser sebelumnya.

```json
{
  "error": false,
  "data": {
    "token": { "access_token": "short-lived-access-token" },
    "user_data": { "uuid": "user-uuid", "user_name": "Nama", "email": "user@example.com" },
    "tenant_uuid": "tenant-uuid",
    "school_uuid": "school-uuid",
    "menu": ["Dashboard"],
    "permission": ["dashboard.read"]
  }
}
```

BE menentukan dan menegakkan masa berlaku access token yang pendek. FE menyimpannya hanya di memori dan melakukan refresh setelah `401`, lalu mengulang request sekali. BE harus menolak request tanpa otorisasi sebelum melakukan mutasi. Refresh yang bersamaan dalam satu tab memakai satu promise. BE perlu menangani rotasi dari beberapa tab/perangkat sesuai kebijakan sesinya.

Refresh token tidak boleh lagi dikirim dalam JSON. Contoh cookie untuk deployment FE/API yang same-site dengan HTTPS:

```http
Set-Cookie: refresh_token=<opaque-value>; HttpOnly; Secure; SameSite=Lax; Path=/v1/auth; Max-Age=<server-policy-seconds>
Cache-Control: no-store
```

Gunakan cookie host-only (tanpa Domain) jika memungkinkan. Jika deployment benar-benar cross-site, evaluasi `SameSite=None; Secure` dan pembatasan third-party cookie browser; deployment same-site atau reverse proxy lebih mudah dipertahankan. Persistensi setelah aplikasi ditutup memerlukan masa berlaku cookie (`Max-Age`/`Expires`) dari BE. Rotasikan refresh token dan cabut sesi sesuai kebijakan server.

## CSRF dan CORS

FE menggunakan `credentials: include`, `cache: no-store`, `Content-Type: application/json`, serta `X-Requested-With: XMLHttpRequest` pada login, refresh, dan logout.

BE wajib memvalidasi Origin terhadap daftar origin FE yang eksplisit, mewajibkan custom header tersebut, dan menolak content type sederhana pada endpoint ini. Header saja tidak cukup jika BE menerima origin sembarang. Untuk cross-origin, tangani OPTIONS dan kirim `Access-Control-Allow-Credentials: true`, origin FE spesifik (bukan `*`), serta allowlist header `Content-Type`, `Authorization`, `X-Requested-With`, `tenant_uuid`, dan `school_uuid`. Jangan memakai wildcard subdomain tanpa validasi.

API fitur memakai bearer access token dengan `credentials: omit`. BE harus memeriksa permission dan kecocokan `tenant_uuid`/`school_uuid` terhadap sesi token untuk setiap request; metadata dan menu FE bukan bukti otorisasi.

## Logout

`POST /v1/auth/logout` harus mencabut sesi refresh dan menghapus cookie dengan Path/Domain yang sama dan `Max-Age=0`, termasuk jika access token sudah kedaluwarsa. Endpoint idempoten; respons sukses boleh JSON atau 204. Saat retry setelah logout lokal, email, access token, dan header scope mungkin tidak tersedia; cookie cukup untuk mencabut sesi.

FE selalu membersihkan access token, metadata sesi, dan cache lokal terkait, termasuk jika jaringan gagal. Penanda logout nonrahasia mencegah pemulihan otomatis memakai cookie yang belum berhasil dicabut. Halaman login menyediakan retry logout server dan penandanya bertahan setelah reload. Logout disiarkan melalui storage event ke tab lain. Login eksplisit yang berhasil menghapus penanda.

## Cache dan batas offline

- Token lama pada sessionStorage/localStorage dihapus ketika modul auth dimuat; flag autentikasi tersimpan tidak dipercaya.
- Pembukaan/reload aplikasi menunggu refresh. Jika offline atau BE gagal, aplikasi menampilkan retry/login, bukan membuka halaman terlindungi dari flag tersimpan. Sesi yang masih terbuka tetap dapat memakai fitur offline yang sudah disediakan.
- Pembukaan aplikasi secara penuh ketika offline belum didukung. Itu memerlukan rancangan izin offline dan penguncian perangkat tersendiri.
- Referensi dipisahkan menurut tenant, sekolah, dan pengguna. Request lama tidak boleh mengisi cache setelah sesi berubah.
- IndexedDB absensi menggunakan database per tenant/sekolah/pengguna. Saat logout, kredensial QR, konfigurasi, trusted-device cache, metadata sync, dan catatan selesai dihapus. `PENDING_SYNC` dipertahankan di partisi pemiliknya agar pekerjaan tidak hilang; setelah login kembali dengan pemilik yang sama, konfigurasi/perangkat perlu disiapkan kembali sebelum sinkronisasi.
- Database legacy `gakuren-attendance-offline` tidak dibaca atau dihapus otomatis karena catatannya tidak memiliki identitas operator/tenant yang cukup untuk migrasi aman. **Sinkronkan antrean versi lama sebelum upgrade.** Jika masih ada antrean legacy, lakukan rekonsiliasi terkontrol; jangan mengatribusikannya otomatis ke pengguna berikutnya.
- Partisi IndexedDB mencegah pencampuran dalam alur aplikasi; ini bukan enkripsi atau proteksi dari XSS/akses profil browser lokal. Antrean offline masih memuat data absensi dan kredensial yang diperlukan untuk verifikasi server.
- Service worker tidak menyimpan respons `/v1/`; aset aplikasi tetap tersedia offline. BE juga harus mengirim `Cache-Control: no-store` pada respons sensitif.

## Validasi

`npm test` memeriksa penyimpanan token, bootstrap, header, concurrent refresh, retry terbatas, perubahan scope, logout/race, dan isolasi cache referensi memakai respons BE tiruan. `npm run build` memeriksa build aplikasi/PWA.

`node tests/offline-store.browser.mjs` menjalankan pemeriksaan IndexedDB asli di Chromium: set environment `BROWSER_PATH` ke executable Chrome/Edge. Tes ini memeriksa isolasi pengguna/sekolah, penolakan akses tanpa scope, pembersihan logout, dan retensi antrean pending. Runner memakai profil browser sementara; pada lingkungan sandbox yang menghalangi renderer, `BROWSER_TEST_NO_SANDBOX=1` tersedia khusus untuk fixture lokal ini.

Sebelum rilis, uji integrasi browser dengan BE sebenarnya: atribut Set-Cookie, penolakan CSRF/CORS, refresh setelah tutup/buka PWA, rotasi, pencabutan logout, serta penyimpanan/sinkronisasi IndexedDB di perangkat target. Uji FE tidak membuktikan konfigurasi keamanan BE.

Referensi: [MDN credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials), [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
