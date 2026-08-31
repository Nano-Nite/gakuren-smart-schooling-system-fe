export const FEATURE_STATUS = {
  AVAILABLE: 'Tersedia',
  DEVELOPMENT: 'Dalam pengembangan',
  CONTACT: 'Hubungi kami',
}

const available = (name, note) => ({ name, status: FEATURE_STATUS.AVAILABLE, note })
const development = (name, note) => ({ name, status: FEATURE_STATUS.DEVELOPMENT, note })
const contact = (name, note) => ({ name, status: FEATURE_STATUS.CONTACT, note })

export const pricingPlans = [
  {
    code: 'BASIC', name: 'Basic', price: 149000, priceLabel: 'Rp149.000', billingPeriod: 'per sekolah / bulan',
    capacity: 'Hingga 300 siswa', setupFee: 'Gratis', recommended: false,
    description: 'Untuk sekolah yang ingin mulai beralih dari pencatatan manual.', cta: 'Pilih Basic',
    features: [available('Data siswa, guru, dan kelas'), development('Absensi dasar'), available('QR kehadiran'), development('Pengajuan izin dan sakit'), development('Rekap kehadiran'), development('Laporan dasar'), available('Akses aplikasi secara online'), available('Biaya setup gratis')],
  },
  {
    code: 'STANDARD', name: 'Standard', price: 299000, priceLabel: 'Rp299.000', billingPeriod: 'per sekolah / bulan',
    capacity: 'Hingga 1.000 siswa', setupFee: 'Rp500.000', recommended: true,
    description: 'Untuk sekolah yang membutuhkan kontrol, fleksibilitas, dan laporan operasional yang lebih lengkap.', cta: 'Pilih Standard',
    features: [development('Semua fitur Dasar'), development('QR dinamis'), contact('Validasi lokasi'), contact('Identifikasi perangkat'), available('Dukungan luring PWA', 'Aplikasi web progresif yang dapat dipasang dan mendukung penggunaan luring terbatas.'), available('Sinkronisasi data'), development('Ekspor Excel'), contact('Audit aktivitas', 'Riwayat aktivitas dan perubahan data.'), available('Multi-peran dan hak akses'), available('Persetujuan bertahap')],
  },
  {
    code: 'PRO', name: 'Pro', price: 599000, priceLabel: 'Mulai Rp599.000', billingPeriod: 'per sekolah / bulan',
    capacity: 'Hingga 2.500 siswa', setupFee: 'Rp1.000.000', recommended: false,
    description: 'Untuk sekolah besar yang membutuhkan pengawasan, analisis, dan penyesuaian sistem lebih lanjut.', cta: 'Konsultasikan Pro',
    features: [development('Semua fitur Standar'), contact('Pencegahan manipulasi lanjutan'), contact('Verifikasi kehadiran tambahan'), development('Laporan lanjutan'), development('Peringatan dini pola kehadiran'), contact('Dukungan beberapa lokasi'), contact('Identitas visual sekolah'), contact('Dukungan prioritas')],
  },
  {
    code: 'ENTERPRISE', name: 'Enterprise', price: 1000000, priceLabel: 'Mulai Rp1.000.000', billingPeriod: 'per bulan',
    capacity: 'Multi-sekolah', setupFee: 'Sesuai kebutuhan', recommended: false,
    description: 'Untuk yayasan atau organisasi yang mengelola beberapa sekolah dan membutuhkan konfigurasi khusus.', cta: 'Hubungi Kami',
    features: [development('Semua fitur Pro'), development('Pengelolaan multi-sekolah'), development('Dasbor yayasan'), contact('Konfigurasi alur kerja khusus'), contact('Domain khusus'), contact('API dan integrasi', 'Antarmuka untuk menghubungkan Gakuren dengan sistem lain.'), contact('Kesepakatan tingkat layanan', 'Kesepakatan tingkat layanan dan dukungan.'), contact('Dukungan implementasi'), contact('Penyesuaian kebutuhan organisasi')],
  },
]

export const comparisonGroups = [
  { category: 'Data sekolah', features: ['Data siswa, guru, dan kelas', 'Pengelolaan multi-sekolah'] },
  { category: 'Kehadiran', features: ['Absensi dasar', 'QR kehadiran', 'QR dinamis', 'Dukungan offline PWA'] },
  { category: 'Integritas data', features: ['Validasi lokasi', 'Identifikasi perangkat', 'Audit aktivitas'] },
  { category: 'Alur kerja', features: ['Pengajuan izin dan sakit', 'Multi-peran dan hak akses', 'Persetujuan bertahap'] },
  { category: 'Laporan dan ekspor', features: ['Rekap kehadiran', 'Ekspor Excel', 'Laporan lanjutan'] },
  { category: 'Analisis', features: ['Peringatan dini pola kehadiran'] },
  { category: 'Kustomisasi', features: ['Identitas visual sekolah', 'Domain khusus', 'API dan integrasi'] },
  { category: 'Dukungan', features: ['Dukungan prioritas', 'Kesepakatan tingkat layanan', 'Dukungan implementasi'] },
]

export const pricingFaqs = [
  ['Apakah harga dihitung per siswa?', 'Tidak. Setiap paket memiliki batas kapasitas siswa. Sekolah membayar biaya paket bulanan sesuai kapasitas yang dipilih.'],
  ['Apakah ada biaya setup?', 'Paket Basic tidak dikenakan biaya setup. Paket lainnya dapat memiliki biaya setup sesuai kebutuhan implementasi.'],
  ['Apakah tersedia masa uji coba?', 'Ya. Sekolah dapat mencoba Gakuren selama 30 hari sebelum memilih paket.'],
  ['Bagaimana jika jumlah siswa bertambah?', 'Sekolah dapat menambah kapasitas atau berpindah paket tanpa kehilangan histori data.'],
  ['Apakah paket dapat disesuaikan?', 'Ya. Yayasan, sekolah besar, atau organisasi dengan kebutuhan khusus dapat menggunakan paket Enterprise.'],
  ['Apakah Gakuren terhubung langsung ke Dapodik?', 'Gakuren menyiapkan data dan file laporan untuk digunakan operator. Integrasi langsung hanya dilakukan melalui mekanisme resmi dan berizin.'],
]
