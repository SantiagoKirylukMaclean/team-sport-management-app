import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import type { AppError } from '@/lib/error-handling'

interface ErrorDisplayProps {
  error: AppError | string
  onRetry?: () => void
  title?: string
  className?: string
  showDetails?: boolean
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title = 'Error',
  className,
  showDetails = false
}) => {
  const errorObj = typeof error === 'string' 
    ? { message: error, isRetryable: true } 
    : error

  return (
    <Card className={`border-destructive ${className || ''}`}>
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{errorObj.message}</p>
        
        {showDetails && 'details' in errorObj && errorObj.details && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Detalles técnicos
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {errorObj.details}
            </pre>
          </details>
        )}
        
        {showDetails && 'code' in errorObj && errorObj.code && (
          <p className="text-xs text-muted-foreground">
            Código de error: {errorObj.code}
          </p>
        )}
        
        <div className="flex gap-2">
          {onRetry && errorObj.isRetryable && (
            <Button onClick={onRetry} variant="outline">
              Reintentar
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Recargar página
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ErrorDisplay