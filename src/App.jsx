import React, { useEffect, useRef, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Home } from './pages/Home.jsx'
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx'
import { AdminMenu } from './pages/admin/AdminMenu.jsx'
import { AdminCredentials } from './pages/admin/AdminCredentials.jsx'
import { AdminManageFaculty } from './pages/admin/AdminManageFaculty.jsx'
import { AdminManageLanding } from './pages/admin/AdminManageLanding.jsx'
import { AdminAddFaculty } from './pages/admin/AdminAddFaculty.jsx'
import { AdminRemoveFaculty } from './pages/admin/AdminRemoveFaculty.jsx'
import { AdminHistory } from './pages/admin/AdminHistory.jsx'
import { AdminBatchView } from './pages/admin/AdminBatchView.jsx'
import { AdminScheduleHistory } from './pages/admin/AdminScheduleHistory.jsx'
import { AdminScheduleDayView } from './pages/admin/AdminScheduleDayView.jsx'
import { FacultyPortal } from './pages/faculty/FacultyPortal.jsx'
import { AdminRequests } from './pages/admin/AdminRequests.jsx'
import { Login } from './pages/auth/Login.jsx'
import { useAuth } from './context/AuthContext.jsx'

export default function App() {
  const [refreshing, setRefreshing] = useState(false)
  const [pendingReqs, setPendingReqs] = useState(0)
  const touchStartYRef = useRef(0)
  const pullingRef = useRef(false)
  const THRESHOLD = 70

  useEffect(() => {
    function onTouchStart(e) {
      if (window.scrollY === 0) {
        touchStartYRef.current = e.touches?.[0]?.clientY || 0
        pullingRef.current = true
      } else {
        pullingRef.current = false
      }
    }
    function onTouchMove(e) {
      if (!pullingRef.current) return
      const y = e.touches?.[0]?.clientY || 0
      const dist = y - touchStartYRef.current
      if (dist > THRESHOLD && !refreshing) {
        pullingRef.current = false
        setRefreshing(true)
        setTimeout(() => window.location.reload(), 50)
      }
    }
    function onTouchEnd() { pullingRef.current = false }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [refreshing])
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const showNav = location.pathname !== '/'
  const isAuth = location.pathname.startsWith('/auth')
  const isFacultyAuth = location.pathname.startsWith('/auth/faculty')
  const isFacultySection = isFacultyAuth || location.pathname.startsWith('/faculty')
  const pathRole = location.pathname.includes('/faculty') ? 'faculty' : (location.pathname.includes('/admin') ? 'admin' : null)
  const navRole = user?.role || pathRole

  // Poll pending requests count for admin
  useEffect(() => {
    let id
    async function tick(){
      try {
        if ((user?.role || pathRole) !== 'admin') { setPendingReqs(0); return }
        // Use authenticated API to avoid 401
        const { api } = await import('./lib/api')
        const res = await api.adminRequests('pending')
        setPendingReqs(Array.isArray(res.requests) ? res.requests.length : 0)
      } catch { /* ignore */ }
    }
    tick()
    id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [user?.role, pathRole])

  function RequireRole({ role, children }) {
    if (!user) return <Navigate to={`/auth/${role}/login`} replace />
    if (user.role !== role) return <Navigate to={`/auth/${role}/login`} replace />
    return children
  }
  class ErrorBoundary extends React.Component {
    constructor(props){ super(props); this.state = { hasError:false, err:'' } }
    static getDerivedStateFromError(error){ return { hasError:true, err:String(error) } }
    componentDidCatch(error, info){ try { console.error('UI error:', error, info) } catch {} }
    render(){
      if (this.state.hasError) {
        return (
          <div className="p-6 max-w-3xl mx-auto text-center">
            <div className="mb-3 text-red-600 font-semibold">Something went wrong</div>
            <div className="text-sm text-gray-600 break-words">{this.state.err}</div>
            <button className="mt-4 px-4 py-2 rounded bg-blue-600 text-white" onClick={()=>window.location.reload()}>Reload</button>
          </div>
        )
      }
      return this.props.children
    }
  }
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-white text-gray-900">
      {refreshing && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded bg-blue-600 text-white text-sm shadow">Refreshing…</div>
      )}
      {showNav && (
        <nav className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur z-10">
          <div className="w-full flex items-center justify-between h-32 px-8 sm:px-14 lg:px-16">
            <Link to="/" className="font-semibold text-blue-600 text-5xl sm:text-6xl">Invigilator Allocation</Link>
            <div className="flex items-center gap-9 text-3xl sm:text-4xl">
              {navRole === 'admin' && !isFacultySection && (
                <Link to={user ? "/admin" : "/auth/admin/login"} className="hover:text-blue-600">Admin</Link>
              )}
              {navRole === 'admin' && user && !isFacultySection && (
                <Link to="/admin/requests" aria-label="Notifications" className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border hover:bg-blue-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 6 14h12a1 1 0 0 0 .707-1.707L18 11.586V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 2.824 2.995L12 22Z"/>
                  </svg>
                  {pendingReqs > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-xs grid place-items-center">{pendingReqs}</span>
                  )}
                </Link>
              )}
              {(navRole === 'faculty' || isFacultySection) && (
                <Link to={user ? "/faculty" : "/auth/faculty/login"} className="hover:text-blue-600">Faculty</Link>
              )}
              {!isFacultySection && (
                user ? (
                  <button onClick={()=>{ navigate('/'); setTimeout(()=>window.location.reload(), 0); }} className="px-8 py-4 rounded-md bg-red-600 text-white hover:bg-red-700">Logout</button>
                ) : (
                  <Link to={`/auth/${navRole || 'admin'}/login`} className="px-8 py-4 rounded-md bg-blue-600 text-white hover:bg-blue-700">Login</Link>
                )
              )}
              {isFacultySection && user && (
                <button onClick={()=>{ navigate('/'); setTimeout(()=>window.location.reload(), 0); }} className="px-8 py-4 rounded-md bg-red-600 text-white hover:bg-red-700">Logout</button>
              )}
            </div>
          </div>
        </nav>
      )}
      <main className={showNav ? (isAuth ? "w-full px-4 min-h-[calc(100vh-128px)] grid place-items-center" : "max-w-5xl mx-auto px-4 py-6") : "py-6"}>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/admin" element={<RequireRole role="admin"><AdminMenu /></RequireRole>} />
          <Route path="/admin/scheduling" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
          <Route path="/admin/credentials" element={<RequireRole role="admin"><AdminCredentials /></RequireRole>} />
          <Route path="/admin/manage" element={<RequireRole role="admin"><AdminManageLanding /></RequireRole>} />
          <Route path="/admin/manage/add" element={<RequireRole role="admin"><AdminAddFaculty /></RequireRole>} />
          <Route path="/admin/manage/remove" element={<RequireRole role="admin"><AdminRemoveFaculty /></RequireRole>} />
          <Route path="/admin/history" element={<RequireRole role="admin"><AdminHistory /></RequireRole>} />
          <Route path="/admin/history/:id" element={<RequireRole role="admin"><AdminBatchView /></RequireRole>} />
          <Route path="/admin/schedule-history" element={<RequireRole role="admin"><AdminScheduleHistory /></RequireRole>} />
          <Route path="/admin/schedule-history/:date" element={<RequireRole role="admin"><AdminScheduleDayView /></RequireRole>} />
          <Route path="/admin/requests" element={<RequireRole role="admin"><AdminRequests /></RequireRole>} />
          <Route path="/faculty" element={<RequireRole role="faculty"><FacultyPortal /></RequireRole>} />
          <Route path="/auth/:role/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
    </ErrorBoundary>
  )
}
