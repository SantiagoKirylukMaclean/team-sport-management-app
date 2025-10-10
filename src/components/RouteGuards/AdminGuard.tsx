import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/loading-spinner'
import ErrorDisplay from '../ui/error-display'
import { createPermissionError } from '../../lib/error-handling'

/**
 * AdminGuard component that protects admin routes
 * Only allows access to users with 'super_admin' role
 * Redirects unauthorized users to home page
 */
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading, error, clearError, refreshProfile } = useAuth()

  // Show loading spinner while role is being determined
  if (loading || (user && role === null && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Verificando permisos..." />
      </div>
    )
  }

  // Show error if there's an authentication error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorDisplay
            error={error}
            title="Error de autenticación"
            onRetry={() => {
              clearError()
              if (user?.id) {
                refreshProfile()
              }
            }}
            showDetails={true}
          />
        </div>
      </div>
    )
  }

  // Redirect to login if no user
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Show permission error if user doesn't have super_admin role
  if (role !== 'super_admin') {
    const permissionError = createPermissionError(
      'Necesitas permisos de super administrador para acceder a esta sección.'
    )
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorDisplay
            error={permissionError}
            title="Acceso denegado"
            onRetry={() => window.location.href = '/'}
          />
        </div>
      </div>
    )
  }

  // Render children for authorized super_admin users
  return <>{children}</>
}

export default AdminGuard