import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  listMatchQuarterResults,
  listMatchPeriods,
  listMatchSubstitutions,
  type Match,
  type MatchQuarterResult,
  type MatchGoal,
  type MatchPlayerPeriod,
  type MatchSubstitution
} from '@/services/matches'
import { supabase } from '@/lib/supabase'

type MatchGoalWithPlayer = MatchGoal & {
  scorer?: { full_name: string } | null
  assister?: { full_name: string } | null
}

type PartidosDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: Match & { quarterResults?: MatchQuarterResult[] }
  teamId: number
}

export function PartidosDetailDialog({
  open,
  onOpenChange,
  match,
}: PartidosDetailDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [quarterResults, setQuarterResults] = useState<MatchQuarterResult[]>([])
  const [goals, setGoals] = useState<MatchGoalWithPlayer[]>([])
  const [periods, setPeriods] = useState<MatchPlayerPeriod[]>([])
  const [substitutions, setSubstitutions] = useState<MatchSubstitution[]>([])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, match.id])

  const loadData = async () => {
    setLoading(true)
    try {
      // Obtener todos los datos del partido
      const [quartersRes, goalsRes, periodsRes, substitutionsRes] = await Promise.all([
        listMatchQuarterResults(match.id),
        supabase
          .from('match_goals')
          .select('*')
          .eq('match_id', match.id)
          .order('created_at', { ascending: true }),
        listMatchPeriods(match.id),
        listMatchSubstitutions(match.id),
      ])

      if (quartersRes.error) throw quartersRes.error
      if (goalsRes.error) throw goalsRes.error
      if (periodsRes.error) throw periodsRes.error
      if (substitutionsRes.error) throw substitutionsRes.error

      const goalsData = goalsRes.data || []

      // Obtener IDs únicos de jugadores
      const playerIds = new Set<number>()
      goalsData.forEach(goal => {
        playerIds.add(goal.scorer_id)
        if (goal.assister_id) playerIds.add(goal.assister_id)
      })

      // Obtener información de jugadores
      const playersMap = new Map<number, string>()
      if (playerIds.size > 0) {
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('id, full_name')
          .in('id', Array.from(playerIds))

        if (!playersError && playersData) {
          playersData.forEach(player => {
            playersMap.set(player.id, player.full_name)
          })
        }
      }

      // Mapear los goles con la información de los jugadores
      const goalsWithPlayers = goalsData.map(goal => ({
        ...goal,
        scorer: playersMap.has(goal.scorer_id)
          ? { full_name: playersMap.get(goal.scorer_id)! }
          : null,
        assister: goal.assister_id && playersMap.has(goal.assister_id)
          ? { full_name: playersMap.get(goal.assister_id)! }
          : null
      }))

      setQuarterResults(quartersRes.data || [])
      setGoals(goalsWithPlayers)
      setPeriods(periodsRes.data || [])
      setSubstitutions(substitutionsRes.data || [])
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al cargar datos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getPlayerName = (goal: MatchGoalWithPlayer, type: 'scorer' | 'assister') => {
    if (type === 'scorer') {
      return goal.scorer?.full_name || 'Desconocido'
    } else {
      return goal.assister?.full_name || 'Desconocido'
    }
  }

  const getTotalScore = () => {
    const teamTotal = quarterResults.reduce((sum, r) => sum + r.team_goals, 0)
    const opponentTotal = quarterResults.reduce((sum, r) => sum + r.opponent_goals, 0)
    return { teamTotal, opponentTotal }
  }

  const getGoalsByQuarter = (quarter: number) => {
    return goals.filter((g) => g.quarter === quarter)
  }

  const getPlayersByQuarter = (quarter: number) => {
    return periods.filter((p) => p.period === quarter)
  }

  const getSubstitutionsByQuarter = (quarter: number) => {
    return substitutions.filter((s) => s.period === quarter)
  }

  const [playerNames, setPlayerNames] = useState<Map<number, string>>(new Map())
  const [positionNames, setPositionNames] = useState<Map<number, string>>(new Map())

  // Cargar nombres de jugadores y posiciones cuando se cargan los períodos
  useEffect(() => {
    const loadPlayerDetails = async () => {
      if (periods.length === 0) return

      const playerIds = [...new Set(periods.map(p => p.player_id))]
      const positionIds = [...new Set(periods.map(p => p.position_id).filter(Boolean))] as number[]

      // Obtener nombres de jugadores
      if (playerIds.length > 0) {
        const { data: players } = await supabase
          .from('players')
          .select('id, full_name')
          .in('id', playerIds)

        if (players) {
          const map = new Map<number, string>()
          players.forEach(p => map.set(p.id, p.full_name))
          setPlayerNames(map)
        }
      }

      // Obtener nombres de posiciones
      if (positionIds.length > 0) {
        const { data: positions } = await supabase
          .from('player_positions')
          .select('id, name')
          .in('id', positionIds)

        if (positions) {
          const map = new Map<number, string>()
          positions.forEach(p => map.set(p.id, p.name))
          setPositionNames(map)
        }
      }
    }

    loadPlayerDetails()
  }, [periods])

  const { teamTotal, opponentTotal } = getTotalScore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Partido</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del partido */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Información General</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fecha:</span>{' '}
                {new Date(match.match_date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div>
                <span className="font-medium">Oponente:</span> {match.opponent}
              </div>
              <div>
                <span className="font-medium">Lugar:</span> {match.location || '-'}
              </div>
              {match.notes && (
                <div className="col-span-2">
                  <span className="font-medium">Notas:</span> {match.notes}
                </div>
              )}
            </div>
          </div>

          {/* Resultado Final */}
          <div className="bg-muted p-4 rounded-lg text-center">
            <h3 className="font-semibold text-lg mb-2">Resultado Final</h3>
            <div className="text-4xl font-bold">
              {teamTotal} - {opponentTotal}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {teamTotal > opponentTotal ? (
                <span className="text-green-600 font-semibold">Victoria</span>
              ) : teamTotal === opponentTotal ? (
                <span className="text-gray-600 font-semibold">Empate</span>
              ) : (
                <span className="text-red-600 font-semibold">Derrota</span>
              )}
            </div>
          </div>

          {/* Resultados por Cuarto */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Resultados por Cuarto</h3>
            {loading ? (
              <div className="text-center py-4">Cargando...</div>
            ) : quarterResults.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay resultados registrados por cuarto
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((quarter) => {
                  const result = quarterResults.find((r) => r.quarter === quarter)
                  const quarterGoals = getGoalsByQuarter(quarter)

                  return (
                    <div
                      key={quarter}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="text-center font-semibold text-sm text-muted-foreground">
                        Cuarto {quarter}
                      </div>
                      {result ? (
                        <>
                          <div className="text-center text-2xl font-bold">
                            {result.team_goals} - {result.opponent_goals}
                          </div>
                          {quarterGoals.length > 0 && (
                            <div className="text-xs space-y-1 mt-2 pt-2 border-t">
                              <div className="font-semibold text-muted-foreground mb-1">Goles:</div>
                              {quarterGoals.map((goal) => (
                                <div key={goal.id} className="text-xs leading-relaxed">
                                  ⚽ <span className="font-semibold">{getPlayerName(goal, 'scorer')}</span>
                                  {goal.assister_id && (
                                    <div className="text-muted-foreground ml-4">
                                      Asist: {getPlayerName(goal, 'assister')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center text-muted-foreground text-sm">
                          Sin datos
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Formaciones por Cuarto */}
          {periods.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Formaciones por Cuarto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((quarter) => {
                  const quarterPlayers = getPlayersByQuarter(quarter)
                  const quarterSubs = getSubstitutionsByQuarter(quarter)

                  return (
                    <div
                      key={quarter}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="font-semibold text-center border-b pb-2">
                        Cuarto {quarter}
                      </div>

                      {quarterPlayers.length > 0 ? (
                        <>
                          {/* Jugadores */}
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">
                              Jugadores ({quarterPlayers.length})
                            </div>
                            {quarterPlayers.map((period) => {
                              const playerName = playerNames.get(period.player_id) || `Jugador #${period.player_id}`
                              const positionName = period.position_id ? positionNames.get(period.position_id) : null

                              return (
                                <div
                                  key={period.player_id}
                                  className="text-sm flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50"
                                >
                                  <div className="flex-1">
                                    <span className="font-medium">{playerName}</span>
                                    {positionName && (
                                      <span className="text-xs text-muted-foreground ml-2">
                                        ({positionName})
                                      </span>
                                    )}
                                    {period.field_zone && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        - {period.field_zone}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${period.fraction === 'FULL'
                                      ? 'bg-green-600/20 text-green-600'
                                      : 'bg-yellow-600/20 text-yellow-600'
                                      }`}
                                  >
                                    {period.fraction === 'FULL' ? 'Completo' : 'Medio'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Sustituciones */}
                          {quarterSubs.length > 0 && (
                            <div className="space-y-1 pt-2 border-t">
                              <div className="text-xs font-semibold text-muted-foreground mb-2">
                                Cambios ({quarterSubs.length})
                              </div>
                              {quarterSubs.map((sub) => {
                                const playerOut = playerNames.get(sub.player_out) || `#${sub.player_out}`
                                const playerIn = playerNames.get(sub.player_in) || `#${sub.player_in}`

                                return (
                                  <div
                                    key={sub.id}
                                    className="text-xs py-1 px-2 rounded bg-blue-600/10 text-blue-600"
                                  >
                                    🔄 <span className="font-medium">{playerOut}</span>
                                    <span className="mx-1">→</span>
                                    <span className="font-medium">{playerIn}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          Sin formación registrada
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
