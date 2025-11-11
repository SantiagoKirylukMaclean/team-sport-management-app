import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface PlayerGuardProps {
  children: React.ReactNode
}

/**
 * Route guard that only allows players to access the wrapped routes
 */
export default function PlayerGuard({ children }: PlayerGuardProps) {
  const { user, role, loading } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to dashboard if not a player
  if (role !== 'player') {
    return <Navigate to="/dashboard" replace />
  }

  // User is authenticated and is a player, render children
  return <>{children}</>
}
