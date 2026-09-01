const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,

  LOGIN: '/v1/auth/login',
  LOGOUT: '/v1/auth/logout',
  REFRESH_TOKEN: '/v1/auth/refresh',
  GET_CLASSES: '/v1/school/class/get',
  CREATE_CLASS: '/v1/school/class/create',
  UPDATE_CLASS: '/v1/school/class/update',
  GET_STUDENTS: '/v1/school/student/get',
  CREATE_STUDENT: '/v1/school/student/create',
  UPDATE_STUDENT: '/v1/school/student/update',
  DELETE_STUDENT: '/v1/school/student/delete',
  GET_TEACHER_STAFF: '/v1/school/teacher-staff/get',
  GET_GENDERS: '/v1/school/misc/gender',
  GET_MY_APPROVALS: '/v1/school/approval/my-approval',
  EXECUTE_MY_APPROVAL: '/v1/school/approval/my-approval/execute',

  REQUEST_TIMEOUT: 30000,
}

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRY: 'tokenExpiry',
  USER_DATA: 'userData',
  TENANT_ID: 'tenantId',
  MENU_ITEMS: 'menuItems',
  PERMISSIONS: 'permissions',
  IS_AUTHENTICATED: 'isAuthenticated',
}

export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email atau password salah',
  SERVER_ERROR: 'Terjadi kesalahan pada server',
  NETWORK_ERROR: 'Tidak dapat terhubung ke server. Pastikan koneksi internet Anda aktif.',
  TIMEOUT: 'Koneksi timeout. Silakan coba lagi.',
  UNAUTHORIZED: 'Username atau password salah',
  FORBIDDEN: 'Akses ditolak',
  NOT_FOUND: 'Halaman tidak ditemukan',
}

export default API_CONFIG
