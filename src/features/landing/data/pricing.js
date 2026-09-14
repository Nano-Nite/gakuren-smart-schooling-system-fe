export const FEATURE_STATUS = {
  AVAILABLE: 'Tersedia',
  DEVELOPMENT: 'Sedang Dikembangkan',
  NEXT: 'Pengembangan Berikutnya',
}

const available = (name, note) => ({ name, status: FEATURE_STATUS.AVAILABLE, note })
const development = (name, note) => ({ name, status: FEATURE_STATUS.DEVELOPMENT, note })
const next = (name, note) => ({ name, status: FEATURE_STATUS.NEXT, note })

export const pricingPlans = [
  {
    code: 'BASIC', name: 'Basic', price: 149000, priceLabel: 'Rp149.000', billingPeriod: 'per sekolah / bulan',
    capacity: 'Hingga 300 siswa', setupFee: 'Gratis', recommended: false,
    description: 'Untuk sekolah yang ingin mulai beralih dari pencatatan manual.', cta: 'Pilih Basic',
    features: [available('Data siswa, guru, staf, dan kelas'), available('Kehadiran dasar'), available('Kehadiran melalui kode QR'), available('Pengajuan izin dan sakit'), available('Rekap kehadiran'), available('Laporan dasar'), available('Akses aplikasi secara daring'), available('Biaya awal gratis')],
  },
  {
    code: 'STANDARD', name: 'Standard', price: 299000, priceLabel: 'Rp299.000', billingPeriod: 'per sekolah / bulan',
    capacity: 'Hingga 1.000 siswa', setupFee: 'Rp500.000', recommended: true,
    description: 'Untuk sekolah yang membutuhkan kontrol, fleksibilitas, dan laporan operasional yang lebih lengkap.', cta: 'Pilih Standard',
    features: [available('Semua fitur Dasar'), available('Kode QR dinamis'), available('Validasi lokasi'), available('Pengenalan perangkat'), available('Dukungan luring terbatas'), available('Sinkronisasi data'), available('Unduh Excel'), available('Riwayat aktivitas'), available('Hak akses berdasarkan peran'), available('Persetujuan bertahap')],
  },
  {
    code: 'PRO', name: 'Pro', price: 599000, priceLabel: 'Mulai Rp599.000', billingPeriod: 'per sekolah / bulan',
    capacity: 'Hingga 2.500 siswa', setupFee: 'Rp1.000.000', recommended: false,
    description: 'Untuk sekolah besar yang membutuhkan pengawasan, analisis, dan penyesuaian sistem lebih lanjut.', cta: 'Konsultasikan Pro',
    features: [available('Semua fitur Standar'), next('Pencegahan manipulasi lanjutan'), next('Verifikasi kehadiran tambahan'), next('Laporan lanjutan'), next('Deteksi pola kehadiran'), next('Dukungan beberapa lokasi'), next('Identitas visual sekolah'), next('Dukungan prioritas')],
  },
  {
    code: 'ENTERPRISE', name: 'Enterprise', price: 1000000, priceLabel: 'Mulai Rp1.000.000', billingPeriod: 'per bulan',
    capacity: 'Multi-sekolah', setupFee: 'Sesuai kebutuhan', recommended: false,
    description: 'Untuk yayasan atau organisasi yang mengelola beberapa sekolah dan membutuhkan konfigurasi khusus.', cta: 'Hubungi Kami',
    features: [next('Semua fitur Pro'), next('Pengelolaan beberapa sekolah'), next('Beranda yayasan'), next('Konfigurasi proses khusus'), next('Domain khusus'), next('Antarmuka integrasi'), next('Kesepakatan tingkat layanan'), next('Dukungan implementasi'), next('Penyesuaian kebutuhan organisasi')],
  },
]

export const comparisonGroups = [
  { category: 'Data sekolah', features: ['Data siswa, guru, staf, dan kelas', 'Pengelolaan beberapa sekolah'] },
  { category: 'Kehadiran', features: ['Kehadiran dasar', 'Kehadiran melalui kode QR', 'Kode QR dinamis', 'Dukungan luring terbatas'] },
  { category: 'Keamanan data', features: ['Validasi lokasi', 'Pengenalan perangkat', 'Riwayat aktivitas'] },
  { category: 'Perizinan', features: ['Pengajuan izin dan sakit', 'Hak akses berdasarkan peran', 'Persetujuan bertahap'] },
  { category: 'Laporan', features: ['Rekap kehadiran', 'Unduh Excel', 'Laporan lanjutan'] },
  { category: 'Analisis', features: ['Deteksi pola kehadiran'] },
  { category: 'Kustomisasi', features: ['Identitas visual sekolah', 'Domain khusus', 'API dan integrasi'] },
  { category: 'Dukungan', features: ['Dukungan prioritas', 'Kesepakatan tingkat layanan', 'Dukungan implementasi'] },
]

export const pricingFaqs = [
  ['Apakah harga dihitung per siswa?', 'Tidak. Setiap paket memiliki batas kapasitas siswa. Sekolah membayar biaya paket bulanan sesuai kapasitas yang dipilih.'],
  ['Apakah ada biaya awal?', 'Paket Basic tidak dikenakan biaya awal. Paket lainnya dapat memiliki biaya awal sesuai kebutuhan penerapan.'],
  ['Apakah tersedia demo?', 'Ya. Demo dapat dibuka untuk melihat cara pengelolaan data, kehadiran, perizinan, persetujuan, dan laporan.'],
  ['Bagaimana jika jumlah siswa bertambah?', 'Sekolah dapat memilih paket dengan kapasitas yang lebih besar.'],
  ['Apakah paket dapat disesuaikan?', 'Ya. Yayasan, sekolah besar, atau organisasi dengan kebutuhan khusus dapat menggunakan paket Enterprise.'],
  ['Apakah Gakuren terhubung langsung ke Dapodik?', 'Gakuren membantu operator menyiapkan data untuk diperiksa. Pengiriman ke Dapodik tetap mengikuti mekanisme dan izin resmi.'],
]
