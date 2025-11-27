import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle, Plus, Pencil, Trash2, ClipboardList } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { listCoachTeams, type Team } from '@/services/teams'
import { listTrainingSessions, getTeamAttendanceStats, deleteTrainingSession, type TrainingSession } from '@/services/trainings'
import { getPlayersByTeam } from '@/services/players'
import { TrainingFormDialog } from './components/TrainingFormDialog'
import { TrainingAttendancePanel } from './components/TrainingAttendancePanel'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import LoadingSpinner from '@/components/ui/loading-spinner'

interface PlayerStats {
    id: number
    name: string
    jerseyNumber: number | null
    totalSessions: number
    onTime: number
    late: number
    absent: number
    notMarked: number
    attendanceRate: number
}

export default function CoachTrainingDashboard() {
    const { toast } = useToast()

    // State
    const [teams, setTeams] = useState<Team[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([])
    const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
    const [loading, setLoading] = useState(true)
    const [dataLoading, setDataLoading] = useState(false)

    // Dialog states
    const [formDialogOpen, setFormDialogOpen] = useState(false)
    const [editingTraining, setEditingTraining] = useState<TrainingSession | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletingTraining, setDeletingTraining] = useState<TrainingSession | null>(null)
    const [attendancePanelOpen, setAttendancePanelOpen] = useState(false)
    const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null)

    // Load teams on mount
    useEffect(() => {
        loadTeams()
    }, [])

    // Load data when team changes
    useEffect(() => {
        if (selectedTeamId) {
            loadTeamData()
        }
    }, [selectedTeamId])

    const loadTeams = async () => {
        try {
            const result = await listCoachTeams()
            if (result.error) throw result.error
            setTeams(result.data || [])
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

    const loadTeamData = async () => {
        if (!selectedTeamId) return

        setDataLoading(true)
        try {
            // Load sessions, players and attendance stats in parallel
            const [sessionsResult, playersResult, statsResult] = await Promise.all([
                listTrainingSessions(selectedTeamId),
                getPlayersByTeam(selectedTeamId),
                getTeamAttendanceStats(selectedTeamId)
            ])

            if (sessionsResult.error) throw sessionsResult.error
            if (playersResult.error) throw playersResult.error
            if (statsResult.error) throw statsResult.error

            const sessions = sessionsResult.data || []
            setTrainingSessions(sessions)

            // Calculate player stats
            const players = playersResult.data || []
            const attendanceRecords = statsResult.data || []

            const statsMap = new Map<number, PlayerStats>()

            // Initialize stats for all players
            players.forEach(p => {
                statsMap.set(p.id, {
                    id: p.id,
                    name: p.full_name,
                    jerseyNumber: p.jersey_number,
                    totalSessions: sessions.length,
                    onTime: 0,
                    late: 0,
                    absent: 0,
                    notMarked: sessions.length, // Start assuming all are unmarked
                    attendanceRate: 0
                })
            })

            // Update with actual records
            attendanceRecords.forEach((record: any) => {
                const stats = statsMap.get(record.player_id)
                if (stats) {
                    stats.notMarked-- // Decrease unmarked count
                    if (record.status === 'on_time') stats.onTime++
                    else if (record.status === 'late') stats.late++
                    else if (record.status === 'absent') stats.absent++
                }
            })

            // Calculate rates
            const calculatedStats = Array.from(statsMap.values()).map(stat => {
                const presentCount = stat.onTime + stat.late
                // Rate based on total sessions (or maybe just marked ones? usually total is better for strictness)
                // Let's use total sessions for now
                const rate = stat.totalSessions > 0
                    ? Math.round((presentCount / stat.totalSessions) * 100)
                    : 0
                return { ...stat, attendanceRate: rate }
            })

            setPlayerStats(calculatedStats.sort((a, b) => b.attendanceRate - a.attendanceRate))

        } catch (err: any) {
            toast({
                title: "Error",
                description: `Error al cargar datos del equipo: ${err.message}`,
                variant: "destructive"
            })
        } finally {
            setDataLoading(false)
        }
    }

    // CRUD Handlers
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
        try {
            const result = await deleteTrainingSession(deletingTraining.id)
            if (result.error) throw result.error
            toast({ title: "Éxito", description: "Entrenamiento eliminado correctamente." })
            loadTeamData()
            setDeleteDialogOpen(false)
            setDeletingTraining(null)
        } catch (err: any) {
            toast({
                title: "Error",
                description: `Error al eliminar: ${err.message}`,
                variant: "destructive"
            })
        }
    }

    const handleFormSave = () => {
        setFormDialogOpen(false)
        setEditingTraining(null)
        loadTeamData()
    }

    const handleViewAttendance = (training: TrainingSession) => {
        setSelectedTrainingId(training.id)
        setAttendancePanelOpen(true)
    }

    if (loading) {
        return <div className="flex justify-center py-12"><LoadingSpinner /></div>
    }

    if (teams.length === 0) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold">No tenés equipos asignados</h3>
                <p className="text-muted-foreground">Contactá al administrador.</p>
            </div>
        )
    }

    // Calculate global stats
    const totalSessions = trainingSessions.length
    const totalAttendance = playerStats.reduce((acc, curr) => acc + curr.onTime + curr.late, 0)
    const totalPossibleAttendance = totalSessions * playerStats.length
    const globalAttendanceRate = totalPossibleAttendance > 0
        ? Math.round((totalAttendance / totalPossibleAttendance) * 100)
        : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Panel de Entrenamiento</h1>
                    <p className="text-muted-foreground">Gestión y estadísticas de tu equipo</p>
                </div>

                {teams.length > 1 && (
                    <Select
                        value={selectedTeamId?.toString() || ''}
                        onValueChange={(value) => setSelectedTeamId(parseInt(value))}
                    >
                        <SelectTrigger className="w-[250px]">
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
                )}
            </div>

            {dataLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Entrenamientos</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalSessions}</div>
                                <p className="text-xs text-muted-foreground">Sesiones registradas</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Asistencia Global</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{globalAttendanceRate}%</div>
                                <p className="text-xs text-muted-foreground">Promedio de asistencia del equipo</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Jugadores Activos</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{playerStats.length}</div>
                                <p className="text-xs text-muted-foreground">Jugadores en el plantel</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Player Stats Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Estadísticas de Asistencia por Jugador</CardTitle>
                            <CardDescription>Desglose de asistencia por jugador en los últimos entrenamientos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Jugador</TableHead>
                                            <TableHead className="text-center">% Asistencia</TableHead>
                                            <TableHead className="text-center" title="A Tiempo">
                                                <CheckCircle2 className="h-4 w-4 mx-auto text-green-500" />
                                            </TableHead>
                                            <TableHead className="text-center" title="Tarde">
                                                <Clock className="h-4 w-4 mx-auto text-yellow-500" />
                                            </TableHead>
                                            <TableHead className="text-center" title="Ausente">
                                                <XCircle className="h-4 w-4 mx-auto text-red-500" />
                                            </TableHead>
                                            <TableHead className="text-center" title="Sin Marcar">
                                                <AlertCircle className="h-4 w-4 mx-auto text-gray-400" />
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {playerStats.map((stat) => (
                                            <TableRow key={stat.id}>
                                                <TableCell className="font-medium">
                                                    {stat.name} {stat.jerseyNumber && <span className="text-muted-foreground text-xs">#{stat.jerseyNumber}</span>}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={stat.attendanceRate >= 80 ? 'default' : stat.attendanceRate >= 50 ? 'secondary' : 'destructive'}>
                                                        {stat.attendanceRate}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center text-green-600 font-medium">{stat.onTime}</TableCell>
                                                <TableCell className="text-center text-yellow-600 font-medium">{stat.late}</TableCell>
                                                <TableCell className="text-center text-red-600 font-medium">{stat.absent}</TableCell>
                                                <TableCell className="text-center text-gray-400">{stat.notMarked}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Training Sessions List */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Sesiones de Entrenamiento</CardTitle>
                                <CardDescription>Historial y gestión de entrenamientos</CardDescription>
                            </div>
                            <Button onClick={handleCreateTraining}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Notas</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trainingSessions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    No hay entrenamientos registrados
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            trainingSessions.map((session) => (
                                                <TableRow key={session.id}>
                                                    <TableCell className="font-medium">
                                                        {new Date(session.session_date).toLocaleDateString('es-AR', {
                                                            weekday: 'short',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="max-w-[300px] truncate">
                                                        {session.notes || <span className="text-muted-foreground italic">Sin notas</span>}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => handleViewAttendance(session)} title="Asistencia">
                                                                <ClipboardList className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleEditTraining(session)} title="Editar">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTraining(session)} title="Eliminar">
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Dialogs */}
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

            <ConfirmDialog
                open={deleteDialogOpen}
                title="Eliminar Entrenamiento"
                description="¿Estás seguro? Se eliminarán todos los registros de asistencia asociados."
                onConfirm={confirmDelete}
                onCancel={() => {
                    setDeleteDialogOpen(false)
                    setDeletingTraining(null)
                }}
                confirmText="Eliminar"
                variant="destructive"
            />

            {selectedTrainingId && selectedTeamId && (
                <TrainingAttendancePanel
                    open={attendancePanelOpen}
                    onClose={() => {
                        setAttendancePanelOpen(false)
                        setSelectedTrainingId(null)
                        // Reload data to update stats after closing attendance panel
                        loadTeamData()
                    }}
                    trainingId={selectedTrainingId}
                    teamId={selectedTeamId}
                />
            )}
        </div>
    )
}
