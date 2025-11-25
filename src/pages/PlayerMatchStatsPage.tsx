import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamPlayerStatistics, type PlayerStatistics } from '@/services/statistics'
import { listCoachTeams, type Team } from '@/services/teams'

export default function PlayerMatchStatsPage() {
  const { toast } = useToast()
  const { role, user } = useAuth()
  const navigate = useNavigate()

  // State
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStatistics[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)

  // Load teams on mount
  useEffect(() => {
    loadTeams()
  }, [])

  // Load stats when team changes
  useEffect(() => {
    if (selectedTeamId) {
      loadStats()
    } else {
      setPlayerStats([])
    }
  }, [selectedTeamId])

  const loadTeams = async () => {
    try {
      const result = await listCoachTeams()

      if (result.error) {
        throw result.error
      }

      setTeams(result.data || [])

      // Auto-select first team if available
      if (result.data && result.data.length > 0) {
        setSelectedTeamId(result.data[0].id)
      }
    } catch (err: any) {
      const error = err as Error
      toast({
        title: "Error",
        description: `Error al cargar equipos: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!selectedTeamId) return

    setStatsLoading(true)
    try {
      const result = await getTeamPlayerStatistics(selectedTeamId)

      if (result.error) {
        throw result.error
      }

      let stats = result.data || []

      // Si es jugador, filtrar solo sus estadísticas
      if (role === 'player' && user) {
        stats = stats.filter((s: PlayerStatistics) => s.player_id.toString() === user.id)
      }

      setPlayerStats(stats)
    } catch (err: any) {
      const error = err as Error
      toast({
        title: "Error",
        description: `Error al cargar estadísticas: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const handlePlayerClick = (playerId: number) => {
    // Navegar a detalle del jugador (puedes crear esta página después)
    navigate(`/coach/players/${playerId}`)
  }

  const getPeriodsPercentage = (avgPeriods: number) => {
    // Calcular porcentaje basado en 4 períodos máximos
    return Math.min((avgPeriods / 4) * 100, 100)
  }

  const getPeriodsColor = (avgPeriods: number) => {
    const pct = getPeriodsPercentage(avgPeriods)
    if (pct >= 75) return 'text-green-600'
    if (pct >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando equipos...</p>
        </div>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Partidos</h1>
          <p className="text-muted-foreground">
            Visualizá el rendimiento de los jugadores en partidos
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenés equipos asignados</h3>
            <p className="text-muted-foreground text-center">
              Contactá al administrador para que te asigne equipos.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Partidos</h1>
        <p className="text-muted-foreground">
          Visualizá el porcentaje de cuartos jugados por cada jugador
        </p>
      </div>

      {role !== 'player' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Seleccionar Equipo</CardTitle>
                <CardDescription>
                  Elegí el equipo para ver sus estadísticas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedTeamId?.toString() || ''}
              onValueChange={(value) => setSelectedTeamId(parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Seleccionar equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedTeamId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rendimiento en Partidos - {selectedTeam?.name}
                </CardTitle>
                <CardDescription>
                  Promedio de cuartos jugados por jugador
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                <span className="text-muted-foreground">Cargando estadísticas...</span>
              </div>
            ) : playerStats.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
                <p className="text-muted-foreground">
                  No hay estadísticas de partidos para este equipo aún.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">Número</TableHead>
                    <TableHead className="text-center">Partidos Convocados</TableHead>
                    <TableHead className="text-center">Prom. Cuartos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerStats
                    .sort((a, b) => b.avg_periods_played - a.avg_periods_played)
                    .map((stat) => {
                      const periodsPercentage = getPeriodsPercentage(stat.avg_periods_played)
                      return (
                        <TableRow
                          key={stat.player_id}
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => handlePlayerClick(stat.player_id)}
                        >
                          <TableCell className="font-medium">
                            {stat.full_name}
                          </TableCell>
                          <TableCell className="text-center">
                            {stat.jersey_number ? (
                              <Badge variant="outline">#{stat.jersey_number}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-center">
                              <span className="font-medium">
                                {stat.matches_called_up} de {stat.total_matches}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {stat.match_attendance_pct}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-3">
                              <span className={`font-bold text-lg ${getPeriodsColor(stat.avg_periods_played)}`}>
                                {stat.avg_periods_played}
                              </span>
                              <Progress value={periodsPercentage} className="flex-1 max-w-[200px]" />
                              <span className={`text-sm font-medium min-w-[3rem] ${getPeriodsColor(stat.avg_periods_played)}`}>
                                {periodsPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
