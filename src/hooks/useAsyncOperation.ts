import { useState, useCallback } from 'react'
import { mapSupabaseError, logError, shouldRetry, type AppError } from '@/lib/error-handling'

interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: AppError | null
  retryCount: number
}

interface UseAsyncOperationReturn<T> {
  data: T | null
  loading: boolean
  error: AppError | null
  execute: () => Promise<void>
  retry: () => Promise<void>
  reset: () => void
  canRetry: boolean
}

/**
 * Hook for managing async operations with consistent error handling and retry logic
 */
export const useAsyncOperation = <T>(
  operation: () => Promise<T>,
  context?: string
): UseAsyncOperationReturn<T> => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  })

  const execute = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }))

    try {
      const result = await operation()
      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null
      }))
    } catch (error: any) {
      const appError = mapSupabaseError(error)
      logError(appError, context)
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
        retryCount: prev.retryCount + 1
      }))
    }
  }, [operation, context])

  const retry = useCallback(async () => {
    if (state.error && shouldRetry(state.error, state.retryCount)) {
      await execute()
    }
  }, [execute, state.error, state.retryCount])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0
    })
  }, [])

  const canRetry = state.error ? shouldRetry(state.error, state.retryCount) : false

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    retry,
    reset,
    canRetry
  }
}