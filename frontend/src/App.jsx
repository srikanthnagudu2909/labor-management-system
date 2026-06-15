import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import Dashboard from './components/pages/Dashboard'
import Labors from './components/pages/Labors'
import AddLabor from './components/pages/AddLabor'
import Attendance from './components/pages/Attendance'
import CalendarPage from './components/pages/CalendarPage'
import Advances from './components/pages/Advances'
import Payments from './components/pages/Payments'
import Reports from './components/pages/Reports'
import LaborProfile from './components/pages/LaborProfile'
import Settings from './components/pages/Settings'
import Salary from './components/pages/Salary'

function ProtectedRoute({ children, title }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <Layout title={title}>{children}</Layout>
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { fontFamily: 'Inter, sans-serif', fontSize: 13.5 } }} />
        <Routes>
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/"         element={<ProtectedRoute title="Dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="/labors"   element={<ProtectedRoute title="Labors"><Labors /></ProtectedRoute>} />
          <Route path="/add-labor"element={<ProtectedRoute title="Add Labor"><AddLabor /></ProtectedRoute>} />
          <Route path="/labors/edit/:id" element={<ProtectedRoute title="Edit Labor"><AddLabor /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute title="Attendance"><Attendance /></ProtectedRoute>} />
          <Route path="/calendar"   element={<ProtectedRoute title="Calendar"><CalendarPage /></ProtectedRoute>} />
          <Route path="/advances"   element={<ProtectedRoute title="Advances"><Advances /></ProtectedRoute>} />
          <Route path="/payments"   element={<ProtectedRoute title="Payments"><Payments /></ProtectedRoute>} />
          <Route path="/salary"     element={<ProtectedRoute title="Salary"><Salary /></ProtectedRoute>} />
          <Route path="/reports"    element={<ProtectedRoute title="Reports"><Reports /></ProtectedRoute>} />
          <Route path="/profile"    element={<ProtectedRoute title="Labor Profile"><LaborProfile /></ProtectedRoute>} />
          <Route path="/profile/:id"element={<ProtectedRoute title="Labor Profile"><LaborProfile /></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute title="Settings"><Settings /></ProtectedRoute>} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
