import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { listTeams, type Team } from '@/services/teams'
import {
  listMatches,
  listMatchQuarterResults,
  type Match,
  type MatchQuarterResult
} from '@/services/matches'
import {
  getTeamPlayerStatistics,
  getPlayerGoalStats,
  type PlayerStatistics
} from '@/services/statistics'
import { PartidosDetailDialog } from '@/pages/components/PartidosDetailDialog'
import { FileText, Trophy, TrendingUp, Target, Shield, Activity, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type MatchWithResult = Match & {
  result?: 'win' | 'draw' | 'loss' | null
  teamGoals?: number
  opponentGoals?: number
  quarterResults?: MatchQuarterResult[]
}

type PlayerStatsWithGoals = PlayerStatistics & {
  total_goals: number
  total_assists: number
}

type SortField = 'name' | 'attendance' | 'quarters' | 'goals' | 'assists'
type SortDirection = 'asc' | 'desc'

const Partidos: React.FC = () => {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [matches, setMatches] = useState<MatchWithResult[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailMatch, setDetailMatch] = useState<MatchWithResult | null>(null)

  // Player statistics state
  const [playerStats, setPlayerStats] = useState<PlayerStatsWithGoals[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      loadMatches()
      loadPlayerStatistics()
    }
  }, [selectedTeamId])

  const loadTeams = async () => {
    try {
      const { data, error } = await listTeams()
      if (error) throw error
      setTeams(data || [])
      if (data && data.length > 0) {
        setSelectedTeamId(data[0].id)
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al cargar equipos',
        variant: 'destructive'
      })
    }
  }

  const loadMatches = async () => {
    if (!selectedTeamId) return
    setLoading(true)
    try {
      const { data, error } = await listMatches(selectedTeamId)
      if (error) throw error

      // Cargar resultados para cada partido
      const matchesWithResults = await Promise.all(
        (data || []).map(async (match) => {
          const { data: quarters } = await listMatchQuarterResults(match.id)

          if (!quarters || quarters.length === 0) {
            return {
              ...match,
              result: null,
              teamGoals: undefined,
              opponentGoals: undefined,
              quarterResults: []
            }
          }

          // Calcular totales
          const totalTeamGoals = quarters.reduce((sum, q) => sum + q.team_goals, 0)
          const totalOpponentGoals = quarters.reduce((sum, q) => sum + q.opponent_goals, 0)

          let result: 'win' | 'draw' | 'loss' | null = null
          if (totalTeamGoals > totalOpponentGoals) {
            result = 'win'
          } else if (totalTeamGoals === totalOpponentGoals) {
            result = 'draw'
          } else {
            result = 'loss'
          }

          return {
            ...match,
            result,
            teamGoals: totalTeamGoals,
            opponentGoals: totalOpponentGoals,
            quarterResults: quarters
          }
        })
      )

      // Ordenar por fecha descendente (más reciente primero)
      const sortedData = matchesWithResults.sort((a, b) => {
        return new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
      })
      setMatches(sortedData)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al cargar partidos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPlayerStatistics = async () => {
    if (!selectedTeamId) return
    setStatsLoading(true)
    try {
      const [playerStatsRes, goalStatsRes] = await Promise.all([
        getTeamPlayerStatistics(selectedTeamId),
        getPlayerGoalStats(selectedTeamId)
      ])

      if (playerStatsRes.error) throw playerStatsRes.error
      if (goalStatsRes.error) throw goalStatsRes.error

      // Merge player stats with goal stats
      const mergedStats: PlayerStatsWithGoals[] = (playerStatsRes.data || []).map((ps: PlayerStatistics) => {
        const goalStat = (goalStatsRes.data || []).find(gs => gs.player_id === ps.player_id)
        return {
          ...ps,
          total_goals: goalStat?.total_goals || 0,
          total_assists: goalStat?.total_assists || 0
        }
      })

      setPlayerStats(mergedStats)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al cargar estadísticas de jugadores',
        variant: 'destructive'
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const handleDetail = (match: MatchWithResult) => {
    setDetailMatch(match)
    setDetailOpen(true)
  }

  const getRowClassName = (result: 'win' | 'draw' | 'loss' | null | undefined) => {
    if (!result) return ''
    if (result === 'win') return 'bg-green-500/20 hover:bg-green-500/30'
    if (result === 'draw') return 'bg-white/5 hover:bg-white/10'
    if (result === 'loss') return 'bg-red-500/20 hover:bg-red-500/30'
    return ''
  }

  const getResultBadge = (result: 'win' | 'draw' | 'loss' | null | undefined) => {
    if (!result) return null
    if (result === 'win') return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-600 text-white">Victoria</span>
    if (result === 'draw') return <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-600 text-white">Empate</span>
    if (result === 'loss') return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-600 text-white">Derrota</span>
    return null
  }

  // Calcular estadísticas
  const stats = {
    totalMatches: matches.filter(m => m.result !== null).length,
    wins: matches.filter(m => m.result === 'win').length,
    draws: matches.filter(m => m.result === 'draw').length,
    losses: matches.filter(m => m.result === 'loss').length,
    goalsFor: matches.reduce((sum, m) => sum + (m.teamGoals || 0), 0),
    goalsAgainst: matches.reduce((sum, m) => sum + (m.opponentGoals || 0), 0),
    cleanSheets: matches.filter(m => m.result !== null && m.opponentGoals === 0).length,
  }

  const winPercentage = stats.totalMatches > 0
    ? ((stats.wins / stats.totalMatches) * 100).toFixed(1)
    : '0.0'

  const goalDifference = stats.goalsFor - stats.goalsAgainst

  const avgGoalsFor = stats.totalMatches > 0
    ? (stats.goalsFor / stats.totalMatches).toFixed(1)
    : '0.0'

  const avgGoalsAgainst = stats.totalMatches > 0
    ? (stats.goalsAgainst / stats.totalMatches).toFixed(1)
    : '0.0'

  // Forma reciente (últimos 5 partidos)
  const recentMatches = matches
    .filter(m => m.result !== null)
    .slice(0, 5)

  const getResultIcon = (result: 'win' | 'draw' | 'loss') => {
    if (result === 'win') return 'V'
    if (result === 'draw') return 'E'
    return 'D'
  }

  const getResultColor = (result: 'win' | 'draw' | 'loss') => {
    if (result === 'win') return 'bg-green-600 text-white'
    if (result === 'draw') return 'bg-gray-600 text-white'
    return 'bg-red-600 text-white'
  }

  // Sorting functions for player stats
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline opacity-50" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1 inline" />
    }
    return <ArrowDown className="h-4 w-4 ml-1 inline" />
  }

  const sortedPlayerStats = [...playerStats].sort((a, b) => {
    let aVal, bVal
    switch (sortField) {
      case 'name':
        aVal = a.full_name.toLowerCase()
        bVal = b.full_name.toLowerCase()
        break
      case 'attendance':
        aVal = a.match_attendance_pct
        bVal = b.match_attendance_pct
        break
      case 'quarters':
        aVal = a.avg_periods_played
        bVal = b.avg_periods_played
        break
      case 'goals':
        aVal = a.total_goals
        bVal = b.total_goals
        break
      case 'assists':
        aVal = a.total_assists
        bVal = b.total_assists
        break
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Partidos</h1>
        <p className="text-muted-foreground">
          Información completa de partidos y resultados
        </p>
      </div>

      <div className="flex items-center gap-4">
        <label className="font-medium">Equipo:</label>
        <Select
          value={selectedTeamId?.toString() || ''}
          onValueChange={(val) => setSelectedTeamId(Number(val))}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar equipo" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay partidos registrados para este equipo
        </div>
      ) : (
        <Tabs defaultValue="partidos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="partidos">Partidos</TabsTrigger>
            <TabsTrigger value="jugadores">Jugadores</TabsTrigger>
          </TabsList>

          {/* Partidos Tab */}
          <TabsContent value="partidos" className="space-y-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Partidos Jugados */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Partidos Jugados</h3>
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold">{stats.totalMatches}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.wins}V - {stats.draws}E - {stats.losses}D
                  </p>
                </div>
              </div>

              {/* % Victorias */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">% Victorias</h3>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold">{winPercentage}%</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${winPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Diferencia de Goles */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Diferencia de Goles</h3>
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className={`text-4xl font-bold ${goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {goalDifference > 0 ? '+' : ''}{goalDifference}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.goalsFor} GF - {stats.goalsAgainst} GC
                  </p>
                </div>
              </div>

              {/* Promedio de Goles */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Promedio de Goles</h3>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold">{avgGoalsFor}</p>
                  <p className="text-sm text-muted-foreground">
                    A favor: {avgGoalsFor} | En contra: {avgGoalsAgainst}
                  </p>
                </div>
              </div>

              {/* Vallas Invictas */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Vallas Invictas</h3>
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold">{stats.cleanSheets}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalMatches > 0
                      ? ((stats.cleanSheets / stats.totalMatches) * 100).toFixed(1)
                      : '0.0'}% de los partidos
                  </p>
                </div>
              </div>

              {/* Forma Reciente */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Forma Reciente</h3>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex gap-2 mt-4">
                  {recentMatches.length > 0 ? (
                    recentMatches.map((m, idx) => (
                      <div
                        key={idx}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${getResultColor(m.result!)}`}
                        title={`${m.opponent} (${m.teamGoals}-${m.opponentGoals})`}
                      >
                        {getResultIcon(m.result!)}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabla de partidos */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left font-medium">Fecha</th>
                    <th className="p-3 text-left font-medium">Oponente</th>
                    <th className="p-3 text-left font-medium">Lugar</th>
                    <th className="p-3 text-center font-medium">Resultado</th>
                    <th className="p-3 text-center font-medium">Estado</th>
                    <th className="p-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {matches.map((m) => (
                    <tr key={m.id} className={`hover:bg-muted/50 ${getRowClassName(m.result)}`}>
                      <td className="p-3">
                        {new Date(m.match_date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="p-3 font-medium">{m.opponent}</td>
                      <td className="p-3">{m.location || '-'}</td>
                      <td className="p-3 text-center font-bold">
                        {m.teamGoals !== undefined && m.opponentGoals !== undefined
                          ? `${m.teamGoals} - ${m.opponentGoals}`
                          : '-'}
                      </td>
                      <td className="p-3 text-center">
                        {getResultBadge(m.result)}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDetail(m)}
                            title="Ver detalle"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Detalle
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Jugadores Tab */}
          <TabsContent value="jugadores" className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Rendimiento de Jugadores
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Estadísticas generales de cada jugador
                  </p>
                </div>
              </div>

              {statsLoading ? (
                <div className="text-center py-8">Cargando estadísticas...</div>
              ) : sortedPlayerStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay estadísticas de jugadores disponibles
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('name')}
                      >
                        Jugador {getSortIcon('name')}
                      </TableHead>
                      <TableHead className="text-center">#</TableHead>
                      <TableHead
                        className="text-center cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('attendance')}
                      >
                        Partidos {getSortIcon('attendance')}
                      </TableHead>
                      <TableHead
                        className="text-center cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('quarters')}
                      >
                        Cuartos {getSortIcon('quarters')}
                      </TableHead>
                      <TableHead
                        className="text-center cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('goals')}
                      >
                        Goles {getSortIcon('goals')}
                      </TableHead>
                      <TableHead
                        className="text-center cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('assists')}
                      >
                        Asistencias {getSortIcon('assists')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPlayerStats.map((player) => (
                      <TableRow key={player.player_id}>
                        <TableCell className="font-medium">{player.full_name}</TableCell>
                        <TableCell className="text-center">
                          {player.jersey_number ? (
                            <Badge variant="outline">#{player.jersey_number}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {player.matches_called_up}/{player.total_matches}
                            </div>
                            <Progress value={player.match_attendance_pct} className="h-1" />
                            <div className="text-xs text-muted-foreground">
                              {player.match_attendance_pct}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {player.avg_periods_played.toFixed(1)}/4
                            </div>
                            <Progress
                              value={(player.avg_periods_played / 4) * 100}
                              className="h-1"
                            />
                            <div className="text-xs text-muted-foreground">
                              {((player.avg_periods_played / 4) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-500">{player.total_goals}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-500">{player.total_assists}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {detailMatch && (
        <PartidosDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          match={detailMatch}
          teamId={selectedTeamId!}
        />
      )}
    </div>
  )
}

export default Partidos