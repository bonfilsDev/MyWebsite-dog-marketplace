import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './Loading'

export function ProtectedRoute({ children, roles }) {
  const { user, role, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Checking your account" />

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  if (roles?.length && !roles.includes(role)) {
    return <Navigate to={isAdmin ? '/admin' : role === 'seller' ? '/dashboard' : '/'} replace />
  }

  return children
}
