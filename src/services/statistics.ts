import { supabase } from '@/lib/supabase'

// ============ TYPES ============

export type PlayerStatistics = {
  player_id: number
  team_id: number
  full_name: string
  jersey_number: number | null
  total_trainings: number
  trainings_attended: number
  training_attendance_pct: number
  total_matches: number
  matches_called_up: number
  match_attendance_pct: number
  avg_periods_played: number
}

export type PlayerGoalStats = {
  player_id: number
  full_name: string
  jersey_number: number | null
  total_goals: number
  total_assists: number
}

export type FormationStats = {
  formation_key: string
  matches_played: number
  wins: number
  losses: number
  draws: number
  win_percentage: number
  total_goals_scored: number
  total_goals_conceded: number
  goal_difference: number
}

export type QuarterPerformance = {
  quarter: number
  total_goals_scored: number
  total_goals_conceded: number
  goal_difference: number
  wins: number
  losses: number
  draws: number
}

export type MatchResult = {
  match_id: number
  opponent: string
  match_date: string
  team_goals: number
  opponent_goals: number
  result: 'win' | 'loss' | 'draw'
}

export type TeamOverallStats = {
  total_matches: number
  wins: number
  losses: number
  draws: number
  win_percentage: number
  total_goals_scored: number
  total_goals_conceded: number
  goal_difference: number
  avg_goals_per_match: number
  total_trainings: number
  avg_training_attendance: number
}

// ============ PLAYER STATISTICS ============

export async function getTeamPlayerStatistics(teamId: number) {
  return supabase.rpc('get_team_player_statistics', { p_team_id: teamId })
}

export async function getPlayerGoalStats(teamId: number) {
  // Primero obtener todos los jugadores del equipo
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, full_name, jersey_number')
    .eq('team_id', teamId)

  if (playersError) return { data: null, error: playersError }

  // Obtener todos los goles de partidos de este equipo
  const { data: goals, error: goalsError } = await supabase
    .from('match_goals')
    .select(`
      scorer_id,
      assister_id,
      matches!inner(team_id)
    `)
    .eq('matches.team_id', teamId)

  if (goalsError) return { data: null, error: goalsError }

  // Crear mapa de estadísticas
  const statsMap = new Map<number, PlayerGoalStats>()

  // Inicializar todos los jugadores
  players?.forEach(player => {
    statsMap.set(player.id, {
      player_id: player.id,
      full_name: player.full_name,
      jersey_number: player.jersey_number,
      total_goals: 0,
      total_assists: 0
    })
  })

  // Contar goles y asistencias
  goals?.forEach((goal: any) => {
    if (statsMap.has(goal.scorer_id)) {
      statsMap.get(goal.scorer_id)!.total_goals++
    }
    if (goal.assister_id && statsMap.has(goal.assister_id)) {
      statsMap.get(goal.assister_id)!.total_assists++
    }
  })

  // Filtrar solo jugadores con goles o asistencias
  const result = Array.from(statsMap.values())
    .filter(stat => stat.total_goals > 0 || stat.total_assists > 0)
    .sort((a, b) => {
      const totalA = a.total_goals + a.total_assists
      const totalB = b.total_goals + b.total_assists
      if (totalB !== totalA) return totalB - totalA
      return b.total_goals - a.total_goals
    })

  return { data: result, error: null }
}

// ============ FORMATION STATISTICS ============

export async function getFormationStatistics(teamId: number) {
  // Obtener todos los partidos con sus resultados y formaciones
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select(`
      id,
      opponent,
      match_date,
      match_quarter_results(quarter, team_goals, opponent_goals),
      match_player_periods(player_id, period, fraction)
    `)
    .eq('team_id', teamId)

  if (matchError) return { data: null, error: matchError }

  const formationMap = new Map<string, FormationStats>()

  matches?.forEach((match: any) => {
    // Calcular resultado total del partido
    const quarterResults = match.match_quarter_results || []
    const teamGoals = quarterResults.reduce((sum: number, qr: any) => sum + qr.team_goals, 0)
    const opponentGoals = quarterResults.reduce((sum: number, qr: any) => sum + qr.opponent_goals, 0)

    // Determinar formación (jugadores titulares en período 1)
    const period1Players = (match.match_player_periods || [])
      .filter((p: any) => p.period === 1)
      .map((p: any) => p.player_id)
      .sort((a: number, b: number) => a - b)

    const formationKey = period1Players.length > 0 
      ? `${period1Players.length} jugadores` 
      : 'Sin formación'

    if (!formationMap.has(formationKey)) {
      formationMap.set(formationKey, {
        formation_key: formationKey,
        matches_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        win_percentage: 0,
        total_goals_scored: 0,
        total_goals_conceded: 0,
        goal_difference: 0
      })
    }

    const stats = formationMap.get(formationKey)!
    stats.matches_played++
    stats.total_goals_scored += teamGoals
    stats.total_goals_conceded += opponentGoals
    stats.goal_difference += (teamGoals - opponentGoals)

    if (teamGoals > opponentGoals) stats.wins++
    else if (teamGoals < opponentGoals) stats.losses++
    else stats.draws++
  })

  // Calcular porcentajes
  formationMap.forEach(stats => {
    stats.win_percentage = stats.matches_played > 0 
      ? (stats.wins / stats.matches_played) * 100 
      : 0
  })

  return {
    data: Array.from(formationMap.values()).sort((a, b) => b.win_percentage - a.win_percentage),
    error: null
  }
}

