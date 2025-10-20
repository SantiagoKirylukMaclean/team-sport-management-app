import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pencil, Trash2, Plus, Calendar, ClipboardList } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TrainingFormDialog } from './components/TrainingFormDialog'
import { TrainingAttendancePanel } from './components/TrainingAttendancePanel'
import { listTrainingSessions, deleteTrainingSession, type TrainingSession } from '@/services/trainings'
import { listCoachTeams, type Team } from '@/services/teams'

export default function TrainingsPage() {
  const { toast } = useToast()
  
  // State
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingTraining, setEditingTraining] = useState<TrainingSession | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTraining, setDeletingTraining] = useState<TrainingSession | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [attendancePanelOpen, setAttendancePanelOpen] = useState(false)
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null)

  // Load teams on mount
  useEffect(() => {
    loadTeams()
  }, [])

  // Load training sessions when team changes
  useEffect(() => {
    if (selectedTeamId) {
      loadTrainingSessions()
    } else {
      setTrainingSessions([])
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

  const loadTrainingSessions = async () => {
    if (!selectedTeamId) return
    
    setSessionsLoading(true)
    try {
      const result = await listTrainingSessions(selectedTeamId)
      
      if (result.error) {
        throw result.error
      }

      setTrainingSessions(result.data || [])
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al cargar entrenamientos: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setSessionsLoading(false)
    }
  }

  const handleCreateTraining = () => {
    setEditingTraining(null)
    setFormDialogOpen(true)
  }

  const handleEditTraining = (training: TrainingSession) => {
    setEditingTraining(training)
    setFormDialogOpen(true)
  }

  const handleDeleteTraining = (training: TrainingSession) => {
    setDeletingTraining(training)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingTraining) return

    setDeleteLoading(true)
    try {
      const result = await deleteTrainingSession(deletingTraining.id)
      
      if (result.error) {
        // Handle RLS permission errors
        if (result.error.message?.includes('permission') || 
            result.error.message?.includes('policy')) {
          toast({
            title: "Sin permisos",
            description: "No tenés permisos para acceder a este recurso.",
            variant: "destructive"
          })
        } else {
          throw result.error
        }
        return
      }

      toast({
        title: "Éxito",
        description: "Entrenamiento eliminado correctamente."
      })

      loadTrainingSessions()
      setDeleteDialogOpen(false)
      setDeletingTraining(null)
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Error desconocido'
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        toast({
          title: "Error de conexión",
          description: "Verificá tu conexión a internet.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: `Error al eliminar entrenamiento: ${errorMessage}`,
          variant: "destructive"
        })
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormSave = () => {
    setFormDialogOpen(false)
    setEditingTraining(null)
    loadTrainingSessions()
  }

  const handleViewAttendance = (training: TrainingSession) => {
    setSelectedTrainingId(training.id)
    setAttendancePanelOpen(true)
  }

  const handleAttendancePanelClose = () => {
    setAttendancePanelOpen(false)
    setSelectedTrainingId(null)
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
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Entrenamientos</h1>
          <p className="text-muted-foreground">
            Administrá los entrenamientos de tus equipos
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
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
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Entrenamientos</h1>
        <p className="text-muted-foreground">
          Administrá los entrenamientos de tus equipos
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seleccionar Equipo</CardTitle>
              <CardDescription>
                Elegí el equipo para gestionar sus entrenamientos
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
                <CardTitle>Entrenamientos - {selectedTeam?.name}</CardTitle>
                <CardDescription>
                  {trainingSessions.length} entrenamiento{trainingSessions.length !== 1 ? 's' : ''} registrado{trainingSessions.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button onClick={handleCreateTraining}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Entrenamiento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                <span className="text-muted-foreground">Cargando entrenamientos...</span>
              </div>
            ) : trainingSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay entrenamientos</h3>
                <p className="text-muted-foreground mb-4">
                  Este equipo no tiene entrenamientos registrados aún.
                </p>
                <Button onClick={handleCreateTraining}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Entrenamiento
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingSessions.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">
                        {new Date(training.session_date).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>
                        {training.notes ? (
                          <span className="text-sm">{training.notes}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin notas</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAttendance(training)}
                            title="Ver Asistencia"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTraining(training)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTraining(training)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <TrainingFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false)
          setEditingTraining(null)
        }}
        onSave={handleFormSave}
        training={editingTraining}
        teamId={selectedTeamId || 0}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar Entrenamiento"
        description={`¿Estás seguro que querés eliminar el entrenamiento del ${deletingTraining ? new Date(deletingTraining.session_date).toLocaleDateString('es-AR') : ''}? Esta acción no se puede deshacer y eliminará todos los registros de asistencia asociados.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setDeletingTraining(null)
        }}
        loading={deleteLoading}
        confirmText="Eliminar"
        variant="destructive"
      />

      {/* Attendance Panel */}
      {selectedTrainingId && selectedTeamId && (
        <TrainingAttendancePanel
          open={attendancePanelOpen}
          onClose={handleAttendancePanelClose}
          trainingId={selectedTrainingId}
          teamId={selectedTeamId}
        />
      )}
    </div>
  )
}
