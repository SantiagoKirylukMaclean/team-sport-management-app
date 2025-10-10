import React from 'react'
import { Card, CardContent } from './card'
import { Button } from './button'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-6xl text-muted-foreground">{icon}</div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default EmptyState