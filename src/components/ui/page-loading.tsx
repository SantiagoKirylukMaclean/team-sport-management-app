import React from 'react'
import LoadingSpinner from './loading-spinner'

interface PageLoadingProps {
  title: string
  description?: string
  message?: string
}

const PageLoading: React.FC<PageLoadingProps> = ({
  title,
  description,
  message = 'Cargando...'
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  )
}

export default PageLoading