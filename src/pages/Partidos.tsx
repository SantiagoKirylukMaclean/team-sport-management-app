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
import { 
  listMatches, 
  listMatchQuarterResults, 
  type Match,
  type MatchQuarterResult 
} from '@/services/matches'
import { PartidosDetailDialog } from '@/pages/components/PartidosDetailDialog'
import { FileText, Trophy, TrendingUp, Target } from 'lucide-react'

type MatchWithResult = Match & {
  result?: 'win' | 'draw' | 'loss' | null
  teamGoals?: number
  opponentGoals?: number
  quarterResults?: MatchQuarterResult[]
}

const Partidos: React.FC = () => {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [matches, setMatches] = useState<MatchWithResult[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailMatch, setDetailMatch] = useState<MatchWithResult | null>(null)

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
      toast({ 
        title: 'Error', 
        description: err.message || 'Error al cargar equipos', 
        variant: 'destructive' 
      })
    }
  }

  const loadMatches = async () => {
    if (!selectedTeamId) return
    setLoading(true)
    try {
      const { data, error } = await listMatches(selectedTeamId)
      if (error) throw error
      
      // Cargar resultados para cada partido
      const matchesWithResults = await Promise.all(
        (data || []).map(async (match) => {
          const { data: quarters } = await listMatchQuarterResults(match.id)
          
          if (!quarters || quarters.length === 0) {
            return { 
              ...match, 
              result: null, 
              teamGoals: undefined, 
              opponentGoals: undefined,
              quarterResults: []
            }
          }
          
          // Calcular totales
          const totalTeamGoals = quarters.reduce((sum, q) => sum + q.team_goals, 0)
          const totalOpponentGoals = quarters.reduce((sum, q) => sum + q.opponent_goals, 0)
          
          let result: 'win' | 'draw' | 'loss' | null = null
          if (totalTeamGoals > totalOpponentGoals) {
            result = 'win'
          } else if (totalTeamGoals === totalOpponentGoals) {
            result = 'draw'
          } else {
            result = 'loss'
          }
          
          return { 
            ...match, 
            result, 
            teamGoals: totalTeamGoals, 
            opponentGoals: totalOpponentGoals,
            quarterResults: quarters
          }
        })
      )
      
      // Ordenar por fecha descendente (más reciente primero)
      const sortedData = matchesWithResults.sort((a, b) => {
        return new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
      })
      setMatches(sortedData)
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Error al cargar partidos', 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDetail = (match: MatchWithResult) => {
    setDetailMatch(match)
    setDetailOpen(true)
  }
  
  const getRowClassName = (result: 'win' | 'draw' | 'loss' | null | undefined) => {
    if (!result) return ''
    if (result === 'win') return 'bg-green-500/20 hover:bg-green-500/30'
    if (result === 'draw') return 'bg-white/5 hover:bg-white/10'
    if (result === 'loss') return 'bg-red-500/20 hover:bg-red-500/30'
    return ''
  }

  const getResultBadge = (result: 'win' | 'draw' | 'loss' | null | undefined) => {
    if (!result) return null
    if (result === 'win') return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-600 text-white">Victoria</span>
    if (result === 'draw') return <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-600 text-white">Empate</span>
    if (result === 'loss') return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-600 text-white">Derrota</span>
    return null
  }

  // Calcular estadísticas
  const stats = {
    totalMatches: matches.filter(m => m.result !== null).length,
    wins: matches.filter(m => m.result === 'win').length,
    draws: matches.filter(m => m.result === 'draw').length,
    losses: matches.filter(m => m.result === 'loss').length,
    goalsFor: matches.reduce((sum, m) => sum + (m.teamGoals || 0), 0),
    goalsAgainst: matches.reduce((sum, m) => sum + (m.opponentGoals || 0), 0),
  }

  const winPercentage = stats.totalMatches > 0 
    ? ((stats.wins / stats.totalMatches) * 100).toFixed(1) 
    : '0.0'
  
  const goalDifference = stats.goalsFor - stats.goalsAgainst

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Partidos</h1>
        <p className="text-muted-foreground">
          Información completa de partidos y resultados
        </p>
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
          No hay partidos registrados para este equipo
        </div>
      ) : (
        <>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Partidos Jugados */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Partidos Jugados</h3>
                <Trophy className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold">{stats.totalMatches}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.wins}V - {stats.draws}E - {stats.losses}D
                </p>
              </div>
            </div>

            {/* % Victorias */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">% Victorias</h3>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold">{winPercentage}%</p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ width: `${winPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Diferencia de Goles */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Diferencia de Goles</h3>
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className={`text-4xl font-bold ${goalDifference > 0 ? 'text-green-500' : goalDifference < 0 ? 'text-red-500' : ''}`}>
                  {goalDifference > 0 ? '+' : ''}{goalDifference}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.goalsFor} a favor - {stats.goalsAgainst} en contra
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de partidos */}
          <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Oponente</th>
                <th className="text-left p-3">Lugar</th>
                <th className="text-center p-3">Resultado</th>
                <th className="text-center p-3">Estado</th>
                <th className="text-right p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className={`border-t transition-colors ${getRowClassName(m.result)}`}>
                  <td className="p-3">{new Date(m.match_date).toLocaleDateString('es-ES')}</td>
                  <td className="p-3 font-semibold">{m.opponent}</td>
                  <td className="p-3">{m.location || '-'}</td>
                  <td className="p-3 text-center font-bold text-lg">
                    {m.teamGoals !== undefined && m.opponentGoals !== undefined
                      ? `${m.teamGoals} - ${m.opponentGoals}`
                      : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {getResultBadge(m.result)}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDetail(m)}
                        title="Ver detalle"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Detalle
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {detailMatch && (
        <PartidosDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          match={detailMatch}
          teamId={selectedTeamId!}
        />
      )}
    </div>
  )
}

export default Partidos