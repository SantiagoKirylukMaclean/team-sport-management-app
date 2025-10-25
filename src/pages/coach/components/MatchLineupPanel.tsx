import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { listPlayers, type Player } from '@/services/players'
import {
  listMatchPeriods,
  upsertMatchPeriod,
  type PeriodFraction,
  listMatchCallUps,
  validateMatchMinimumPeriods,
  type ValidationResult,
} from '@/services/matches'
import { MatchFieldLineup } from './MatchFieldLineup'
import { Table, MapPin, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: number
  teamId: number
}

type PlayerPeriods = {
  player: Player
  periods: Record<1 | 2 | 3 | 4, PeriodFraction | null>
}

export function MatchLineupPanel({ open, onOpenChange, matchId, teamId }: Props) {
  const { toast } = useToast()
  const [players, setPlayers] = useState<PlayerPeriods[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'field'>('table')
  const [validationErrors, setValidationErrors] = useState<ValidationResult[]>([])
  const [calledUpCount, setCalledUpCount] = useState(0)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, matchId, teamId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [playersRes, periodsRes, callUpsRes, validationRes] = await Promise.all([
        listPlayers(teamId),
        listMatchPeriods(matchId),
        listMatchCallUps(matchId),
        validateMatchMinimumPeriods(matchId),
      ])

      if (playersRes.error) throw playersRes.error
      if (periodsRes.error) throw periodsRes.error
      if (callUpsRes.error) throw callUpsRes.error

      const playersList = playersRes.data || []
      const periodsData = periodsRes.data || []
      const callUpsData = callUpsRes.data || []
      const validationData = validationRes.data || []

      // Filtrar solo jugadores convocados
      const calledUpPlayers = playersList.filter((p: Player) => 
        callUpsData.some(c => c.player_id === p.id)
      )

      const mapped: PlayerPeriods[] = calledUpPlayers.map((p: Player) => {
        const periods: Record<1 | 2 | 3 | 4, PeriodFraction | null> = {
          1: null,
          2: null,
          3: null,
          4: null,
        }
        periodsData
          .filter((pd: any) => pd.player_id === p.id)
          .forEach((pd: any) => {
            periods[pd.period as 1 | 2 | 3 | 4] = pd.fraction as PeriodFraction
          })
        return { player: p, periods }
      })

      console.log('Jugadores convocados cargados:', mapped)
      console.log('Primer jugador:', mapped[0])
      
      setPlayers(mapped)
      setValidationErrors(validationData)
      setCalledUpCount(callUpsData.length)
    } catch (err: any) {
      console.error('Error al cargar datos:', err)
      toast({ title: 'Error', description: err.message || 'Error al cargar datos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = async (
    playerId: number,
    period: 1 | 2 | 3 | 4,
    fraction: PeriodFraction | null
  ) => {
    if (!fraction) return

    // Validar mínimo 7 jugadores convocados
    if (calledUpCount < 7) {
      toast({
        variant: 'destructive',
        title: 'Convocatoria incompleta',
        description: 'Debes convocar al menos 7 jugadores antes de asignar minutos.'
      })
      return
    }

    try {
      const { error } = await upsertMatchPeriod(matchId, playerId, period, fraction)
      if (error) throw error

      setPlayers((prev) =>
        prev.map((pp) =>
          pp.player.id === playerId
            ? { ...pp, periods: { ...pp.periods, [period]: fraction } }
            : pp
        )
      )

      // Revalidar después de cambiar
      const validationRes = await validateMatchMinimumPeriods(matchId)
      setValidationErrors(validationRes.data || [])

      toast({ title: 'Éxito', description: 'Minutos actualizados' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al guardar minutos', variant: 'destructive' })
    }
  }

  const calculateTotal = (periods: Record<1 | 2 | 3 | 4, PeriodFraction | null>) => {
    let total = 0
    Object.values(periods).forEach((f) => {
      if (f === 'FULL') total += 1.0
      else if (f === 'HALF') total += 0.5
    })
    return total
  }

  // Si el modo es cancha, mostrar el componente de cancha
  if (viewMode === 'field') {
    return (
      <MatchFieldLineup
        open={open}
        onOpenChange={onOpenChange}
        matchId={matchId}
        teamId={teamId}
        onSwitchToTable={() => setViewMode('table')}
      />
    )
  }

  // Vista de tabla
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Minutos por Cuarto</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => setViewMode('table')}
              >
                <Table className="h-4 w-4 mr-1" />
                Tabla
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewMode('field')}
                disabled={calledUpCount < 7}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Cancha
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="space-y-4">
            {calledUpCount < 7 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">
                    Convocatoria incompleta
                  </div>
                  <div>
                    Debes convocar al menos 7 jugadores para poder asignar minutos.
                    Actualmente tienes {calledUpCount} jugador(es) convocado(s).
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">
                    Jugadores convocados que no cumplen mínimo 2 cuartos:
                  </div>
                  <ul className="list-disc list-inside">
                    {validationErrors.map((err) => (
                      <li key={err.player_id}>
                        {err.full_name}: {err.periods_played} cuarto(s)
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {players.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-muted-foreground">
                  No hay jugadores convocados.
                </div>
                <div className="text-sm text-muted-foreground">
                  Cierra este panel y usa el botón <span className="font-semibold">👤✓ Convocar</span> en la lista de partidos para seleccionar jugadores.
                </div>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Volver a Partidos
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-100 dark:bg-gray-700">
                      <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Jugador</th>
                      <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Q1</th>
                      <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Q2</th>
                      <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Q3</th>
                      <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Q4</th>
                      <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((pp) => {
                      const total = calculateTotal(pp.periods)
                      const hasError = validationErrors.some(e => e.player_id === pp.player.id)
                      return (
                        <tr key={pp.player.id} className={`border-b ${hasError ? 'bg-red-50 dark:bg-red-950' : 'bg-white dark:bg-gray-800'}`}>
                          <td className="p-3 min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {pp.player.full_name || `Jugador #${pp.player.id}`}
                              </span>
                              {hasError && (
                                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                          </td>
                          {([1, 2, 3, 4] as const).map((period) => (
                            <td key={period} className="p-3 text-center">
                              <Select
                                value={pp.periods[period] || ''}
                                onValueChange={(val) =>
                                  handlePeriodChange(
                                    pp.player.id,
                                    period,
                                    val as PeriodFraction
                                  )
                                }
                                disabled={calledUpCount < 7}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FULL">FULL</SelectItem>
                                  <SelectItem value="HALF">HALF</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          ))}
                          <td className={`text-center p-3 font-semibold ${hasError ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {total.toFixed(1)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
