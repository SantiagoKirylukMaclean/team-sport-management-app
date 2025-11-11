import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Calendar, Timer, FileText, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react'

interface TrainingSession {
  id: number
  team_id: number
  session_date: string
  notes: string | null
  created_at: string
  attendance_status?: 'on_time' | 'late' | 'absent' | null
}

const Entrenamiento: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadTrainingSessions()
  }, [user])

  const loadTrainingSessions = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Get player's team ID and player ID
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id, team_id')
        .eq('user_id', user.id)
        .single()

      if (playerError) throw playerError
      if (!playerData) {
        setError('No se encontró información del jugador')
        return
      }

      const teamId = playerData.team_id
      const currentPlayerId = playerData.id

      // Get training sessions for the player's team
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('id, team_id, session_date, notes, created_at')
        .eq('team_id', teamId)
        .order('session_date', { ascending: false })

      if (sessionsError) throw sessionsError

      // Get attendance for all sessions
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('training_attendance')
        .select('training_id, status')
        .eq('player_id', currentPlayerId)

      if (attendanceError) throw attendanceError

      // Map attendance to sessions
      const attendanceMap = new Map(
        attendanceData?.map(a => [a.training_id, a.status]) || []
      )

      const sessionsWithAttendance = (sessionsData || []).map(session => ({
        ...session,
        attendance_status: attendanceMap.get(session.id) || null
      }))

      setTrainingSessions(sessionsWithAttendance)

    } catch (err: any) {
      console.error('Error loading training sessions:', err)
      setError(err.message || 'Error al cargar las sesiones de entrenamiento')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const getStatusIcon = (status: string | null | undefined) => {
    if (!status) return null
    switch (status) {
      case 'on_time':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string | null | undefined) => {
    if (!status) return 'Sin registro'
    switch (status) {
      case 'on_time':
        return 'A tiempo'
      case 'late':
        return 'Tarde'
      case 'absent':
        return 'Ausente'
      default:
        return 'Sin registro'
    }
  }

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'text-gray-600 bg-gray-50'
    switch (status) {
      case 'on_time':
        return 'text-green-600 bg-green-50'
      case 'late':
        return 'text-yellow-600 bg-yellow-50'
      case 'absent':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const handleViewDetails = (session: TrainingSession) => {
    setSelectedSession(session)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entrenamiento</h1>
          <p className="text-muted-foreground">
            Sesiones de entrenamiento de tu equipo
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const upcomingSessions = trainingSessions.filter(s => isUpcoming(s.session_date))
  const pastSessions = trainingSessions.filter(s => !isUpcoming(s.session_date))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entrenamiento</h1>
        <p className="text-muted-foreground">
          Sesiones de entrenamiento de tu equipo
        </p>
      </div>

      {/* Statistics Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Entrenamientos
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Sesiones registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Entrenamientos programados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Realizados
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Entrenamientos completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Training Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Próximos Entrenamientos</CardTitle>
            <CardDescription>
              Entrenamientos programados para las próximas fechas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">
                      {formatDate(session.session_date)}
                    </p>
                    {session.notes && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground line-clamp-2">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>{session.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(session)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <span className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-50">
                      Próximo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Training Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Entrenamientos Realizados</CardTitle>
          <CardDescription>
            Historial de entrenamientos completados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay entrenamientos realizados
            </p>
          ) : (
            <div className="space-y-3">
              {pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {session.attendance_status ? (
                    getStatusIcon(session.attendance_status)
                  ) : (
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                      <Timer className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">
                      {formatDate(session.session_date)}
                    </p>
                    {session.notes && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground line-clamp-2">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>{session.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(session)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.attendance_status)}`}>
                      {getStatusText(session.attendance_status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Entrenamiento</DialogTitle>
            <DialogDescription>
              Información completa de la sesión de entrenamiento
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Fecha</span>
                  </div>
                  <p className="font-medium">{formatDate(selectedSession.session_date)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span>Estado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSession.attendance_status && getStatusIcon(selectedSession.attendance_status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSession.attendance_status)}`}>
                      {getStatusText(selectedSession.attendance_status)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedSession.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Notas del Entrenamiento</span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm whitespace-pre-wrap">{selectedSession.notes}</p>
                  </div>
                </div>
              )}

              {!selectedSession.notes && (
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay notas adicionales para este entrenamiento
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>ID de sesión: {selectedSession.id}</span>
                  <span>Creado: {new Date(selectedSession.created_at).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Entrenamiento