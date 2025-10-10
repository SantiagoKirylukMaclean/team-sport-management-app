/**
 * Error handling utilities for consistent error management across the application
 */

import { PostgrestError } from '@supabase/supabase-js'

export interface AppError {
  message: string
  code?: string
  details?: string
  isRetryable: boolean
}

/**
 * Maps Supabase errors to user-friendly messages
 */
export const mapSupabaseError = (error: PostgrestError | Error): AppError => {
  // Handle network errors
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return {
      message: 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.',
      code: 'NETWORK_ERROR',
      isRetryable: true
    }
  }

  // Handle Supabase specific errors
  if ('code' in error) {
    const postgrestError = error as PostgrestError
    
    switch (postgrestError.code) {
      case 'PGRST116':
        return {
          message: 'No se encontraron datos. Es posible que no tengas permisos para acceder a esta información.',
          code: postgrestError.code,
          details: postgrestError.details,
          isRetryable: false
        }
      
      case 'PGRST301':
        return {
          message: 'Error de permisos. No tienes autorización para realizar esta acción.',
          code: postgrestError.code,
          details: postgrestError.details,
          isRetryable: false
        }
      
      case '42P01':
        return {
          message: 'Error de configuración de la base de datos. Contacta al administrador del sistema.',
          code: postgrestError.code,
          details: postgrestError.details,
          isRetryable: false
        }
      
      case '23503':
        return {
          message: 'Error de integridad de datos. Algunos datos relacionados no existen.',
          code: postgrestError.code,
          details: postgrestError.details,
          isRetryable: false
        }
      
      default:
        return {
          message: postgrestError.message || 'Error inesperado en la base de datos.',
          code: postgrestError.code,
          details: postgrestError.details,
          isRetryable: true
        }
    }
  }

  // Handle generic errors
  return {
    message: error.message || 'Error inesperado. Por favor, inténtalo de nuevo.',
    isRetryable: true
  }
}

/**
 * Creates a standardized error for authentication issues
 */
export const createAuthError = (message?: string): AppError => ({
  message: message || 'Error de autenticación. Por favor, inicia sesión nuevamente.',
  code: 'AUTH_ERROR',
  isRetryable: false
})

/**
 * Creates a standardized error for permission issues
 */
export const createPermissionError = (message?: string): AppError => ({
  message: message || 'No tienes permisos para acceder a esta funcionalidad.',
  code: 'PERMISSION_ERROR',
  isRetryable: false
})

/**
 * Creates a standardized error for loading failures
 */
export const createLoadingError = (resource: string): AppError => ({
  message: `Error al cargar ${resource}. Por favor, inténtalo de nuevo.`,
  code: 'LOADING_ERROR',
  isRetryable: true
})

/**
 * Logs errors consistently across the application
 */
export const logError = (error: Error | AppError, context?: string) => {
  const errorInfo = {
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
    ...(('code' in error) && { code: error.code }),
    ...(('details' in error) && { details: error.details }),
    ...(('stack' in error) && { stack: error.stack })
  }
  
  console.error('Application Error:', errorInfo)
}

/**
 * Determines if an error should trigger a retry mechanism
 */
export const shouldRetry = (error: AppError, retryCount: number = 0): boolean => {
  return error.isRetryable && retryCount < 3
}