import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { getPlayersByTeam, type PlayerWithTeam as Player } from '@/services/players'
import { listMatchCallUps, setMatchCallUps } from '@/services/matches'
import { Loader2 } from 'lucide-react'

type Props = {
  matchId: number
  teamId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function MatchCallUpDialog({ matchId, teamId, open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, matchId, teamId])

  async function loadData() {
    setLoading(true)
    try {
      const [playersRes, callUpsRes] = await Promise.all([
        getPlayersByTeam(teamId),
        listMatchCallUps(matchId)
      ])

      if (playersRes.error) throw playersRes.error
      if (callUpsRes.error) throw callUpsRes.error

      setPlayers(playersRes.data || [])
      setSelectedIds(new Set(callUpsRes.data?.map(c => c.player_id) || []))
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Error al cargar datos'
      })
    } finally {
      setLoading(false)
    }
  }

  function togglePlayer(playerId: number) {
    const newSet = new Set(selectedIds)
    if (newSet.has(playerId)) {
      newSet.delete(playerId)
    } else {
      newSet.add(playerId)
    }
    setSelectedIds(newSet)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await setMatchCallUps(matchId, Array.from(selectedIds))
      if (error) throw error

      toast({
        title: 'Convocatorias guardadas',
        description: `${selectedIds.size} jugador(es) convocado(s)`
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Error al guardar convocatorias'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convocar Jugadores</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Selecciona los jugadores convocados. Todos deben jugar mínimo 2 cuartos.
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-md p-4">
              {players.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No hay jugadores en el equipo
                </div>
              ) : (
                players.map(player => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`player-${player.id}`}
                      checked={selectedIds.has(player.id)}
                      onCheckedChange={() => togglePlayer(player.id)}
                    />
                    <label
                      htmlFor={`player-${player.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {player.full_name}
                      {player.jersey_number && (
                        <span className="text-muted-foreground ml-2">#{player.jersey_number}</span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-muted-foreground">
                {selectedIds.size} jugador(es) seleccionado(s)
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
