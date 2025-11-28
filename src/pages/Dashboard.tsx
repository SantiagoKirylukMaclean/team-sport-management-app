import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Target, Award, User } from 'lucide-react'
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
  type TeamOverallStats,
} from '@/services/statistics'
import StatisticsPage from '@/pages/coach/StatisticsPage'

type PlayerInfo = {
  id: number
  full_name: string
  jersey_number: number | null
  team_id: number
  team_name: string
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user, role } = useAuth()

  // State
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)

  // Statistics data
  const [playerStats, setPlayerStats] = useState<PlayerStatistics[]>([])
  const [goalStats, setGoalStats] = useState<PlayerGoalStats[]>([])
  const [quarterPerformance, setQuarterPerformance] = useState<
    QuarterPerformance[]
  >([])
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [overallStats, setOverallStats] = useState<TeamOverallStats | null>(
    null
  )

  useEffect(() => {
    // Only load player data if not coach/admin
    if (role !== 'coach' && role !== 'admin') {
      loadPlayerInfo()
    }
  }, [user, role])

  useEffect(() => {
    if (playerInfo?.team_id) {
      loadAllStatistics()
    }
  }, [playerInfo])

  // If coach or admin, show statistics directly
  if (role === 'coach' || role === 'admin') {
    return <StatisticsPage />
  }

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
            title: t('dashboard.userNotLinkedTitle'),
            description: t('dashboard.userNotLinkedDescription', {
              email: user.email,
            }),
            variant: 'destructive',
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
          team_name: teamData?.name || t('common.team'),
        })
      }
    } catch (err: any) {
      toast({
        title: t('common.error'),
        description: t('dashboard.loadPlayerInfoError', {
          message: err.message,
        }),
        variant: 'destructive',
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
        overallStatsRes,
      ] = await Promise.all([
        getTeamPlayerStatistics(playerInfo.team_id),
        getPlayerGoalStats(playerInfo.team_id),
        getQuarterPerformance(playerInfo.team_id),
        getMatchResults(playerInfo.team_id),
        getTeamOverallStats(playerInfo.team_id),
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
        title: t('common.error'),
        description: t('dashboard.loadStatisticsError', {
          message: err.message,
        }),
        variant: 'destructive',
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const getResultBadge = (result: 'win' | 'loss' | 'draw') => {
    if (result === 'win')
      return (
        <Badge className="bg-green-500">{t('dashboard.results.win')}</Badge>
      )
    if (result === 'loss')
      return (
        <Badge variant="destructive">{t('dashboard.results.loss')}</Badge>
      )
    return <Badge variant="secondary">{t('dashboard.results.draw')}</Badge>
  }

  // Get current player's stats
  const myStats = playerStats.find(s => s.player_id === playerInfo?.id)
  const myGoalStats = goalStats.find(s => s.player_id === playerInfo?.id)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {t('dashboard.loadingInfo')}
          </p>
        </div>
      </div>
    )
  }

  if (!playerInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('nav.dashboard')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.welcomeMessage')}
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('dashboard.notLinkedToPlayer')}
            </h3>
            <p className="text-muted-foreground text-center">
              {t('dashboard.contactAdminToLink')}
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {t('nav.dashboard')}
        </h1>
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
            <p className="text-muted-foreground">
              {t('dashboard.loadingStats')}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Player Personal Stats - 4 Cards */}
          {myStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    {t('dashboard.cards.matches')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">
                      {myStats.matches_called_up}
                    </span>
                    <span className="text-2xl text-muted-foreground">
                      /{myStats.total_matches}
                    </span>
                  </div>
                  <Progress
                    value={myStats.match_attendance_pct}
                    className="h-2"
                  />
                  <p className="text-sm font-medium">
                    {myStats.match_attendance_pct}%{' '}
                    {t('dashboard.cards.attendance')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    {t('dashboard.cards.quartersPlayed')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">
                      {myStats.avg_periods_played.toFixed(1)}
                    </span>
                    <span className="text-2xl text-muted-foreground">/4</span>
                  </div>
                  <div className="h-2"></div>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.cards.avgPerMatch')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    {t('dashboard.cards.training')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">
                      {myStats.trainings_attended}
                    </span>
                    <span className="text-2xl text-muted-foreground">
                      /{myStats.total_trainings}
                    </span>
                  </div>
                  <Progress
                    value={myStats.training_attendance_pct}
                    className="h-2"
                  />
                  <p className="text-sm font-medium">
                    {myStats.training_attendance_pct}%{' '}
                    {t('dashboard.cards.attendance')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    {t('dashboard.cards.goalsAndAssists')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-5xl font-bold">
                      {myGoalStats?.total_goals || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t('dashboard.cards.goals')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-5xl font-bold">
                      {myGoalStats?.total_assists || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t('dashboard.cards.assists')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Team Overall Stats */}
          {overallStats && (
            <>
              <div className="border-l-4 border-primary pl-4">
                <h2 className="text-2xl font-bold tracking-tight">
                  {t('dashboard.teamOf', { name: playerInfo.full_name })}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      {t('dashboard.teamStats.matchesPlayed')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        {overallStats.total_matches}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overallStats.wins}
                      {t('dashboard.results.winShort')} · {overallStats.draws}
                      {t('dashboard.results.drawShort')} ·{' '}
                      {overallStats.losses}
                      {t('dashboard.results.lossShort')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      {t('dashboard.teamStats.winPercentage')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        {overallStats.win_percentage.toFixed(0)}
                      </span>
                      <span className="text-2xl text-muted-foreground">
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${overallStats.win_percentage}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overallStats.wins}
                      {t('dashboard.results.winShort')} · {overallStats.draws}
                      {t('dashboard.results.drawShort')} ·{' '}
                      {overallStats.losses}
                      {t('dashboard.results.lossShort')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      {t('dashboard.teamStats.goals')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">
                        {overallStats.total_goals_scored}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t('dashboard.teamStats.goalsFor')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">
                        {overallStats.total_goals_conceded}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t('dashboard.teamStats.goalsAgainst')}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-3xl font-bold ${
                            overallStats.goal_difference >= 0
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          {overallStats.goal_difference > 0 ? '+' : ''}
                          {overallStats.goal_difference}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {t('dashboard.teamStats.goalDifference')}
                        </span>
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
              <TabsTrigger value="matches">
                {t('dashboard.tabs.matches')}
              </TabsTrigger>
              <TabsTrigger value="quarters">
                {t('dashboard.tabs.quarters')}
              </TabsTrigger>
              <TabsTrigger value="goals">
                {t('dashboard.tabs.scorers')}
              </TabsTrigger>
            </TabsList>

            {/* Matches Tab */}
            <TabsContent value="matches" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    <span>{t('dashboard.matchesTab.title')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('dashboard.matchesTab.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {matchResults.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {t('dashboard.matchesTab.noMatches')}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('common.date')}</TableHead>
                          <TableHead>{t('matches.opponent')}</TableHead>
                          <TableHead className="text-center">
                            {t('matches.result')}
                          </TableHead>
                          <TableHead className="text-center">
                            {t('dashboard.teamStats.goals')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matchResults.map(match => (
                          <TableRow key={match.match_id}>
                            <TableCell>
                              {new Date(
                                match.match_date
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {match.opponent}
                            </TableCell>
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
                    <span>{t('dashboard.quartersTab.title')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('dashboard.quartersTab.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {quarterPerformance.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {t('dashboard.quartersTab.noData')}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('matches.quarter')}</TableHead>
                          <TableHead className="text-center">
                            {t('dashboard.teamStats.goalsFor')}
                          </TableHead>
                          <TableHead className="text-center">
                            {t('dashboard.teamStats.goalsAgainst')}
                          </TableHead>
                          <TableHead className="text-center">
                            {t('dashboard.teamStats.difference')}
                          </TableHead>
                          <TableHead className="text-center">
                            {t('dashboard.results.resultsShort')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quarterPerformance.map(qp => (
                          <TableRow key={qp.quarter}>
                            <TableCell className="font-bold">
                              {t('matches.quarter')} {qp.quarter}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-green-500">
                                {qp.total_goals_scored}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="destructive">
                                {qp.total_goals_conceded}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`font-bold ${
                                  qp.goal_difference >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {qp.goal_difference > 0 ? '+' : ''}
                                {qp.goal_difference}
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
                    <span>{t('dashboard.scorersTab.title')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('dashboard.scorersTab.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {goalStats.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {t('dashboard.scorersTab.noGoals')}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('players.position')}</TableHead>
                          <TableHead>{t('players.title')}</TableHead>
                          <TableHead className="text-center">#</TableHead>
                          <TableHead className="text-center">
                            {t('dashboard.teamStats.goals')}
                          </TableHead>
                          <TableHead className="text-center">
                            {t('statistics.assists')}
                          </TableHead>
                          <TableHead className="text-center">
                            {t('statistics.total')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {goalStats.map((stat, index) => {
                          const isCurrentPlayer =
                            stat.player_id === playerInfo.id
                          return (
                            <TableRow
                              key={stat.player_id}
                              className={
                                isCurrentPlayer
                                  ? 'bg-primary/5 font-semibold'
                                  : ''
                              }
                            >
                              <TableCell>
                                {index === 0 && (
                                  <Trophy className="h-5 w-5 text-yellow-500 inline mr-2" />
                                )}
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                {stat.full_name}
                                {isCurrentPlayer && (
                                  <Badge className="ml-2" variant="outline">
                                    {t('dashboard.you')}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {stat.jersey_number ? (
                                  <Badge variant="outline">
                                    #{stat.jersey_number}
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-green-500">
                                  {stat.total_goals}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-blue-500">
                                  {stat.total_assists}
                                </Badge>
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