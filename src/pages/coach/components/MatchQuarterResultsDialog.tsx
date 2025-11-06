import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  listMatchQuarterResults,
  upsertMatchQuarterResult,
  listMatchGoals,
  addMatchGoal,
  deleteMatchGoal,
  listMatchCallUps,
  type Match,
  type MatchQuarterResult,
  type MatchGoal,
} from '@/services/matches'
import { listPlayers, type Player } from '@/services/players'
import { Trash2, Plus } from 'lucide-react'

type MatchQuarterResultsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: Match
  teamId: number
}

export function MatchQuarterResultsDialog({
  open,
  onOpenChange,
  match,
  teamId,
}: MatchQuarterResultsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [calledUpPlayerIds, setCalledUpPlayerIds] = useState<number[]>([])
  const [quarterResults, setQuarterResults] = useState<MatchQuarterResult[]>([])
  const [goals, setGoals] = useState<MatchGoal[]>([])
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1)

  // Estado local para los resultados del cuarto seleccionado
  const [teamGoals, setTeamGoals] = useState<number>(0)
  const [opponentGoals, setOpponentGoals] = useState<number>(0)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, match.id])

  useEffect(() => {
    // Actualizar los valores cuando cambia el cuarto seleccionado
    const result = quarterResults.find((r) => r.quarter === selectedQuarter)
    if (result) {
      setTeamGoals(result.team_goals)
      setOpponentGoals(result.opponent_goals)
    } else {
      setTeamGoals(0)
      setOpponentGoals(0)
    }
  }, [selectedQuarter, quarterResults])

  const loadData = async () => {
    setLoading(true)
    try {
      const [playersRes, callUpsRes, resultsRes, goalsRes] = await Promise.all([
        listPlayers(teamId),
        listMatchCallUps(match.id),
        listMatchQuarterResults(match.id),
        listMatchGoals(match.id),
      ])

      if (playersRes.error) throw playersRes.error
      if (callUpsRes.error) throw callUpsRes.error
      if (resultsRes.error) throw resultsRes.error
      if (goalsRes.error) throw goalsRes.error

      setPlayers(playersRes.data || [])
      setCalledUpPlayerIds((callUpsRes.data || []).map((c) => c.player_id))
      setQuarterResults(resultsRes.data || [])
      setGoals(goalsRes.data || [])
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

  const handleSaveQuarterResult = async () => {
    setSaving(true)
    try {
      const { error } = await upsertMatchQuarterResult(
        match.id,
        selectedQuarter,
        teamGoals,
        opponentGoals
      )

      if (error) throw error

      toast({
        title: 'Guardado',
        description: 'Resultado del cuarto guardado correctamente',
      })

      await loadData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al guardar resultado',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddGoal = async (scorerId: number, assisterId?: number) => {
    try {
      const { error } = await addMatchGoal(
        match.id,
        selectedQuarter,
        scorerId,
        assisterId
      )

      if (error) throw error

      toast({
        title: 'Gol agregado',
        description: 'Gol registrado correctamente',
      })

      await loadData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al agregar gol',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteGoal = async (goalId: number) => {
    try {
      const { error } = await deleteMatchGoal(goalId)

      if (error) throw error

      toast({
        title: 'Gol eliminado',
        description: 'Gol eliminado correctamente',
      })

      await loadData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al eliminar gol',
        variant: 'destructive',
      })
    }
  }

  const getPlayerName = (playerId: number) => {
    const player = players.find((p) => p.id === playerId)
    return player ? player.full_name : 'Desconocido'
  }

  const calledUpPlayers = players.filter((p) => calledUpPlayerIds.includes(p.id))
  const quarterGoals = goals.filter((g) => g.quarter === selectedQuarter)

  const getTotalScore = () => {
    const teamTotal = quarterResults.reduce((sum, r) => sum + r.team_goals, 0)
    const opponentTotal = quarterResults.reduce((sum, r) => sum + r.opponent_goals, 0)
    return { teamTotal, opponentTotal }
  }

  const { teamTotal, opponentTotal } = getTotalScore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resultados por Cuarto - {match.opponent}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="space-y-6">
            {/* Marcador Total */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold text-center mb-2">Marcador Final</h3>
              <div className="text-3xl font-bold text-center">
                {teamTotal} - {opponentTotal}
              </div>
              <div className="text-sm text-muted-foreground text-center mt-1">
                Tu equipo vs {match.opponent}
              </div>
            </div>

            {/* Selector de Cuarto */}
            <div className="space-y-2">
              <Label>Seleccionar Cuarto</Label>
              <Select
                value={selectedQuarter.toString()}
                onValueChange={(value) => setSelectedQuarter(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Cuarto 1</SelectItem>
                  <SelectItem value="2">Cuarto 2</SelectItem>
                  <SelectItem value="3">Cuarto 3</SelectItem>
                  <SelectItem value="4">Cuarto 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resultado del Cuarto */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Resultado del Cuarto {selectedQuarter}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team-goals">Goles de tu equipo</Label>
                  <Input
                    id="team-goals"
                    type="number"
                    min="0"
                    value={teamGoals}
                    onChange={(e) => setTeamGoals(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opponent-goals">Goles de {match.opponent}</Label>
                  <Input
                    id="opponent-goals"
                    type="number"
                    min="0"
                    value={opponentGoals}
                    onChange={(e) => setOpponentGoals(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveQuarterResult}
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Guardando...' : 'Guardar Resultado del Cuarto'}
              </Button>
            </div>

            {/* Goles del Equipo */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Goles de tu equipo en Cuarto {selectedQuarter}</h3>
              
              {calledUpPlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay jugadores convocados. Primero debes convocar jugadores para este partido.
                </p>
              ) : (
                <GoalForm
                  players={calledUpPlayers}
                  onAddGoal={handleAddGoal}
                />
              )}

              {/* Lista de Goles */}
              {quarterGoals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Goles registrados:</h4>
                  <div className="space-y-2">
                    {quarterGoals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center justify-between bg-muted p-3 rounded"
                      >
                        <div className="text-sm">
                          <span className="font-medium">
                            ⚽ {getPlayerName(goal.scorer_id)}
                          </span>
                          {goal.assister_id && (
                            <span className="text-muted-foreground">
                              {' '}(Asistencia: {getPlayerName(goal.assister_id)})
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resumen por Cuartos */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Resumen por Cuartos</h3>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((q) => {
                  const result = quarterResults.find((r) => r.quarter === q)
                  return (
                    <div
                      key={q}
                      className={`text-center p-3 rounded ${
                        q === selectedQuarter ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      <div className="text-xs font-medium mb-1">Q{q}</div>
                      <div className="text-lg font-bold">
                        {result ? `${result.team_goals}-${result.opponent_goals}` : '-'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Componente auxiliar para el formulario de agregar gol
function GoalForm({
  players,
  onAddGoal,
}: {
  players: Player[]
  onAddGoal: (scorerId: number, assisterId?: number) => Promise<void>
}) {
  const [scorerId, setScorerId] = useState<string | undefined>(undefined)
  const [assisterId, setAssisterId] = useState<string | undefined>(undefined)
  const [adding, setAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scorerId) return

    setAdding(true)
    try {
      await onAddGoal(
        parseInt(scorerId),
        assisterId ? parseInt(assisterId) : undefined
      )
      setScorerId(undefined)
      setAssisterId(undefined)
    } finally {
      setAdding(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="scorer">Goleador *</Label>
          <Select value={scorerId} onValueChange={setScorerId}>
            <SelectTrigger id="scorer">
              <SelectValue placeholder="Seleccionar jugador" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id.toString()}>
                  {player.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assister">Asistidor (opcional)</Label>
          <Select value={assisterId} onValueChange={(value) => setAssisterId(value === 'none' ? undefined : value)}>
            <SelectTrigger id="assister">
              <SelectValue placeholder="Sin asistencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin asistencia</SelectItem>
              {players
                .filter((p) => p.id.toString() !== scorerId)
                .map((player) => (
                  <SelectItem key={player.id} value={player.id.toString()}>
                    {player.full_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={!scorerId || adding} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        {adding ? 'Agregando...' : 'Agregar Gol'}
      </Button>
    </form>
  )
}
