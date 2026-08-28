import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClassManagement from './pages/ClassManagement'
import AppLayout from './components/AppLayout'
import Profile from './pages/Profile'
import SignUp from './pages/SignUp'
import ModulePlaceholder from './pages/ModulePlaceholder'
import { getDefaultAuthorizedRoute } from './utils/permissions'
import { isUserAuthenticated } from './utils/api'
import { getMenuItems, hasAnyPermission } from './utils/permissions'
import AccessDenied from './pages/AccessDenied'

function ProtectedRoute({ children, permissions, menu }) {
  if (!isUserAuthenticated()) return <Navigate to="/login" />
  if (menu && !getMenuItems().includes(menu)) return <Navigate to="/" replace />
  if (permissions?.length && !hasAnyPermission(permissions)) return <AccessDenied menu={menu} />
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
            <Route path="/qr-code" element={<ProtectedRoute menu="QR Code" permissions={["qrcode.view", "qrcode.read"]}><ModulePlaceholder title="QR Code" /></ProtectedRoute>} />
            <Route path="/teachers" element={<ProtectedRoute menu="Teacher and Staff" permissions={["teacherandstaff.view", "teacherandstaff.read"]}><ModulePlaceholder title="Teacher and Staff" /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute menu="Student Management" permissions={["student.view", "student.read"]}><ModulePlaceholder title="Student Management" /></ProtectedRoute>} />
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
