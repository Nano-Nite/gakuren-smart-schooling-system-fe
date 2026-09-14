# Trusted device: registrasi dan request signing

## Kontrak response BE terbaru

Registrasi memakai POST `/v1/school/trusted-device/register`. Pengecekan perangkat memakai GET `/v1/school/trusted-device/{device_uuid}` tanpa body; endpoint absensi `/v1/attendance/trusted-device` juga memakai POST tanpa body.

Response terbaru adalah `{ "data": { "device_uuid": "<UUID>", "location_uuid": "<UUID lokasi>", "school_uuid": "<UUID sekolah>", "trusted": true }, "error": null, "message": "success" }`.

FE memvalidasi UUID, sekolah dan lokasi, lalu memetakan `trusted: true` menjadi ACTIVE dan `false` menjadi PENDING, termasuk langsung setelah registrasi. Format ini tidak memerlukan `device_code`, `status`, atau `key_version`. Tanpa key_version dari BE, request signing tetap tidak tersedia; FE tidak mengarang versi kunci server. Kontrak status/key_version di bagian berikut tetap didukung sebagai format legacy, termasuk kewajiban pengecekan status setelah registrasi legacy.

Implementasi tahap 1–11 mempertahankan halaman `/settings/device`. Ed25519 memakai Web Crypto native; referensi algoritma dan SPKI: [W3C Web Cryptography](https://www.w3.org/TR/WebCryptoAPI/#ed25519).

## File dan tanggung jawab

- `src/shared/utils/crypto.js`: generate key Ed25519, export SPKI Base64, fingerprint SHA-256, encoding.
- `src/features/settings/device/services/trustedDeviceKeyStore.js`: IndexedDB, identifier instalasi, kunci dan metadata per akun/sekolah.
- `src/features/settings/device/services/trustedDeviceApi.js`: payload, POST register, GET status, migrasi persiapan lama, validasi respons, pesan error.
- `src/features/settings/device/services/trustedDeviceSigner.js`: canonical request, signature dan header perangkat.
- `src/features/settings/device/hooks/useTrustedDevice.js`: state halaman, pemuatan lokasi, registrasi dan refresh status.
- `src/features/settings/device/pages/DeviceSettings.jsx`: formulir dan status dengan komponen Select/checkbox FE.
- `src/shared/utils/api.js`: opsi `trustedDevice: true` pada HTTP client JWT yang ada.
- `src/shared/config/api.js`: URL endpoint registrasi/status.
- `src/app/layouts/AppLayout.jsx`: memeriksa status saat aplikasi dibuka setelah reload/login.

Service draft lama `deviceRegistration.js` digantikan oleh service di atas. Data lama dimigrasikan tanpa membuat kunci baru; UUID draft lokal lama tidak dianggap sebagai UUID backend.

## Alur registrasi

1. Pengguna mengisi nama, memilih lokasi dari `/v1/attendance/location/get-all`, dan memilih kebutuhan offline.
2. Tombol **Daftarkan perangkat** memvalidasi nama 3–80 karakter, UUID lokasi, boolean dan retensi 1/3/7 hari.
3. Generate Ed25519 dengan `extractable: false`, sign/verify self-test, export hanya public key sebagai SPKI Base64 standar dengan padding.
4. Fingerprint = `SHA256:` + hex uppercase SHA-256 dari byte SPKI.
5. Simpan kunci dan identifier di IndexedDB sebelum mengirim request. Jika ada persiapan, gunakan kunci yang sama.
6. POST `/v1/school/trusted-device/register` menggunakan JWT existing. Header `tenant_uuid` dan `school_uuid` tetap dikirim dari sesi aktif, termasuk pada GET status perangkat. Tenant, school dan registered_by tidak dimasukkan ke body; backend wajib memvalidasi scope header terhadap JWT dan menentukan registered_by.
7. Simpan UUID, kode perangkat, key version dan status PENDING. Bahkan jika POST mengembalikan ACTIVE, FE menunggu GET status sebelum memungkinkan signing.
8. GET `/v1/school/trusted-device/{device_uuid}` saat halaman dibuka, aplikasi dibuka/reload setelah login, atau tombol **Periksa status** ditekan.
9. Status dari GET: PENDING → Menunggu persetujuan; ACTIVE → Perangkat aktif; REVOKED → Perangkat dicabut; SUSPENDED → Perangkat dinonaktifkan sementara.

Contoh body (UUID placeholder harus diganti UUID lokasi nyata; identifier berasal dari browser):

```json
{
  "device_name": "Laptop ruang tata usaha",
  "location_uuid": "<UUID lokasi sekolah>",
  "device_identifier": "<UUID instalasi browser>",
  "key": {
    "algorithm": "ED25519",
    "public_key_format": "SPKI",
    "public_key": "<Base64 SPKI, bukan PEM>",
    "fingerprint": "SHA256:<HEX_UPPERCASE>"
  },
  "offline_capability": {
    "attendance_offline": true,
    "auto_sync": true,
    "temporary_storage_days": 7
  }
}
```

`buildRegistrationPayload()` memisahkan mapping offline_capability agar mudah disesuaikan. Pilihan offline hanya dikirim sebagai permintaan konfigurasi; tahap ini tidak mengubah queue, sinkronisasi atau pelaksanaan retensi data.

Respons register dan GET status yang diterima:

```json
{
  "error": false,
  "data": {
    "device_uuid": "<UUID backend>",
    "device_code": "GKR-DEV-00001",
    "status": "PENDING",
    "key_version": 1
  }
}
```

Respons harus memuat UUID valid, kode nonkosong, status dikenal dan key_version integer positif. GET status harus mengembalikan UUID yang sama dengan request. Format lain ditolak dan tidak mengaktifkan perangkat.

## Penyimpanan private key

Database tetap `gakuren-device-registration:v1`, object store `devices`, untuk mempertahankan persiapan versi lama. Record kunci dipartisi menggunakan scope tenant/sekolah/pengguna existing; partition key bukan bukti otorisasi.

Record berisi `privateKey: CryptoKey`, `publicKey: CryptoKey`, `algorithm: ED25519`, `keyVersion`, `localKeyVersion`, `deviceUuid`, `deviceIdentifier`, `createdAt`, status, form dan public registration payload. CryptoKey disimpan langsung melalui structured clone IndexedDB, bukan JSON/Base64. Kunci pribadi tidak diekspor, tidak masuk localStorage/sessionStorage, tidak dikirim ke API atau ditampilkan di UI.

Identifier instalasi disimpan satu kali dalam record `@browser-installation` pada database yang sama. Pembuatan dalam transaksi readwrite memastikan permintaan bersamaan menerima identifier yang sama. Identifier berbeda dari device_uuid server dan bukan credential.

Helper tersedia: `savePrivateKey`, `getPrivateKey`, `deletePrivateKey`, `hasPrivateKey`, `getOrCreateDeviceIdentifier`, `getDeviceRecord`, `updateDeviceRecord`. `savePrivateKey` bersifat add-only. `deletePrivateKey` menghapus kunci dari record tetapi mempertahankan metadata sebagai penanda kehilangan kunci; tidak memanggil revoke backend. Tidak ada tombol revoke/reset/rotation dalam UI.

Jika kunci hilang, tampilkan **Kunci keamanan perangkat ini tidak ditemukan. Perangkat perlu didaftarkan ulang.** Jangan membuat kunci baru untuk device_uuid lama. Browser lain atau penghapusan seluruh data situs menghasilkan instalasi baru; pengelola harus menangani pendaftaran lama di backend.

Non-extractable bukan hardware attestation dan tidak mencegah script berbahaya dalam origin menggunakan kunci untuk signing. Backend tetap harus memverifikasi JWT, hubungan perangkat dengan sesi, status dan izin setiap request. Status lokal adalah pemeriksaan awal FE, bukan otorisasi server.

## Canonical message dan signature

```text
METHOD
PATH
TIMESTAMP
NONCE
BODY_SHA256
```

- Dipisahkan tepat satu LF (`\n`), tanpa trailing newline.
- METHOD uppercase; memakai method efektif yang dikirim HTTP client.
- PATH pathname API, misalnya `/v1/attendance/sessions`. Helper menolak domain, query, fragment, whitespace dan dot segments. Jangan memakai endpoint dengan query untuk request signed dalam kontrak ini.
- TIMESTAMP UNIX seconds dari jam perangkat.
- NONCE UUID acak baru untuk setiap pengiriman.
- BODY_SHA256 hex lowercase dari UTF-8 bodyText. GET/HEAD tanpa body menggunakan empty string.
- Signature Ed25519 atas UTF-8 canonical message, dikodekan Base64 standar (bukan Base64URL).

Pemakaian service langsung:

```js
const bodyText = JSON.stringify(payload);
const proof = await signTrustedDeviceRequest({
  method: 'POST', path: '/v1/attendance/sessions', body: bodyText
});
// proof hanya deviceId, keyVersion, timestamp, nonce, signature; tidak ada privateKey.
```

Integrasi yang dianjurkan memakai HTTP client existing:

```js
import { authenticatedRequest } from './utils/api';

await authenticatedRequest('/v1/attendance/sessions', {
  method: 'POST',
  body: payload,
  trustedDevice: true
});
```

HTTP client stringify body sekali, menandatangani string tersebut, lalu mengirim string yang sama. Setelah refresh JWT karena 401, retry memakai bodyText lama tetapi menghasilkan timestamp/nonce/signature baru. Caller tidak dapat menimpa header device yang dihasilkan helper. Endpoint tanpa opsi trustedDevice tetap menggunakan perilaku lama. Tidak ada perubahan QR generation atau service queue/sync/rotation/revoke dalam pekerjaan ini; contoh pemakaian di atas belum memaksa semua request absensi lama memakai signing.

Header request:

```http
POST /v1/attendance/sessions
Authorization: Bearer <access token>
tenant_uuid: <tenant dari sesi aktif>
school_uuid: <sekolah dari sesi aktif>
Content-Type: application/json
X-Device-ID: <device_uuid>
X-Key-Version: 1
X-Timestamp: <UNIX_SECONDS>
X-Nonce: <UUID baru>
X-Signature: <Base64 signature>
```

Body tetap JSON normal; signature tidak masuk body. Signer menolak perangkat non-ACTIVE, kunci hilang/non-Ed25519/extractable dan ketidakcocokan versi kunci. Tidak ada fallback unsigned jika signing gagal.

## Error dan retry

- UI membedakan validasi, izin, browser tidak mendukung, konteks tidak aman, storage unavailable/blocked/timeout/quota, kegagalan CryptoKey clone, data lokal rusak, kunci hilang, network/abort, serta respons backend invalid.
- HTTP 400/422: data ditolak; 401: login ulang; 403: izin; 404/405/501: layanan/data belum tersedia; 409: konflik/duplikat; 410: tidak berlaku; 413: ukuran; 429: tunggu; 5xx: gangguan server. Pesan internal server tidak ditampilkan mentah.
- Tidak ada retry otomatis registration setelah network/5xx/429. User dapat melanjutkan dengan payload, identifier dan public key yang sama. Form dibekukan setelah pengiriman pertama agar retry tidak mengubah request yang hasilnya belum pasti.
- Lease transaksi IndexedDB mencegah dua tab mengirim pendaftaran bersamaan. Masa lease 45 detik, timeout request 30 detik. Backend tetap harus menangani idempotency untuk tab yang crash atau hasil request yang tidak diketahui.
- Network timeout atau persist lokal gagal setelah server sukses: kunci dan payload tetap dipertahankan. Tanpa device_uuid yang berhasil disimpan, FE tidak bisa melakukan GET berdasarkan UUID; retry POST harus mengembalikan pendaftaran yang sama. Konflik 409 meminta bantuan pengelola dan tidak membuat key baru.
- Pembacaan status gagal tidak mempromosikan status. Halaman memberi pesan bahwa status terbaru belum diperiksa. Server wajib menolak status revoked/suspended bahkan jika status lokal masih ACTIVE.

## Yang perlu dipastikan bersama backend

1. Ketersediaan kedua endpoint dan bentuk respons di atas; ubah URL di API_CONFIG dan mapping di trustedDeviceApi jika berbeda. Belum diuji ke backend nyata dalam pekerjaan ini.
2. Register idempotent untuk pasangan identitas JWT + device_identifier + public key. Retry identik mengembalikan device_uuid yang sama; key berbeda untuk identifier lama harus ditolak. Tidak ada endpoint lookup by identifier dalam kontrak saat ini.
3. Status legacy memuat device_code dan key_version. Aktivasi dilakukan pengelola/backend.
4. Verifikasi SPKI Ed25519, fingerprint dan kepemilikan perangkat/JWT. Kontrak terbaru tidak memakai registration challenge dari draft lama.
5. Verifikasi canonical bytes, batas clock skew, replay protection nonce, key version, status aktif dan izin. Jam klien bukan sumber waktu otoritatif.
6. CORS mengizinkan Authorization, Content-Type, tenant_uuid, school_uuid dan lima header X-* di atas. Request registrasi, status perangkat, dan signed mempertahankan scope headers existing; server wajib memvalidasi scope terhadap JWT.
7. Daftar endpoint sensitif yang harus mengaktifkan `trustedDevice: true`, dan dukungan object offline_capability.
8. Offline queue, sync, key rotation, revoke dan server QR signing tidak termasuk tahap ini.
