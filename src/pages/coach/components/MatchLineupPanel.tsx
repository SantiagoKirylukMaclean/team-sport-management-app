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
} from '@/services/matches'
import { MatchFieldLineup } from './MatchFieldLineup'
import { Table, MapPin } from 'lucide-react'

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

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, matchId, teamId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [playersRes, periodsRes] = await Promise.all([
        listPlayers(teamId),
        listMatchPeriods(matchId),
      ])

      if (playersRes.error) throw playersRes.error
      if (periodsRes.error) throw periodsRes.error

      const playersList = playersRes.data || []
      const periodsData = periodsRes.data || []

      const mapped: PlayerPeriods[] = playersList.map((p: Player) => {
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

      setPlayers(mapped)
    } catch (err: any) {
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Jugador</th>
                  <th className="text-center p-2">Q1</th>
                  <th className="text-center p-2">Q2</th>
                  <th className="text-center p-2">Q3</th>
                  <th className="text-center p-2">Q4</th>
                  <th className="text-center p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {players.map((pp) => (
                  <tr key={pp.player.id} className="border-b">
                    <td className="p-2">
                      {pp.player.full_name}
                    </td>
                    {([1, 2, 3, 4] as const).map((period) => (
                      <td key={period} className="p-2">
                        <Select
                          value={pp.periods[period] || ''}
                          onValueChange={(val) =>
                            handlePeriodChange(
                              pp.player.id,
                              period,
                              val as PeriodFraction
                            )
                          }
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
                    <td className="text-center p-2 font-semibold">
                      {calculateTotal(pp.periods).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
