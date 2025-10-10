import React, { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Sport } from '@/types/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'
import PageLoading from '@/components/ui/page-loading'
import ErrorDisplay from '@/components/ui/error-display'
import EmptyState from '@/components/ui/empty-state'

interface SportsData {
  sports: Sport[]
  hasMore: boolean
}

// Move fetchSports outside component to prevent recreation
const fetchSports = async (): Promise<SportsData> => {
  const { data, error, count } = await supabase
    .from('sports')
    .select('id, name, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(25)

  if (error) {
    throw error
  }

  return {
    sports: data || [],
    hasMore: (count || 0) > 25
  }
}

const SportsPage: React.FC = () => {
  const {
    data,
    loading,
    error,
    execute,
    retry,
    canRetry
  } = useAsyncOperation(fetchSports, 'SportsPage')

  useEffect(() => {
    execute()
  }, [execute])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <PageLoading
        title="Deportes"
        description="Gestión de deportes del sistema"
        message="Cargando deportes..."
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deportes</h1>
          <p className="text-muted-foreground">
            Gestión de deportes del sistema
          </p>
        </div>
        
        <ErrorDisplay
          error={error}
          title="Error al cargar deportes"
          onRetry={canRetry ? retry : undefined}
          showDetails={true}
        />
      </div>
    )
  }

  if (!data || data.sports.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deportes</h1>
          <p className="text-muted-foreground">
            Gestión de deportes del sistema
          </p>
        </div>
        
        <EmptyState
          icon="🏆"
          title="No hay deportes registrados"
          description="Aún no se han registrado deportes en el sistema."
          actionLabel="Actualizar"
          onAction={execute}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deportes</h1>
          <p className="text-muted-foreground">
            Gestión de deportes del sistema ({data.sports.length} deportes)
          </p>
        </div>
        <Button onClick={execute} variant="outline" size="sm">
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {data.sports.map((sport) => (
          <Card key={sport.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{sport.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {sport.id}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">Creado</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(sport.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.hasMore && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Mostrando los primeros 25 deportes
              </p>
              <p className="text-xs text-muted-foreground">
                La paginación completa se implementará en futuras versiones
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SportsPage