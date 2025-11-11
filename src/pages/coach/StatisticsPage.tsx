import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  Trophy, 
  Target, 
  Calendar,
  BarChart3,
  Award,
  Activity,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { listCoachTeams, type Team } from '@/services/teams'
import {
  getTeamPlayerStatistics,
  getPlayerGoalStats,
  getFormationStatistics,
  getQuarterPerformance,
  getMatchResults,
  getTeamOverallStats,
  type PlayerStatistics,
  type PlayerGoalStats,
  type FormationStats,
  type QuarterPerformance,
  type MatchResult,
  type TeamOverallStats
} from '@/services/statistics'

type SortField = 'name' | 'jersey' | 'matches' | 'match_pct' | 'quarters' | 'trainings' | 'training_pct'
type SortDirection = 'asc' | 'desc' | null

export default function StatisticsPage() {
  const { toast } = useToast()
  const { role } = useAuth()
  
  // State
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)

  // Statistics data
  const [playerStats, setPlayerStats] = useState<PlayerStatistics[]>([])
  const [goalStats, setGoalStats] = useState<PlayerGoalStats[]>([])
  const [formationStats, setFormationStats] = useState<FormationStats[]>([])
  const [quarterPerformance, setQuarterPerformance] = useState<QuarterPerformance[]>([])
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [overallStats, setOverallStats] = useState<TeamOverallStats | null>(null)

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      loadAllStatistics()
    }
  }, [selectedTeamId])

  const loadTeams = async () => {
    try {
      const result = await listCoachTeams()
      
      if (result.error) {
        throw result.error
      }

      setTeams(result.data || [])
      
      if (result.data && result.data.length > 0) {
        setSelectedTeamId(result.data[0].id)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al cargar equipos: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAllStatistics = async () => {
    if (!selectedTeamId) return
    
    setStatsLoading(true)
    try {
      const [
        playerStatsRes,
        goalStatsRes,
        formationStatsRes,
        quarterPerfRes,
        matchResultsRes,
        overallStatsRes
      ] = await Promise.all([
        getTeamPlayerStatistics(selectedTeamId),
        getPlayerGoalStats(selectedTeamId),
        getFormationStatistics(selectedTeamId),
        getQuarterPerformance(selectedTeamId),
        getMatchResults(selectedTeamId),
        getTeamOverallStats(selectedTeamId)
      ])

      if (playerStatsRes.error) throw playerStatsRes.error
      if (goalStatsRes.error) throw goalStatsRes.error
      if (formationStatsRes.error) throw formationStatsRes.error
      if (quarterPerfRes.error) throw quarterPerfRes.error
      if (matchResultsRes.error) throw matchResultsRes.error
      if (overallStatsRes.error) throw overallStatsRes.error

      setPlayerStats(playerStatsRes.data || [])
      setGoalStats(goalStatsRes.data || [])
      setFormationStats(formationStatsRes.data || [])
      setQuarterPerformance(quarterPerfRes.data || [])
      setMatchResults(matchResultsRes.data || [])
      setOverallStats(overallStatsRes.data)
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al cargar estadísticas: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      }
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

  const getSortedPlayerStats = () => {
    if (!sortField || !sortDirection) return playerStats

    return [...playerStats].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name)
          break
        case 'jersey':
          comparison = (a.jersey_number || 999) - (b.jersey_number || 999)
          break
        case 'matches':
          comparison = a.matches_called_up - b.matches_called_up
          break
        case 'match_pct':
          comparison = a.match_attendance_pct - b.match_attendance_pct
          break
        case 'quarters':
          comparison = a.avg_periods_played - b.avg_periods_played
          break
        case 'trainings':
          comparison = a.trainings_attended - b.trainings_attended
          break
        case 'training_pct':
          comparison = a.training_attendance_pct - b.training_attendance_pct
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  const getResultBadge = (result: 'win' | 'loss' | 'draw') => {
    if (result === 'win') return <Badge className="bg-green-500">Victoria</Badge>
    if (result === 'loss') return <Badge variant="destructive">Derrota</Badge>
    return <Badge variant="secondary">Empate</Badge>
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
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas Completas</h1>
          <p className="text-muted-foreground">
            Análisis detallado del rendimiento del equipo
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estadísticas Completas</h1>
        <p className="text-muted-foreground">
          Análisis detallado del rendimiento del equipo
        </p>
      </div>

      {/* Team Selector */}
      {role !== 'player' && (
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Equipo</CardTitle>
            <CardDescription>
              Elegí el equipo para ver sus estadísticas
            </CardDescription>
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
        <>
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando estadísticas...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overall Stats Cards */}
              {overallStats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Partidos Jugados</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{overallStats.total_matches}</div>
                      <p className="text-xs text-muted-foreground">
                        {overallStats.wins}V - {overallStats.draws}E - {overallStats.losses}D
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">% Victorias</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{overallStats.win_percentage.toFixed(1)}%</div>
                      <Progress value={overallStats.win_percentage} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Diferencia de Goles</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${overallStats.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {overallStats.goal_difference > 0 ? '+' : ''}{overallStats.goal_difference}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {overallStats.total_goals_scored} a favor - {overallStats.total_goals_conceded} en contra
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Asistencia Entrenamientos</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{overallStats.avg_training_attendance.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">
                        {overallStats.total_trainings} entrenamientos
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tabs with detailed statistics */}
              <Tabs defaultValue="players" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
                  <TabsTrigger value="players" className="text-xs lg:text-sm">Jugadores</TabsTrigger>
                  <TabsTrigger value="goals" className="text-xs lg:text-sm">Goles</TabsTrigger>
                  <TabsTrigger value="matches" className="text-xs lg:text-sm">Partidos</TabsTrigger>
                  <TabsTrigger value="quarters" className="text-xs lg:text-sm">Cuartos</TabsTrigger>
                  <TabsTrigger value="formations" className="text-xs lg:text-sm">Formaciones</TabsTrigger>
                  <TabsTrigger value="attendance" className="text-xs lg:text-sm">Asistencia</TabsTrigger>
                </TabsList>

                {/* Players Tab */}
                <TabsContent value="players" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span>Rendimiento de Jugadores</span>
                      </CardTitle>
                      <CardDescription>
                        Estadísticas generales de cada jugador
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {playerStats.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('name')}
                              >
                                Jugador
                                {getSortIcon('name')}
                              </TableHead>
                              <TableHead 
                                className="text-center cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('jersey')}
                              >
                                #
                                {getSortIcon('jersey')}
                              </TableHead>
                              <TableHead 
                                className="text-center cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('match_pct')}
                              >
                                Partidos
                                {getSortIcon('match_pct')}
                              </TableHead>
                              <TableHead 
                                className="text-center cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('quarters')}
                              >
                                Prom. Cuartos
                                {getSortIcon('quarters')}
                              </TableHead>
                              <TableHead 
                                className="text-center cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('training_pct')}
                              >
                                Entrenamientos
                                {getSortIcon('training_pct')}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getSortedPlayerStats().map((stat) => (
                              <TableRow key={stat.player_id}>
                                <TableCell className="font-medium">{stat.full_name}</TableCell>
                                <TableCell className="text-center">
                                  {stat.jersey_number ? (
                                    <Badge variant="outline">#{stat.jersey_number}</Badge>
                                  ) : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span>{stat.matches_called_up}/{stat.total_matches}</span>
                                    <Badge variant={stat.match_attendance_pct >= 75 ? 'default' : 'secondary'}>
                                      {stat.match_attendance_pct}%
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  {stat.avg_periods_played.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span>{stat.trainings_attended}/{stat.total_trainings}</span>
                                    <Badge variant={stat.training_attendance_pct >= 75 ? 'default' : 'secondary'}>
                                      {stat.training_attendance_pct}%
                                    </Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        <span>Goleadores y Asistidores</span>
                      </CardTitle>
                      <CardDescription>
                        Ranking de goles y asistencias
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {goalStats.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No hay goles registrados</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Posición</TableHead>
                              <TableHead>Jugador</TableHead>
                              <TableHead className="text-center">#</TableHead>
                              <TableHead className="text-center">Goles</TableHead>
                              <TableHead className="text-center">Asistencias</TableHead>
                              <TableHead className="text-center">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {goalStats.map((stat, index) => (
                              <TableRow key={stat.player_id}>
                                <TableCell>
                                  {index === 0 && <Trophy className="h-5 w-5 text-yellow-500 inline mr-2" />}
                                  {index + 1}
                                </TableCell>
                                <TableCell className="font-medium">{stat.full_name}</TableCell>
                                <TableCell className="text-center">
                                  {stat.jersey_number ? (
                                    <Badge variant="outline">#{stat.jersey_number}</Badge>
                                  ) : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-green-500">{stat.total_goals}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-blue-500">{stat.total_assists}</Badge>
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  {stat.total_goals + stat.total_assists}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Matches Tab */}
                <TabsContent value="matches" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>Historial de Partidos</span>
                      </CardTitle>
                      <CardDescription>
                        Resultados de todos los partidos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {matchResults.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No hay partidos registrados</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Oponente</TableHead>
                              <TableHead className="text-center">Resultado</TableHead>
                              <TableHead className="text-center">Goles</TableHead>
                              <TableHead className="text-center">Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {matchResults.map((match) => (
                              <TableRow key={match.match_id}>
                                <TableCell>{new Date(match.match_date).toLocaleDateString()}</TableCell>
                                <TableCell className="font-medium">{match.opponent}</TableCell>
                                <TableCell className="text-center">
                                  {getResultBadge(match.result)}
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  {match.team_goals} - {match.opponent_goals}
                                </TableCell>
                                <TableCell className="text-center">
                                  {match.team_goals > match.opponent_goals ? (
                                    <TrendingUp className="h-5 w-5 text-green-500 inline" />
                                  ) : match.team_goals < match.opponent_goals ? (
                                    <TrendingDown className="h-5 w-5 text-red-500 inline" />
                                  ) : (
                                    <Activity className="h-5 w-5 text-gray-500 inline" />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Quarters Tab */}
                <TabsContent value="quarters" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        <span>Rendimiento por Cuarto</span>
                      </CardTitle>
                      <CardDescription>
                        Análisis de goles y resultados por cuarto
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {quarterPerformance.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No hay datos de cuartos</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cuarto</TableHead>
                              <TableHead className="text-center">Goles a Favor</TableHead>
                              <TableHead className="text-center">Goles en Contra</TableHead>
                              <TableHead className="text-center">Diferencia</TableHead>
                              <TableHead className="text-center">Victorias</TableHead>
                              <TableHead className="text-center">Empates</TableHead>
                              <TableHead className="text-center">Derrotas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quarterPerformance.map((qp) => (
                              <TableRow key={qp.quarter}>
                                <TableCell className="font-bold">Cuarto {qp.quarter}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-green-500">{qp.total_goals_scored}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="destructive">{qp.total_goals_conceded}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`font-bold ${qp.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {qp.goal_difference > 0 ? '+' : ''}{qp.goal_difference}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">{qp.wins}</TableCell>
                                <TableCell className="text-center">{qp.draws}</TableCell>
                                <TableCell className="text-center">{qp.losses}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Formations Tab */}
                <TabsContent value="formations" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        <span>Formaciones Más Efectivas</span>
                      </CardTitle>
                      <CardDescription>
                        Análisis de rendimiento según formación inicial
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {formationStats.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No hay datos de formaciones</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Formación</TableHead>
                              <TableHead className="text-center">Partidos</TableHead>
                              <TableHead className="text-center">% Victorias</TableHead>
                              <TableHead className="text-center">V-E-D</TableHead>
                              <TableHead className="text-center">Goles</TableHead>
                              <TableHead className="text-center">Diferencia</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formationStats.map((fs) => (
                              <TableRow key={fs.formation_key}>
                                <TableCell className="font-medium">{fs.formation_key}</TableCell>
                                <TableCell className="text-center">{fs.matches_played}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="font-bold">{fs.win_percentage.toFixed(1)}%</span>
                                    <Progress value={fs.win_percentage} className="w-20" />
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {fs.wins}-{fs.draws}-{fs.losses}
                                </TableCell>
                                <TableCell className="text-center">
                                  {fs.total_goals_scored} - {fs.total_goals_conceded}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`font-bold ${fs.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {fs.goal_difference > 0 ? '+' : ''}{fs.goal_difference}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <span>Asistencia a Entrenamientos</span>
                      </CardTitle>
                      <CardDescription>
                        Ranking de asistencia a entrenamientos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {playerStats.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Jugador</TableHead>
                              <TableHead className="text-center">#</TableHead>
                              <TableHead className="text-center">Asistencias</TableHead>
                              <TableHead className="text-center">% Asistencia</TableHead>
                              <TableHead className="text-center">Progreso</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...playerStats]
                              .sort((a, b) => b.training_attendance_pct - a.training_attendance_pct)
                              .map((stat) => (
                                <TableRow key={stat.player_id}>
                                  <TableCell className="font-medium">{stat.full_name}</TableCell>
                                  <TableCell className="text-center">
                                    {stat.jersey_number ? (
                                      <Badge variant="outline">#{stat.jersey_number}</Badge>
                                    ) : '-'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {stat.trainings_attended} / {stat.total_trainings}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge 
                                      variant={
                                        stat.training_attendance_pct >= 90 ? 'default' :
                                        stat.training_attendance_pct >= 75 ? 'secondary' :
                                        'destructive'
                                      }
                                    >
                                      {stat.training_attendance_pct}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Progress value={stat.training_attendance_pct} className="w-full" />
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}
    </div>
  )
}
