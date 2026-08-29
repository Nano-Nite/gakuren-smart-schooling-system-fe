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
import AppLayout from './components/AppLayout'
import Profile from './pages/Profile'
import SignUp from './pages/SignUp'
import ModulePlaceholder from './pages/ModulePlaceholder'
import { getDefaultAuthorizedRoute } from './utils/permissions'
import { isNetworkAvailable, isUserAuthenticated, setNetworkAvailable } from './utils/api'
import { getMenuItems, hasAnyPermission } from './utils/permissions'
import AccessDenied from './pages/AccessDenied'
import OfflineUnavailable from './pages/OfflineUnavailable'

const OFFLINE_MENU_ACCESS = new Set(['QR Code', 'Report', 'Setting'])

function ProtectedRoute({ children, permissions, menu }) {
  const [online, setOnline] = useState(isNetworkAvailable())

  useEffect(() => {
    const updateConnection = () => { setNetworkAvailable(navigator.onLine); setOnline(navigator.onLine) }
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
  return <Navigate to={isUserAuthenticated() ? getDefaultAuthorizedRoute() : "/"} replace />
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<ProtectedRoute menu="Dashboard" permissions={["dashboard.view", "dashboard.read"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/qr-code" element={<ProtectedRoute menu="QR Code" permissions={["qrcode.view", "qrcode.read"]}><QrCodeManagement /></ProtectedRoute>} />
            <Route path="/teachers" element={<ProtectedRoute menu="Teacher and Staff" permissions={["teacherandstaff.view", "teacherandstaff.read"]}><TeacherStaffManagement /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute menu="Student Management" permissions={["student.view", "student.read"]}><StudentManagement /></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute menu="Class Management" permissions={["class.view", "class.read"]}><ClassManagement /></ProtectedRoute>} />
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
