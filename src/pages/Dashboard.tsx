import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Target, 
  Award,
  User
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  getTeamPlayerStatistics,
  getPlayerGoalStats,
  getQuarterPerformance,
  getMatchResults,
  getTeamOverallStats,
  type PlayerStatistics,
  type PlayerGoalStats,
  type QuarterPerformance,
  type MatchResult,
  type TeamOverallStats
} from '@/services/statistics'

type PlayerInfo = {
  id: number
  full_name: string
  jersey_number: number | null
  team_id: number
  team_name: string
}

export default function Dashboard() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  // State
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)

  // Statistics data
  const [playerStats, setPlayerStats] = useState<PlayerStatistics[]>([])
  const [goalStats, setGoalStats] = useState<PlayerGoalStats[]>([])
  const [quarterPerformance, setQuarterPerformance] = useState<QuarterPerformance[]>([])
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [overallStats, setOverallStats] = useState<TeamOverallStats | null>(null)

  useEffect(() => {
    loadPlayerInfo()
  }, [user])

  useEffect(() => {
    if (playerInfo?.team_id) {
      loadAllStatistics()
    }
  }, [playerInfo])

  const loadPlayerInfo = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id, full_name, jersey_number, team_id')
        .eq('user_id', user.id)
        .single()

      if (playerError) {
        if (playerError.code === 'PGRST116') {
          // No player found for this user
          toast({
            title: "Usuario no vinculado",
            description: `Tu usuario (${user.email}) no está vinculado a ningún jugador. Contactá al administrador.`,
            variant: "destructive"
          })
          setLoading(false)
          return
        }
        throw playerError
      }

      if (playerData) {
        // Get team name separately
        const { data: teamData } = await supabase
          .from('teams')
          .select('name')
          .eq('id', playerData.team_id)
          .single()

        setPlayerInfo({
          id: playerData.id,
          full_name: playerData.full_name,
          jersey_number: playerData.jersey_number,
          team_id: playerData.team_id,
          team_name: teamData?.name || 'Equipo'
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al cargar información del jugador: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAllStatistics = async () => {
    if (!playerInfo?.team_id) return
    
    setStatsLoading(true)
    try {
      const [
        playerStatsRes,
        goalStatsRes,
        quarterPerfRes,
        matchResultsRes,
        overallStatsRes
      ] = await Promise.all([
        getTeamPlayerStatistics(playerInfo.team_id),
        getPlayerGoalStats(playerInfo.team_id),
        getQuarterPerformance(playerInfo.team_id),
        getMatchResults(playerInfo.team_id),
        getTeamOverallStats(playerInfo.team_id)
      ])

      if (playerStatsRes.error) throw playerStatsRes.error
      if (goalStatsRes.error) throw goalStatsRes.error
      if (quarterPerfRes.error) throw quarterPerfRes.error
      if (matchResultsRes.error) throw matchResultsRes.error
      if (overallStatsRes.error) throw overallStatsRes.error

      setPlayerStats(playerStatsRes.data || [])
      setGoalStats(goalStatsRes.data || [])
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

  const getResultBadge = (result: 'win' | 'loss' | 'draw') => {
    if (result === 'win') return <Badge className="bg-green-500">Victoria</Badge>
    if (result === 'loss') return <Badge variant="destructive">Derrota</Badge>
    return <Badge variant="secondary">Empate</Badge>
  }

  // Get current player's stats
  const myStats = playerStats.find(s => s.player_id === playerInfo?.id)
  const myGoalStats = goalStats.find(s => s.player_id === playerInfo?.id)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (!playerInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido al panel principal
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No estás vinculado a ningún jugador</h3>
            <p className="text-muted-foreground text-center">
              Contactá al administrador para vincular tu cuenta con un jugador.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold">{playerInfo.full_name}</span>
          <Badge variant="outline" className="text-base px-3 py-1">
            {playerInfo.team_name}
          </Badge>
        </div>
      </div>

      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Player Personal Stats - 4 Cards */}
          {myStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">Partidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{myStats.matches_called_up}</span>
                    <span className="text-2xl text-muted-foreground">/{myStats.total_matches}</span>
                  </div>
                  <Progress value={myStats.match_attendance_pct} className="h-2" />
                  <p className="text-sm font-medium">
                    {myStats.match_attendance_pct}% asistencia
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">Cuartos jugados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{myStats.avg_periods_played.toFixed(1)}</span>
                    <span className="text-2xl text-muted-foreground">/4</span>
                  </div>
                  <div className="h-2"></div>
                  <p className="text-sm text-muted-foreground">
                    promedio por partido
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">Entrenamientos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{myStats.trainings_attended}</span>
                    <span className="text-2xl text-muted-foreground">/{myStats.total_trainings}</span>
                  </div>
                  <Progress value={myStats.training_attendance_pct} className="h-2" />
                  <p className="text-sm font-medium">
                    {myStats.training_attendance_pct}% asistencia
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">Goles y Asistencias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-5xl font-bold">{myGoalStats?.total_goals || 0}</span>
                    <span className="text-sm text-muted-foreground">GOLES</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-5xl font-bold">{myGoalStats?.total_assists || 0}</span>
                    <span className="text-sm text-muted-foreground">ASISTENCIAS</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Team Overall Stats */}
          {overallStats && (
            <>
              <div className="border-l-4 border-primary pl-4">
                <h2 className="text-2xl font-bold tracking-tight">Equipo de {playerInfo.full_name}</h2>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-muted-foreground">Partidos jugados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{overallStats.total_matches}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overallStats.wins}V · {overallStats.draws}E · {overallStats.losses}D
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-muted-foreground">% victorias</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{overallStats.win_percentage.toFixed(0)}</span>
                      <span className="text-2xl text-muted-foreground">%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${overallStats.win_percentage}%` }}></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overallStats.wins}V · {overallStats.draws}E · {overallStats.losses}D
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-muted-foreground">GOLES</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">{overallStats.total_goals_scored}</span>
                      <span className="text-sm text-muted-foreground">A FAVOR</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">{overallStats.total_goals_conceded}</span>
                      <span className="text-sm text-muted-foreground">EN CONTRA</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className={`text-3xl font-bold ${overallStats.goal_difference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {overallStats.goal_difference > 0 ? '+' : ''}{overallStats.goal_difference}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">DIFERENCIA<br/>DE GOL</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Tabs with detailed statistics */}
          <Tabs defaultValue="matches" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="matches">Partidos</TabsTrigger>
              <TabsTrigger value="quarters">Cuartos</TabsTrigger>
              <TabsTrigger value="goals">Goleadores</TabsTrigger>
            </TabsList>

            {/* Matches Tab */}
            <TabsContent value="matches" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    <span>Historial de Partidos</span>
                  </CardTitle>
                  <CardDescription>
                    Resultados de todos los partidos del equipo
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
                          <TableHead className="text-center">V-E-D</TableHead>
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
                            <TableCell className="text-center">
                              {qp.wins}-{qp.draws}-{qp.losses}
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
                    <span>Goleadores del Equipo</span>
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
                        {goalStats.map((stat, index) => {
                          const isCurrentPlayer = stat.player_id === playerInfo.id
                          return (
                            <TableRow 
                              key={stat.player_id}
                              className={isCurrentPlayer ? 'bg-primary/5 font-semibold' : ''}
                            >
                              <TableCell>
                                {index === 0 && <Trophy className="h-5 w-5 text-yellow-500 inline mr-2" />}
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                {stat.full_name}
                                {isCurrentPlayer && <Badge className="ml-2" variant="outline">Tú</Badge>}
                              </TableCell>
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
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}