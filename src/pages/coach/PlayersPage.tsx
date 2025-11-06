import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PlayerFormDialog } from './components/PlayerFormDialog'
import { listPlayers, deletePlayer, getTeamPlayerStatistics, type Player, type PlayerStatistics } from '@/services/players'
import { listCoachTeams, type Team } from '@/services/teams'

type SortColumn = 'name' | 'number' | 'training_attendance' | 'match_attendance' | 'avg_periods'
type SortDirection = 'asc' | 'desc' | null

export default function PlayersPage() {
  const { toast } = useToast()
  
  // State
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStatistics[]>([])
  const [loading, setLoading] = useState(true)
  const [playersLoading, setPlayersLoading] = useState(false)
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Load teams on mount
  useEffect(() => {
    loadTeams()
  }, [])

  // Load players when team changes
  useEffect(() => {
    if (selectedTeamId) {
      loadPlayers()
    } else {
      setPlayers([])
    }
  }, [selectedTeamId])

  const loadTeams = async () => {
    try {
      const result = await listCoachTeams()
      
      if (result.error) {
        throw result.error
      }

      setTeams(result.data || [])
      
      // Auto-select first team if available
      if (result.data && result.data.length > 0) {
        setSelectedTeamId(result.data[0].id)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al cargar equipos: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPlayers = async () => {
    if (!selectedTeamId) return
    
    setPlayersLoading(true)
    try {
      const [playersResult, statsResult] = await Promise.all([
        listPlayers(selectedTeamId),
        getTeamPlayerStatistics(selectedTeamId)
      ])
      
      if (playersResult.error) {
        throw playersResult.error
      }
      
      if (statsResult.error) {
        throw statsResult.error
      }

      setPlayers(playersResult.data || [])
      setPlayerStats(statsResult.data || [])
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al cargar jugadores: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setPlayersLoading(false)
    }
  }

  const handleCreatePlayer = () => {
    setEditingPlayer(null)
    setFormDialogOpen(true)
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player)
    setFormDialogOpen(true)
  }

  const handleDeletePlayer = (player: Player) => {
    setDeletingPlayer(player)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingPlayer) return

    setDeleteLoading(true)
    try {
      const result = await deletePlayer(deletingPlayer.id)
      
      if (result.error) {
        throw result.error
      }

      toast({
        title: "Éxito",
        description: "Jugador eliminado correctamente."
      })

      loadPlayers()
      setDeleteDialogOpen(false)
      setDeletingPlayer(null)
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al eliminar jugador: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormSave = () => {
    setFormDialogOpen(false)
    setEditingPlayer(null)
    loadPlayers()
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortedPlayers = () => {
    if (!sortColumn || !sortDirection) {
      return players
    }

    const sorted = [...players].sort((a, b) => {
      const statsA = playerStats.find(s => s.player_id === a.id)
      const statsB = playerStats.find(s => s.player_id === b.id)

      let compareValue = 0

      switch (sortColumn) {
        case 'name':
          compareValue = a.full_name.localeCompare(b.full_name)
          break
        case 'number':
          const numA = a.jersey_number || 999
          const numB = b.jersey_number || 999
          compareValue = numA - numB
          break
        case 'training_attendance':
          const trainingA = statsA ? statsA.training_attendance_pct : -1
          const trainingB = statsB ? statsB.training_attendance_pct : -1
          compareValue = trainingA - trainingB
          break
        case 'match_attendance':
          const matchA = statsA ? statsA.match_attendance_pct : -1
          const matchB = statsB ? statsB.match_attendance_pct : -1
          compareValue = matchA - matchB
          break
        case 'avg_periods':
          const avgA = statsA ? statsA.avg_periods_played : -1
          const avgB = statsB ? statsB.avg_periods_played : -1
          compareValue = avgA - avgB
          break
      }

      return sortDirection === 'asc' ? compareValue : -compareValue
    })

    return sorted
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />
    }
    return <ArrowDown className="h-4 w-4 ml-1" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando equipos...</p>
        </div>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Jugadores</h1>
          <p className="text-muted-foreground">
            Administrá los jugadores de tus equipos
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenés equipos asignados</h3>
            <p className="text-muted-foreground text-center">
              Contactá al administrador para que te asigne equipos.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Jugadores</h1>
        <p className="text-muted-foreground">
          Administrá los jugadores de tus equipos
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seleccionar Equipo</CardTitle>
              <CardDescription>
                Elegí el equipo para gestionar sus jugadores
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedTeamId?.toString() || ''} 
            onValueChange={(value) => setSelectedTeamId(parseInt(value))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Seleccionar equipo" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTeamId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Jugadores - {selectedTeam?.name}</CardTitle>
                <CardDescription>
                  {players.length} jugador{players.length !== 1 ? 'es' : ''} registrado{players.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button onClick={handleCreatePlayer}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Jugador
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {playersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                <span className="text-muted-foreground">Cargando jugadores...</span>
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay jugadores</h3>
                <p className="text-muted-foreground mb-4">
                  Este equipo no tiene jugadores registrados aún.
                </p>
                <Button onClick={handleCreatePlayer}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Jugador
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Nombre
                        <SortIcon column="name" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('number')}
                    >
                      <div className="flex items-center">
                        Número
                        <SortIcon column="number" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('training_attendance')}
                    >
                      <div className="flex items-center justify-center">
                        % Asist. Entrenamientos
                        <SortIcon column="training_attendance" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('match_attendance')}
                    >
                      <div className="flex items-center justify-center">
                        % Asist. Partidos
                        <SortIcon column="match_attendance" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('avg_periods')}
                    >
                      <div className="flex items-center justify-center">
                        Prom. Períodos
                        <SortIcon column="avg_periods" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedPlayers().map((player) => {
                    const stats = playerStats.find(s => s.player_id === player.id)
                    return (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          {player.full_name}
                        </TableCell>
                        <TableCell>
                          {player.jersey_number ? (
                            <Badge variant="outline">#{player.jersey_number}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {stats ? (
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{stats.training_attendance_pct}%</span>
                              <span className="text-xs text-muted-foreground">
                                {stats.trainings_attended}/{stats.total_trainings}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {stats ? (
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{stats.match_attendance_pct}%</span>
                              <span className="text-xs text-muted-foreground">
                                {stats.matches_called_up}/{stats.total_matches}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {stats ? (
                            <span className="font-medium">{stats.avg_periods_played}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPlayer(player)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePlayer(player)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <PlayerFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false)
          setEditingPlayer(null)
        }}
        onSave={handleFormSave}
        player={editingPlayer}
        teamId={selectedTeamId || 0}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar Jugador"
        description={`¿Estás seguro que querés eliminar a ${deletingPlayer?.full_name}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setDeletingPlayer(null)
        }}
        loading={deleteLoading}
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  )
}