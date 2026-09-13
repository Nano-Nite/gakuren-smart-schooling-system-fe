import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import Home from './pages/Home'
import Login from './pages/Login'
import AttendanceScan from './pages/AttendanceScan'
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
import SubmenuPage, { SubmenuContent } from './pages/SubmenuPage'
import { getDefaultAuthorizedRoute } from './utils/permissions'
import { initializeAuth, isNetworkAvailable, isUserAuthenticated, setNetworkAvailable } from './utils/api'
import { getMenuItems, getMenuPermissions, hasAnyPermission, hasMenuAccess, hasChildMenuAccess, CHILD_MENUS, MENU_ROUTES } from './utils/permissions'
import AccessDenied from './pages/AccessDenied'
import OfflineUnavailable from './pages/OfflineUnavailable'
import SessionSplash from './components/SessionSplash'
import { LoginSplashProvider } from './context/LoginSplashContext'
import { withMinimumDuration } from './utils/withMinimumDuration'

const OFFLINE_MENU_ACCESS = new Set(['QR Code', 'Report', 'Setting'])

function ProtectedRoute({ children, permissions, menu, child }) {
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
  if (child ? !hasChildMenuAccess(menu, child) : menu && !hasMenuAccess(menu)) return <AccessDenied menu={child || menu} />
  if (permissions?.length && !hasAnyPermission(permissions, getMenuPermissions(menu))) return <AccessDenied menu={menu} />
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
    withMinimumDuration(() => initializeAuth(), 650).catch(error => {
      if (active) setRestoreError(error.message || 'Tidak dapat memulihkan sesi.')
    }).finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [attempt])

  if (!ready || restoreError) return <SessionSplash
    failed={ready && Boolean(restoreError)}
    onRetry={() => { setReady(false); setRestoreError(''); setAttempt(value => value + 1) }}
    onLogin={() => { window.history.replaceState(null, '', '/login'); setRestoreError('') }}
  />

  return (
    <HelmetProvider>
      <BrowserRouter>
        <LoginSplashProvider>
        <Routes>
          <Route path="/" element={<HomeOrInstalledApp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/attendance/scan" element={<AttendanceScan />} />
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
            {Object.entries(CHILD_MENUS).map(([parent, children]) => (
              <Route key={parent} path={MENU_ROUTES[parent]} element={<SubmenuPage parent={parent} />}>
                <Route index element={<ProtectedRoute menu={parent}><SubmenuContent parent={parent} /></ProtectedRoute>} />
                {Object.entries(children).map(([child, config]) => (
                  <Route key={child} path={config.route} element={<ProtectedRoute menu={parent} child={child}><SubmenuContent parent={parent} child={child} /></ProtectedRoute>} />
                ))}
              </Route>
            ))}
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
        </LoginSplashProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}
