# Pencarian alamat lokasi

FE memakai Photon (`https://photon.komoot.io/api/`) tanpa API key. Pencarian dikirim hanya melalui tombol Cari/Enter, maksimal lima hasil. Hasil dipilih pengguna untuk memperbarui koordinat; nama lokasi dan radius tetap dipertahankan.

Untuk mengganti layanan dengan instance Photon sendiri atau proxy yang kompatibel, atur `VITE_GEOCODING_URL` sebelum build. Endpoint menerima parameter `q` dan `limit`, serta mengembalikan GeoJSON FeatureCollection. Proxy lintas origin harus mendukung CORS. Request tidak mengirim cookie maupun bearer token Gakuren.

Server publik Photon mengizinkan penggunaan wajar, bisa melakukan throttling, dan tidak memberikan SLA. Lihat https://github.com/komoot/photon#demo-server. Evaluasi instance sendiri atau provider khusus sebelum penggunaan berskala besar. Pembatasan FE 1,5 detik berlaku per tab, bukan pembatasan agregat seluruh aplikasi. Cache maksimal 50 kueri ada di memori dan hilang saat reload. Hanya teks pencarian yang dikirim; GPS tidak dikirim sebagai bias lokasi.

Penyimpanan konfigurasi lokasi ke BE tetap belum tersedia.
