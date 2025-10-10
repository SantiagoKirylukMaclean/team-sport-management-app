import React, { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Team } from '@/types/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'
import PageLoading from '@/components/ui/page-loading'
import ErrorDisplay from '@/components/ui/error-display'
import EmptyState from '@/components/ui/empty-state'

interface TeamsData {
  teams: Team[]
  hasMore: boolean
}

// Move fetch functions outside component to prevent recreation
const fetchTeamsWithJoin = async (): Promise<{ data: Team[] | null; error: any; count: number | null }> => {
  try {
    const { data, error, count } = await supabase
      .from('teams')
      .select('id, name, created_at, club_id, clubs(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(25)

    // Transform the data to match our Team interface
    const transformedData = data?.map(team => ({
      ...team,
      clubs: Array.isArray(team.clubs) && team.clubs.length > 0 
        ? { name: team.clubs[0].name }
        : undefined
    })) || null

    return { data: transformedData, error, count }
  } catch (error) {
    return { data: null, error, count: null }
  }
}

const fetchTeamsWithFallback = async (): Promise<{ data: Team[] | null; error: any; count: number | null }> => {
  try {
    // First, fetch teams without joins
    const { data: teamsData, error: teamsError, count } = await supabase
      .from('teams')
      .select('id, name, created_at, club_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(25)

    if (teamsError || !teamsData) {
      return { data: null, error: teamsError, count: null }
    }

    // Get unique club IDs
    const clubIds = [...new Set(teamsData.map(team => team.club_id))]

    // Fetch clubs data separately
    const { data: clubsData, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name')
      .in('id', clubIds)

    if (clubsError) {
      console.warn('Failed to fetch clubs data for mapping:', clubsError)
      // Return teams without club names
      return { data: teamsData, error: null, count }
    }

    // Create a map of club_id to club name
    const clubsMap = new Map(clubsData?.map(club => [club.id, club.name]) || [])

    // Map club names to teams
    const teamsWithClubs: Team[] = teamsData.map(team => ({
      ...team,
      clubs: clubsMap.has(team.club_id) 
        ? { name: clubsMap.get(team.club_id)! }
        : undefined
    }))

    return { data: teamsWithClubs, error: null, count }
  } catch (error) {
    return { data: null, error, count: null }
  }
}

const fetchTeams = async (): Promise<TeamsData> => {
  // First, try to fetch with joins
  let result = await fetchTeamsWithJoin()

  // If join query fails, fall back to separate queries
  if (result.error) {
    console.warn('Join query failed, falling back to separate queries:', result.error)
    result = await fetchTeamsWithFallback()
  }

  if (result.error) {
    throw result.error
  }

  return {
    teams: result.data || [],
    hasMore: (result.count || 0) > 25
  }
}

const TeamsPage: React.FC = () => {
  const {
    data,
    loading,
    error,
    execute,
    retry,
    canRetry
  } = useAsyncOperation(fetchTeams, 'TeamsPage')

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
        title="Equipos"
        description="Gestión de equipos del sistema"
        message="Cargando equipos..."
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
          <p className="text-muted-foreground">
            Gestión de equipos del sistema
          </p>
        </div>
        
        <ErrorDisplay
          error={error}
          title="Error al cargar equipos"
          onRetry={canRetry ? retry : undefined}
          showDetails={true}
        />
      </div>
    )
  }

  if (!data || data.teams.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
          <p className="text-muted-foreground">
            Gestión de equipos del sistema
          </p>
        </div>
        
        <EmptyState
          icon="⚽"
          title="No hay equipos registrados"
          description="Aún no se han registrado equipos en el sistema."
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
          <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
          <p className="text-muted-foreground">
            Gestión de equipos del sistema ({data.teams.length} equipos)
          </p>
        </div>
        <Button onClick={execute} variant="outline" size="sm">
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {data.teams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{team.name}</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      ID: {team.id}
                    </p>
                    {team.clubs?.name ? (
                      <p className="text-sm text-blue-600 font-medium">
                        Club: {team.clubs.name}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Club: {team.club_id}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">Creado</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(team.created_at)}
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
                Mostrando los primeros 25 equipos
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

export default TeamsPage