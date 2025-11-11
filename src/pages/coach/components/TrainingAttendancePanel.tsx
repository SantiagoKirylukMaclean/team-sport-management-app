import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/ui/loading-spinner'
import EmptyState from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'
import { getPlayersByTeam, type PlayerWithTeam as Player } from '@/services/players'
import { listTrainingAttendance, upsertTrainingAttendance } from '@/services/trainings'

interface TrainingAttendancePanelProps {
  open: boolean
  onClose: () => void
  trainingId: number
  teamId: number
}

type AttendanceStatus = 'on_time' | 'late' | 'absent' | 'not_marked'

export function TrainingAttendancePanel({
  open,
  onClose,
  trainingId,
  teamId
}: TrainingAttendancePanelProps) {
  const { toast } = useToast()
  const [players, setPlayers] = useState<Player[]>([])
  const [attendance, setAttendance] = useState<Map<number, AttendanceStatus>>(new Map())
  const [loading, setLoading] = useState(true)
  const [savingPlayerId, setSavingPlayerId] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, trainingId, teamId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch players and attendance in parallel
      const [playersResult, attendanceResult] = await Promise.all([
        getPlayersByTeam(teamId),
        listTrainingAttendance(trainingId)
      ])

      if (playersResult.error) {
        throw playersResult.error
      }

      if (attendanceResult.error) {
        throw attendanceResult.error
      }

      const playersData = playersResult.data || []
      const attendanceData = attendanceResult.data || []

      setPlayers(playersData)

      // Build attendance map
      const attendanceMap = new Map<number, AttendanceStatus>()
      attendanceData.forEach((record: any) => {
        attendanceMap.set(record.player_id, record.status)
      })

      setAttendance(attendanceMap)
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Error desconocido'
      
      if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        toast({
          title: "Sin permisos",
          description: "No tenés permisos para acceder a este recurso.",
          variant: "destructive"
        })
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast({
          title: "Error de conexión",
          description: "Verificá tu conexión a internet.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: `Error al cargar datos: ${errorMessage}`,
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (playerId: number, status: AttendanceStatus) => {
    // If "not_marked" is selected, we don't save anything
    if (status === 'not_marked') {
      // Remove from local state
      setAttendance(prev => {
        const newMap = new Map(prev)
        newMap.delete(playerId)
        return newMap
      })
      return
    }

    setSavingPlayerId(playerId)
    try {
      const result = await upsertTrainingAttendance(trainingId, playerId, status)

      if (result.error) {
        throw result.error
      }

      // Update local state
      setAttendance(prev => {
        const newMap = new Map(prev)
        newMap.set(playerId, status)
        return newMap
      })

      toast({
        title: "Guardado",
        description: "Asistencia actualizada correctamente."
      })
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Error desconocido'
      
      if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        toast({
          title: "Sin permisos",
          description: "No tenés permisos para modificar esta asistencia.",
          variant: "destructive"
        })
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast({
          title: "Error de conexión",
          description: "Verificá tu conexión a internet.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: `Error al guardar asistencia: ${errorMessage}`,
          variant: "destructive"
        })
      }
    } finally {
      setSavingPlayerId(null)
    }
  }

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'on_time':
        return <Badge className="bg-green-500 hover:bg-green-600">A Tiempo</Badge>
      case 'late':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Tarde</Badge>
      case 'absent':
        return <Badge className="bg-red-500 hover:bg-red-600">Ausente</Badge>
      case 'not_marked':
        return <Badge variant="outline" className="text-gray-500">Sin Marcar</Badge>
    }
  }

  const getPlayerStatus = (playerId: number): AttendanceStatus => {
    return attendance.get(playerId) || 'not_marked'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asistencia de Entrenamiento</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Cargando asistencia..." />
          </div>
        ) : players.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Sin jugadores"
            description="Este equipo no tiene jugadores registrados. Agregá jugadores para poder marcar asistencia."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="w-24">Número</TableHead>
                  <TableHead className="w-48">Estado</TableHead>
                  <TableHead className="w-32">Asistencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => {
                  const playerStatus = getPlayerStatus(player.id)
                  const isSaving = savingPlayerId === player.id

                  return (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.full_name}</TableCell>
                      <TableCell>
                        {player.jersey_number !== null ? `#${player.jersey_number}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={playerStatus}
                          onValueChange={(value) => handleStatusChange(player.id, value as AttendanceStatus)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_marked">Sin Marcar</SelectItem>
                            <SelectItem value="on_time">A Tiempo</SelectItem>
                            <SelectItem value="late">Tarde</SelectItem>
                            <SelectItem value="absent">Ausente</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {isSaving ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          getStatusBadge(playerStatus)
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
