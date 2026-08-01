import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { useAuth } from './hooks/useAuth'
import ErrorBoundary from './components/common/ErrorBoundary'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Login from './pages/Login'
import InternPortal from './pages/InternPortal'
import UniversityPortal from './pages/UniversityPortal'
import StartupPortal from './pages/StartupPortal'
import AdminPortal from './pages/AdminPortal'

const PORTALS = {
  intern: InternPortal,
  university: UniversityPortal,
  startup: StartupPortal,
  admin: AdminPortal,
}

function Shell() {
  const { user, logout } = useAuth()
  const Portal = user ? PORTALS[user.role] : null
  const invalidRole = !!user && !Portal

  useEffect(() => {
    // Unrecognized role on the session (corrupted/stale localStorage, backend role change,
    // etc.) — sign out instead of white-screening the whole app.
    if (invalidRole) logout()
  }, [invalidRole, logout])

  if (!user || invalidRole) return <Login />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 fade-in">
        <Portal user={user} />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
