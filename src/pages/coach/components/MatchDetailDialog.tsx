import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  listMatchCallUpsWithPeriods, 
  listMatchPeriods,
  type CallUpWithPeriods, 
  type Match,
  type MatchPlayerPeriod 
} from '@/services/matches'
import { getPlayersByTeam, type PlayerWithTeam as Player } from '@/services/players'
import { CheckCircle2, Circle, CircleDot } from 'lucide-react'

type MatchDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: Match
  teamId: number
}

export function MatchDetailDialog({
  open,
  onOpenChange,
  match,
  teamId,
}: MatchDetailDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [callUps, setCallUps] = useState<CallUpWithPeriods[]>([])
  const [periods, setPeriods] = useState<MatchPlayerPeriod[]>([])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, match.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [playersRes, callUpsRes, periodsRes] = await Promise.all([
        getPlayersByTeam(teamId),
        listMatchCallUpsWithPeriods(match.id),
        listMatchPeriods(match.id),
      ])

      if (playersRes.error) throw playersRes.error
      if (callUpsRes.error) throw callUpsRes.error
      if (periodsRes.error) throw periodsRes.error

      setPlayers(playersRes.data || [])
      setCallUps(callUpsRes.data || [])
      setPeriods(periodsRes.data || [])
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

  const getPlayerName = (playerId: number) => {
    const player = players.find((p) => p.id === playerId)
    return player ? player.full_name : 'Desconocido'
  }

  const getPeriodFraction = (playerId: number, period: number): 'FULL' | 'HALF' | null => {
    const periodData = periods.find(
      (p) => p.player_id === playerId && p.period === period
    )
    return periodData ? periodData.fraction : null
  }

  const calculatePeriodsPlayed = (playerId: number): number => {
    const playerPeriods = periods.filter((p) => p.player_id === playerId)
    let total = 0
    
    playerPeriods.forEach((period) => {
      if (period.fraction === 'FULL') {
        total += 1
      } else if (period.fraction === 'HALF') {
        total += 0.5
      }
    })
    
    return total
  }

  const renderPeriodIndicator = (playerId: number, period: number) => {
    const fraction = getPeriodFraction(playerId, period)
    
    if (fraction === 'FULL') {
      return (
        <div className="flex flex-col items-center">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-xs text-muted-foreground mt-0.5">Completo</span>
        </div>
      )
    } else if (fraction === 'HALF') {
      return (
        <div className="flex flex-col items-center">
          <CircleDot className="h-5 w-5 text-yellow-600" />
          <span className="text-xs text-muted-foreground mt-0.5">Medio</span>
        </div>
      )
    } else {
      return <Circle className="h-5 w-5 text-gray-300 mx-auto" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Partido</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del partido */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Información General</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fecha:</span> {match.match_date}
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

          {/* Estadísticas de jugadores */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Cuartos Jugados por Jugador</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Completo</span>
                </div>
                <div className="flex items-center gap-1">
                  <CircleDot className="h-4 w-4 text-yellow-600" />
                  <span>Medio</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="h-4 w-4 text-gray-300" />
                  <span>No jugó</span>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-4">Cargando...</div>
            ) : callUps.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay jugadores convocados para este partido
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Jugador</th>
                      <th className="text-center p-3">Cuartos Jugados</th>
                      <th className="text-center p-3">Q1</th>
                      <th className="text-center p-3">Q2</th>
                      <th className="text-center p-3">Q3</th>
                      <th className="text-center p-3">Q4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callUps
                      .sort((a, b) => {
                        const periodsA = calculatePeriodsPlayed(a.player_id)
                        const periodsB = calculatePeriodsPlayed(b.player_id)
                        return periodsB - periodsA
                      })
                      .map((callUp) => {
                        const periodsPlayed = calculatePeriodsPlayed(callUp.player_id)
                        return (
                          <tr key={callUp.player_id} className="border-t">
                            <td className="p-3">{getPlayerName(callUp.player_id)}</td>
                            <td className="p-3 text-center font-semibold">
                              {periodsPlayed % 1 === 0 ? periodsPlayed : periodsPlayed.toFixed(1)}
                            </td>
                          <td className="p-3 text-center">
                            {renderPeriodIndicator(callUp.player_id, 1)}
                          </td>
                          <td className="p-3 text-center">
                            {renderPeriodIndicator(callUp.player_id, 2)}
                          </td>
                          <td className="p-3 text-center">
                            {renderPeriodIndicator(callUp.player_id, 3)}
                          </td>
                          <td className="p-3 text-center">
                            {renderPeriodIndicator(callUp.player_id, 4)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
