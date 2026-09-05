import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClassManagement from './pages/ClassManagement'
import StudentManagement from './pages/StudentManagement'
import TeacherStaffManagement from './pages/TeacherStaffManagement'
import QrCodeManagement from './pages/QrCodeManagement'
import ApprovalManagement from './pages/ApprovalManagement'
import AppLayout from './components/AppLayout'
import Profile from './pages/Profile'
import SignUp from './pages/SignUp'
import ModulePlaceholder from './pages/ModulePlaceholder'
import { getDefaultAuthorizedRoute } from './utils/permissions'
import { initializeAuth, isNetworkAvailable, isUserAuthenticated, setNetworkAvailable } from './utils/api'
import { getMenuItems, hasAnyPermission, MENU_ROUTES } from './utils/permissions'
import AccessDenied from './pages/AccessDenied'
import OfflineUnavailable from './pages/OfflineUnavailable'

const OFFLINE_MENU_ACCESS = new Set(['QR Code', 'Report', 'Setting'])

function ProtectedRoute({ children, permissions, menu }) {
  const [online, setOnline] = useState(isNetworkAvailable())

  useEffect(() => {
    const updateConnection = () => { if (!navigator.onLine) { setNetworkAvailable(false); setOnline(false) } }
    const updateApplicationNetwork = event => setOnline(event.detail.online)
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    window.addEventListener('gakuren:network', updateApplicationNetwork)
    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
      window.removeEventListener('gakuren:network', updateApplicationNetwork)
    }
  }, [])

  if (!isUserAuthenticated()) return <Navigate to="/login" />
  if (menu && !getMenuItems().includes(menu)) return <Navigate to="/" replace />
  if (permissions?.length && !hasAnyPermission(permissions)) return <AccessDenied menu={menu} />
  if (menu && !online && !OFFLINE_MENU_ACCESS.has(menu)) return <OfflineUnavailable menu={menu} />
  return children
}

function DefaultRedirect() {
  if (!isUserAuthenticated()) return <Navigate to="/" replace />
  const lastRoute = localStorage.getItem('gakuren:last-menu-route')
  const assignedRoutes = getMenuItems().map(menu => MENU_ROUTES[menu]).filter(Boolean)
  return <Navigate to={assignedRoutes.includes(lastRoute) ? lastRoute : getDefaultAuthorizedRoute()} replace />
}

function HomeOrInstalledApp() {
  const launchedAsApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  return launchedAsApp && isUserAuthenticated() ? <DefaultRedirect /> : <Home />
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [restoreError, setRestoreError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [, updateAuth] = useState(0)

  useEffect(() => {
    const onAuth = () => updateAuth(value => value + 1)
    window.addEventListener('gakuren:auth', onAuth)
    return () => window.removeEventListener('gakuren:auth', onAuth)
  }, [])

  useEffect(() => {
    let active = true
    setReady(false)
    setRestoreError('')
    initializeAuth().catch(error => {
      if (active) setRestoreError(error.message || 'Tidak dapat memulihkan sesi.')
    }).finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [attempt])

  if (!ready) return <div role="status" className="flex min-h-dvh items-center justify-center">Memulihkan sesi...</div>
  if (restoreError) return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
    <p role="alert">{restoreError}</p>
    <p>Hubungkan internet untuk memulihkan sesi, atau masuk kembali.</p>
    <button type="button" onClick={() => setAttempt(value => value + 1)}>Coba lagi</button>
    <button type="button" onClick={() => { setRestoreError(''); window.history.replaceState(null, '', '/login') }}>Ke halaman login</button>
  </div>

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeOrInstalledApp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<ProtectedRoute menu="Dashboard" permissions={["dashboard.view", "dashboard.read"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/qr-code" element={<ProtectedRoute menu="QR Code" permissions={["qrcode.view", "qrcode.read"]}><QrCodeManagement /></ProtectedRoute>} />
            <Route path="/teachers" element={<ProtectedRoute menu="Teacher and Staff" permissions={["teacherandstaff.view", "teacherandstaff.read"]}><TeacherStaffManagement /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute menu="Student Management" permissions={["student.view", "student.read"]}><StudentManagement /></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute menu="Class Management" permissions={["class.view", "class.read"]}><ClassManagement /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute menu="Approval"><ApprovalManagement /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute menu="Attendance" permissions={["attendance.view", "attendance.read"]}><ModulePlaceholder title="Attendance" /></ProtectedRoute>} />
            <Route path="/absence" element={<ProtectedRoute menu="Absence" permissions={["absence.view", "absence.read"]}><ModulePlaceholder title="Absence" /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute menu="Report" permissions={["report.view", "report.read"]}><ModulePlaceholder title="Report" /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute menu="Setting" permissions={["setting.view", "setting.read"]}><ModulePlaceholder title="Setting" /></ProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}
