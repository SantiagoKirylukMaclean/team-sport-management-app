import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { listTeams, type Team } from '@/services/teams'
import { listMatches, deleteMatch, type Match } from '@/services/matches'
import { MatchFormDialog } from './components/MatchFormDialog'
import { MatchLineupPanel } from './components/MatchLineupPanel'
import { MatchCallUpDialog } from './components/MatchCallUpDialog'
import { Trash2, Edit, Users, UserCheck } from 'lucide-react'

export default function MatchesPage() {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [lineupOpen, setLineupOpen] = useState(false)
  const [callUpOpen, setCallUpOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [lineupMatchId, setLineupMatchId] = useState<number | null>(null)
  const [callUpMatchId, setCallUpMatchId] = useState<number | null>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      loadMatches()
    }
  }, [selectedTeamId])

  const loadTeams = async () => {
    try {
      const { data, error } = await listTeams()
      if (error) throw error
      setTeams(data || [])
      if (data && data.length > 0) {
        setSelectedTeamId(data[0].id)
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al cargar equipos', variant: 'destructive' })
    }
  }

  const loadMatches = async () => {
    if (!selectedTeamId) return
    setLoading(true)
    try {
      const { data, error } = await listMatches(selectedTeamId)
      if (error) throw error
      setMatches(data || [])
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al cargar partidos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este partido?')) return
    try {
      const { error } = await deleteMatch(id)
      if (error) throw error
      toast({ title: 'Éxito', description: 'Partido eliminado' })
      loadMatches()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al eliminar partido', variant: 'destructive' })
    }
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditingMatch(null)
    setFormOpen(true)
  }

  const handleLineup = (matchId: number) => {
    setLineupMatchId(matchId)
    setLineupOpen(true)
  }

  const handleCallUp = (matchId: number) => {
    setCallUpMatchId(matchId)
    setCallUpOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partidos</h1>
        <Button onClick={handleNew} disabled={!selectedTeamId}>
          Nuevo Partido
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <label className="font-medium">Equipo:</label>
        <Select
          value={selectedTeamId?.toString() || ''}
          onValueChange={(val) => setSelectedTeamId(Number(val))}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar equipo" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay partidos registrados
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Oponente</th>
                <th className="text-left p-3">Lugar</th>
                <th className="text-left p-3">Notas</th>
                <th className="text-right p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{m.match_date}</td>
                  <td className="p-3">{m.opponent}</td>
                  <td className="p-3">{m.location || '-'}</td>
                  <td className="p-3">{m.notes || '-'}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCallUp(m.id)}
                        title="Convocar"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLineup(m.id)}
                        title="Minutos"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(m)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(m.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTeamId && (
        <>
          <MatchFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            teamId={selectedTeamId}
            match={editingMatch}
            onSuccess={loadMatches}
          />
          {callUpMatchId && (
            <MatchCallUpDialog
              open={callUpOpen}
              onOpenChange={setCallUpOpen}
              matchId={callUpMatchId}
              teamId={selectedTeamId}
              onSuccess={loadMatches}
            />
          )}
          {lineupMatchId && (
            <MatchLineupPanel
              open={lineupOpen}
              onOpenChange={setLineupOpen}
              matchId={lineupMatchId}
              teamId={selectedTeamId}
            />
          )}
        </>
      )}
    </div>
  )
}
