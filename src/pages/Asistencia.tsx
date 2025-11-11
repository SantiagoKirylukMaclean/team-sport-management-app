import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, CheckCircle2, XCircle, Clock, Trophy, Timer } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TrainingAttendance {
  training_id: number
  status: 'on_time' | 'late' | 'absent'
  training_sessions: {
    session_date: string
    notes: string | null
  }
}

interface MatchCallUp {
  match_id: number
  created_at: string
  matches: {
    match_date: string
    opponent: string
    location: string
  }
}

interface AttendanceStats {
  totalTrainings: number
  onTime: number
  late: number
  absent: number
  attendanceRate: number
  totalMatches: number
}

const Asistencia: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [trainingAttendance, setTrainingAttendance] = useState<TrainingAttendance[]>([])
  const [matchCallUps, setMatchCallUps] = useState<MatchCallUp[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAttendanceData()
  }, [user])

  const loadAttendanceData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Get player ID for current user
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (playerError) throw playerError
      if (!playerData) {
        setError('No se encontró información del jugador')
        return
      }

      const playerId = playerData.id

      // Get training attendance
      const { data: trainingData, error: trainingError } = await supabase
        .from('training_attendance')
        .select(`
          training_id,
          status,
          training_sessions!inner(
            session_date,
            notes
          )
        `)
        .eq('player_id', playerId)
        .order('training_sessions(session_date)', { ascending: false })

      if (trainingError) throw trainingError

      // Get match call ups
      const { data: matchData, error: matchError } = await supabase
        .from('match_call_ups')
        .select(`
          match_id,
          created_at,
          matches!inner(
            match_date,
            opponent,
            location
          )
        `)
        .eq('player_id', playerId)
        .order('matches(match_date)', { ascending: false })

      if (matchError) throw matchError

      // Transform data to match interface types
      const transformedTrainingData = (trainingData || []).map(item => ({
        training_id: item.training_id,
        status: item.status,
        training_sessions: Array.isArray(item.training_sessions) 
          ? item.training_sessions[0] 
          : item.training_sessions
      }))

      const transformedMatchData = (matchData || []).map(item => ({
        match_id: item.match_id,
        created_at: item.created_at,
        matches: Array.isArray(item.matches) 
          ? item.matches[0] 
          : item.matches
      }))

      setTrainingAttendance(transformedTrainingData as TrainingAttendance[])
      setMatchCallUps(transformedMatchData as MatchCallUp[])

      // Calculate stats
      const totalTrainings = trainingData?.length || 0
      const onTime = trainingData?.filter(t => t.status === 'on_time').length || 0
      const late = trainingData?.filter(t => t.status === 'late').length || 0
      const absent = trainingData?.filter(t => t.status === 'absent').length || 0
      const attendanceRate = totalTrainings > 0 
        ? Math.round(((onTime + late) / totalTrainings) * 100) 
        : 0

      setStats({
        totalTrainings,
        onTime,
        late,
        absent,
        attendanceRate,
        totalMatches: matchData?.length || 0
      })

    } catch (err: any) {
      console.error('Error loading attendance:', err)
      setError(err.message || 'Error al cargar la información de asistencia')
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

  const getStatusIcon = (status: string) => {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'A tiempo'
      case 'late':
        return 'Tarde'
      case 'absent':
        return 'Ausente'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
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
          <h1 className="text-3xl font-bold tracking-tight">Asistencia</h1>
          <p className="text-muted-foreground">
            Tu historial de asistencia a entrenamientos y partidos
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asistencia</h1>
        <p className="text-muted-foreground">
          Tu historial de asistencia a entrenamientos y partidos
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Entrenamientos
              </CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrainings}</div>
              <p className="text-xs text-muted-foreground">
                Total registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasa de Asistencia
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.onTime + stats.late} de {stats.totalTrainings}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Partidos
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMatches}</div>
              <p className="text-xs text-muted-foreground">
                Convocatorias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ausencias
              </CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.absent}</div>
              <p className="text-xs text-muted-foreground">
                Entrenamientos perdidos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for Training and Matches */}
      <Tabs defaultValue="trainings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trainings">
            <Timer className="h-4 w-4 mr-2" />
            Entrenamientos
          </TabsTrigger>
          <TabsTrigger value="matches">
            <Trophy className="h-4 w-4 mr-2" />
            Partidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trainings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Entrenamientos</CardTitle>
              <CardDescription>
                Registro completo de tu asistencia a entrenamientos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trainingAttendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay registros de entrenamientos
                </p>
              ) : (
                <div className="space-y-3">
                  {trainingAttendance.map((attendance) => (
                    <div
                      key={attendance.training_id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(attendance.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">
                              {formatDate(attendance.training_sessions.session_date)}
                            </p>
                          </div>
                          {attendance.training_sessions.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {attendance.training_sessions.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(attendance.status)}`}>
                          {getStatusText(attendance.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convocatorias a Partidos</CardTitle>
              <CardDescription>
                Partidos en los que has sido convocado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matchCallUps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay convocatorias registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {matchCallUps.map((callUp) => (
                    <div
                      key={callUp.match_id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Trophy className="h-5 w-5 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">
                              {formatDate(callUp.matches.match_date)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            vs {callUp.matches.opponent} • {callUp.matches.location}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-50">
                          Convocado
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Asistencia
