import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { supabase } from './lib/supabase'
import SplashScreen from './components/SplashScreen'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import AthletesPage from './pages/AthletesPage'
import TrainersPage from './pages/TrainersPage'
import AcademiesPage from './pages/AcademiesPage'
import TrainingsPage from './pages/TrainingsPage'
import StockPage from './pages/StockPage'
import ReportsPage from './pages/ReportsPage'
import ApprovalsPage from './pages/ApprovalsPage'
import ProfilePage from './pages/ProfilePage'
import ProductsPage from './pages/ProductsPage'
import SchedulesPage from './pages/SchedulesPage'
import PaymentsPage from './pages/PaymentsPage'

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: string[]
}) {
  const { isAuthenticated, user } = useStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { isAuthenticated, loadGymDataFromSupabase } = useStore()
  const [showSplash, setShowSplash] = useState(true)
  const [hasSeenSplash, setHasSeenSplash] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('magmanage_splash_seen')

    if (seen) {
      setShowSplash(false)
      setHasSeenSplash(true)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    let refreshTimer: ReturnType<typeof window.setTimeout> | null = null

    const refreshGymData = () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer)
      }

      refreshTimer = window.setTimeout(() => {
        loadGymDataFromSupabase()
      }, 300)
    }

    loadGymDataFromSupabase()

    const channel = supabase
      .channel('magmanage-gym-data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'membros' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'treinos' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'usuarios' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'academias' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pending_registrations' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'password_reset_requests' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produtos' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movimentos_estoque' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pagamentos' },
        refreshGymData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos_produtos' },
        refreshGymData
      )
      .subscribe()

    return () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer)
      }

      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, loadGymDataFromSupabase])

  const handleSplashComplete = () => {
    setShowSplash(false)
    setHasSeenSplash(true)
    sessionStorage.setItem('magmanage_splash_seen', 'true')
  }

  if (showSplash && !hasSeenSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      <Route
        path="/registro"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Todos os usuários autenticados podem ver o dashboard */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={['gestor', 'treinador', 'atleta']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Gestor vê todos os atletas; treinador vê só atletas da sua modalidade */}
        <Route
          path="atletas"
          element={
            <ProtectedRoute allowedRoles={['gestor', 'treinador']}>
              <AthletesPage />
            </ProtectedRoute>
          }
        />

        {/* Apenas gestor gere treinadores */}
        <Route
          path="treinadores"
          element={
            <ProtectedRoute allowedRoles={['gestor']}>
              <TrainersPage />
            </ProtectedRoute>
          }
        />

        {/* Gestor e treinador gerem treinos; atleta usa Horários */}
        <Route
          path="academias"
          element={
            <ProtectedRoute allowedRoles={['gestor']}>
              <AcademiesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="treinos"
          element={
            <ProtectedRoute allowedRoles={['gestor', 'treinador']}>
              <TrainingsPage />
            </ProtectedRoute>
          }
        />

        {/* Apenas atleta vê horários */}
        <Route
          path="horarios"
          element={
            <ProtectedRoute allowedRoles={['atleta']}>
              <SchedulesPage />
            </ProtectedRoute>
          }
        />

        {/* Apenas atleta vê produtos */}
        <Route
          path="produtos"
          element={
            <ProtectedRoute allowedRoles={['atleta']}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />

        {/* Apenas gestor gere estoque */}
        <Route
          path="estoque"
          element={
            <ProtectedRoute allowedRoles={['gestor']}>
              <StockPage />
            </ProtectedRoute>
          }
        />

        {/* Apenas gestor vê relatórios */}
        <Route
          path="relatorios"
          element={
            <ProtectedRoute allowedRoles={['gestor']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Gestor gere pagamentos; atleta vê/enviar comprovativo */}
        <Route
          path="pagamentos"
          element={
            <ProtectedRoute allowedRoles={['gestor', 'atleta']}>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />

        {/* Apenas gestor aprova usuários */}
        <Route
          path="aprovacoes"
          element={
            <ProtectedRoute allowedRoles={['gestor']}>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />

        {/* Todos podem editar/ver o próprio perfil */}
        <Route
          path="perfil"
          element={
            <ProtectedRoute allowedRoles={['gestor', 'treinador', 'atleta']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
