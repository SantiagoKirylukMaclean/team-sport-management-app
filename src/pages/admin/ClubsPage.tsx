import React, { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Club } from '@/types/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'
import PageLoading from '@/components/ui/page-loading'
import ErrorDisplay from '@/components/ui/error-display'
import EmptyState from '@/components/ui/empty-state'

interface ClubsData {
  clubs: Club[]
  hasMore: boolean
}

// Move fetch functions outside component to prevent recreation
const fetchClubsWithJoin = async (): Promise<{ data: Club[] | null; error: any; count: number | null }> => {
  try {
    const { data, error, count } = await supabase
      .from('clubs')
      .select('id, name, created_at, sport_id, sports(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(25)

    // Transform the data to match our Club interface
    const transformedData = data?.map(club => ({
      ...club,
      sports: Array.isArray(club.sports) && club.sports.length > 0 
        ? { name: club.sports[0].name }
        : undefined
    })) || null

    return { data: transformedData, error, count }
  } catch (error) {
    return { data: null, error, count: null }
  }
}

const fetchClubsWithFallback = async (): Promise<{ data: Club[] | null; error: any; count: number | null }> => {
  try {
    // First, fetch clubs without joins
    const { data: clubsData, error: clubsError, count } = await supabase
      .from('clubs')
      .select('id, name, created_at, sport_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(25)

    if (clubsError || !clubsData) {
      return { data: null, error: clubsError, count: null }
    }

    // Get unique sport IDs
    const sportIds = [...new Set(clubsData.map(club => club.sport_id))]

    // Fetch sports data separately
    const { data: sportsData, error: sportsError } = await supabase
      .from('sports')
      .select('id, name')
      .in('id', sportIds)

    if (sportsError) {
      console.warn('Failed to fetch sports data for mapping:', sportsError)
      // Return clubs without sport names
      return { data: clubsData, error: null, count }
    }

    // Create a map of sport_id to sport name
    const sportsMap = new Map(sportsData?.map(sport => [sport.id, sport.name]) || [])

    // Map sport names to clubs
    const clubsWithSports: Club[] = clubsData.map(club => ({
      ...club,
      sports: sportsMap.has(club.sport_id) 
        ? { name: sportsMap.get(club.sport_id)! }
        : undefined
    }))

    return { data: clubsWithSports, error: null, count }
  } catch (error) {
    return { data: null, error, count: null }
  }
}

const fetchClubs = async (): Promise<ClubsData> => {
  // First, try to fetch with joins
  let result = await fetchClubsWithJoin()

  // If join query fails, fall back to separate queries
  if (result.error) {
    console.warn('Join query failed, falling back to separate queries:', result.error)
    result = await fetchClubsWithFallback()
  }

  if (result.error) {
    throw result.error
  }

  return {
    clubs: result.data || [],
    hasMore: (result.count || 0) > 25
  }
}

const ClubsPage: React.FC = () => {
  const {
    data,
    loading,
    error,
    execute,
    retry,
    canRetry
  } = useAsyncOperation(fetchClubs, 'ClubsPage')

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
        title="Clubes"
        description="Gestión de clubes del sistema"
        message="Cargando clubes..."
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clubes</h1>
          <p className="text-muted-foreground">
            Gestión de clubes del sistema
          </p>
        </div>
        
        <ErrorDisplay
          error={error}
          title="Error al cargar clubes"
          onRetry={canRetry ? retry : undefined}
          showDetails={true}
        />
      </div>
    )
  }

  if (!data || data.clubs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clubes</h1>
          <p className="text-muted-foreground">
            Gestión de clubes del sistema
          </p>
        </div>
        
        <EmptyState
          icon="🏟️"
          title="No hay clubes registrados"
          description="Aún no se han registrado clubes en el sistema."
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
          <h1 className="text-3xl font-bold tracking-tight">Clubes</h1>
          <p className="text-muted-foreground">
            Gestión de clubes del sistema ({data.clubs.length} clubes)
          </p>
        </div>
        <Button onClick={execute} variant="outline" size="sm">
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {data.clubs.map((club) => (
          <Card key={club.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{club.name}</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      ID: {club.id}
                    </p>
                    {club.sports?.name ? (
                      <p className="text-sm text-blue-600 font-medium">
                        Deporte: {club.sports.name}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Deporte: {club.sport_id}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">Creado</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(club.created_at)}
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
                Mostrando los primeros 25 clubes
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

export default ClubsPage