// ============ QUARTER PERFORMANCE ============

export async function getQuarterPerformance(teamId: number) {
  const { data: quarterResults, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_quarter_results(quarter, team_goals, opponent_goals)
    `)
    .eq('team_id', teamId)

  if (error) return { data: null, error }

  const quarterMap = new Map<number, QuarterPerformance>()

  for (let q = 1; q <= 4; q++) {
    quarterMap.set(q, {
      quarter: q,
      total_goals_scored: 0,
      total_goals_conceded: 0,
      goal_difference: 0,
      wins: 0,
      losses: 0,
      draws: 0
    })
  }

  quarterResults?.forEach((match: any) => {
    match.match_quarter_results?.forEach((qr: any) => {
      const stats = quarterMap.get(qr.quarter)
      if (!stats) return

      stats.total_goals_scored += qr.team_goals
      stats.total_goals_conceded += qr.opponent_goals
      stats.goal_difference += (qr.team_goals - qr.opponent_goals)

      if (qr.team_goals > qr.opponent_goals) stats.wins++
      else if (qr.team_goals < qr.opponent_goals) stats.losses++
      else stats.draws++
    })
  })

  return {
    data: Array.from(quarterMap.values()),
    error: null
  }
}

// ============ MATCH RESULTS ============

export async function getMatchResults(teamId: number) {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      opponent,
      match_date,
      match_quarter_results(team_goals, opponent_goals)
    `)
    .eq('team_id', teamId)
    .order('match_date', { ascending: false })

  if (error) return { data: null, error }

  const results: MatchResult[] = matches?.map((match: any) => {
    const quarterResults = match.match_quarter_results || []
    const teamGoals = quarterResults.reduce((sum: number, qr: any) => sum + qr.team_goals, 0)
    const opponentGoals = quarterResults.reduce((sum: number, qr: any) => sum + qr.opponent_goals, 0)

    let result: 'win' | 'loss' | 'draw'
    if (teamGoals > opponentGoals) result = 'win'
    else if (teamGoals < opponentGoals) result = 'loss'
    else result = 'draw'

    return {
      match_id: match.id,
      opponent: match.opponent,
      match_date: match.match_date,
      team_goals: teamGoals,
      opponent_goals: opponentGoals,
      result
    }
  }) || []

  return { data: results, error: null }
}

// ============ OVERALL TEAM STATISTICS ============

export async function getTeamOverallStats(teamId: number) {
  // Obtener resultados de partidos
  const matchResults = await getMatchResults(teamId)
  if (matchResults.error) return { data: null, error: matchResults.error }

  const matches = matchResults.data || []
  const wins = matches.filter(m => m.result === 'win').length
  const losses = matches.filter(m => m.result === 'loss').length
  const draws = matches.filter(m => m.result === 'draw').length
  const totalGoalsScored = matches.reduce((sum, m) => sum + m.team_goals, 0)
  const totalGoalsConceded = matches.reduce((sum, m) => sum + m.opponent_goals, 0)

  // Obtener estadísticas de entrenamientos
  const { data: trainings, error: trainError } = await supabase
    .from('training_sessions')
    .select(`
      id,
      training_attendance(status)
    `)
    .eq('team_id', teamId)

  if (trainError) return { data: null, error: trainError }

  const totalTrainings = trainings?.length || 0
  const totalAttendances = trainings?.reduce((sum: number, t: any) => {
    return sum + (t.training_attendance?.filter((a: any) => 
      a.status === 'on_time' || a.status === 'late'
    ).length || 0)
  }, 0) || 0

  const totalPossibleAttendances = trainings?.reduce((sum: number, t: any) => {
    return sum + (t.training_attendance?.length || 0)
  }, 0) || 0

  const stats: TeamOverallStats = {
    total_matches: matches.length,
    wins,
    losses,
    draws,
    win_percentage: matches.length > 0 ? (wins / matches.length) * 100 : 0,
    total_goals_scored: totalGoalsScored,
    total_goals_conceded: totalGoalsConceded,
    goal_difference: totalGoalsScored - totalGoalsConceded,
    avg_goals_per_match: matches.length > 0 ? totalGoalsScored / matches.length : 0,
    total_trainings: totalTrainings,
    avg_training_attendance: totalPossibleAttendances > 0 
      ? (totalAttendances / totalPossibleAttendances) * 100 
      : 0
  }

  return { data: stats, error: null }
}
