import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, FileText, Plus, Filter } from 'lucide-react'
import { getPlayersWithEvaluations } from '@/services/evaluations'
import { useNavigate } from 'react-router-dom'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import PlayerEvaluationHistory from '@/components/evaluations/PlayerEvaluationHistory'

interface PlayerSummary {
    player_id: number
    full_name: string
    jersey_number: number | null
    team_name: string
    team_id: number
    evaluation_count: number
    last_evaluation_date: string
}

const CoachEvaluationsList: React.FC = () => {
    const { toast } = useToast()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [players, setPlayers] = useState<PlayerSummary[]>([])
    const [filteredPlayers, setFilteredPlayers] = useState<PlayerSummary[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [teamFilter, setTeamFilter] = useState<string>('all')
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerSummary | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        filterData()
    }, [searchTerm, teamFilter, players])

    const loadData = async () => {
        try {
            setLoading(true)
            const data = await getPlayersWithEvaluations()
            setPlayers(data)
            setFilteredPlayers(data)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Error loading evaluations list',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const filterData = () => {
        let filtered = [...players]

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            filtered = filtered.filter(p =>
                p.full_name.toLowerCase().includes(lowerTerm) ||
                p.team_name.toLowerCase().includes(lowerTerm)
            )
        }

        if (teamFilter !== 'all') {
            filtered = filtered.filter(p => p.team_id.toString() === teamFilter)
        }

        setFilteredPlayers(filtered)
    }

    // Get unique teams for filter
    const teams = Array.from(new Set(players.map(p => JSON.stringify({ id: p.team_id, name: p.team_name }))))
        .map(t => JSON.parse(t))
        .sort((a, b) => a.name.localeCompare(b.name))

    const handleViewDetails = (player: PlayerSummary) => {
        setSelectedPlayer(player)
        setDetailsOpen(true)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Evaluaciones de Jugadores</h1>
                    <p className="text-muted-foreground">
                        Gestión y seguimiento del rendimiento de jugadores
                    </p>
                </div>
                <Button onClick={() => navigate('/coach/evaluations')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Evaluación
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Jugadores Evaluados</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o equipo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="w-full md:w-64">
                            <Select value={teamFilter} onValueChange={setTeamFilter}>
                                <SelectTrigger>
                                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Filtrar por equipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los equipos</SelectItem>
                                    {teams.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {filteredPlayers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {searchTerm || teamFilter !== 'all'
                                ? 'No se encontraron jugadores con los filtros seleccionados.'
                                : 'No hay evaluaciones registradas aún.'}
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Jugador</TableHead>
                                        <TableHead>Equipo</TableHead>
                                        <TableHead className="text-center">Evaluaciones</TableHead>
                                        <TableHead>Última Evaluación</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPlayers.map((player) => (
                                        <TableRow key={player.player_id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="font-medium">{player.full_name}</div>
                                                {player.jersey_number && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        #{player.jersey_number}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{player.team_name}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">
                                                    {player.evaluation_count}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(player.last_evaluation_date).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(player)}
                                                >
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Ver Detalle
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Historial de Evaluaciones</DialogTitle>
                        <DialogDescription>
                            {selectedPlayer?.full_name} - {selectedPlayer?.team_name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPlayer && (
                        <PlayerEvaluationHistory playerId={selectedPlayer.player_id} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CoachEvaluationsList
