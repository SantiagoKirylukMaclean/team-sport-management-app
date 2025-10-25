import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { listPlayers, type Player } from '@/services/players'
import {
  listMatchPeriods,
  upsertMatchPeriod,
  type PeriodFraction,
  listMatchCallUps,
} from '@/services/matches'
import { Table, MapPin, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: number
  teamId: number
  onSwitchToTable?: () => void
}

type PlayerWithPeriod = Player & {
  currentPeriod: PeriodFraction | null
}

type FieldPosition = {
  x: number
  y: number
}

export function MatchFieldLineup({ open, onOpenChange, matchId, teamId, onSwitchToTable }: Props) {
  const { toast } = useToast()
  const [players, setPlayers] = useState<PlayerWithPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<1 | 2 | 3 | 4>(1)
  const [fieldPlayers, setFieldPlayers] = useState<Map<number, FieldPosition>>(new Map())
  const [benchPlayers, setBenchPlayers] = useState<Set<number>>(new Set())
  const [draggedPlayer, setDraggedPlayer] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [calledUpCount, setCalledUpCount] = useState(0)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, matchId, teamId])

  useEffect(() => {
    if (players.length > 0) {
      updatePlayerPositions()
    }
  }, [selectedPeriod])

  const loadData = async () => {
    setLoading(true)
    try {
      const [playersRes, periodsRes, callUpsRes] = await Promise.all([
        listPlayers(teamId),
        listMatchPeriods(matchId),
        listMatchCallUps(matchId),
      ])

      if (playersRes.error) throw playersRes.error
      if (periodsRes.error) throw periodsRes.error
      if (callUpsRes.error) throw callUpsRes.error

      const playersList = playersRes.data || []
      const periodsData = periodsRes.data || []
      const callUpsData = callUpsRes.data || []

      // Guardar conteo de convocados
      setCalledUpCount(callUpsData.length)

      // Filtrar solo jugadores convocados
      const calledUpPlayerIds = new Set(callUpsData.map(c => c.player_id))
      const calledUpPlayers = playersList.filter((p: Player) => calledUpPlayerIds.has(p.id))

      // Crear mapa de todos los períodos por jugador
      const allPeriodsMap = new Map<number, Record<number, PeriodFraction>>()
      periodsData.forEach((pd: any) => {
        if (!allPeriodsMap.has(pd.player_id)) {
          allPeriodsMap.set(pd.player_id, {})
        }
        allPeriodsMap.get(pd.player_id)![pd.period] = pd.fraction
      })

      const mapped: PlayerWithPeriod[] = calledUpPlayers.map((p: Player) => {
        const playerPeriods = allPeriodsMap.get(p.id) || {}
        return {
          ...p,
          currentPeriod: playerPeriods[selectedPeriod] || null,
        }
      })

      setPlayers(mapped)
      
      // Debug: ver qué jugadores tenemos
      console.log('Jugadores convocados:', mapped.length)
      console.log('Jugadores:', mapped)
      
      // Actualizar posiciones basado en el período actual
      const newField = new Map<number, FieldPosition>()
      const newBench = new Set<number>()
      
      mapped.forEach((player) => {
        if (player.currentPeriod === 'FULL') {
          const existingCount = newField.size
          newField.set(player.id, getDefaultPosition(existingCount))
        } else if (player.currentPeriod === 'HALF') {
          newBench.add(player.id)
        }
      })
      
      console.log('Campo:', newField.size, 'Banco:', newBench.size, 'Disponibles:', mapped.length - newField.size - newBench.size)
      
      setFieldPlayers(newField)
      setBenchPlayers(newBench)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al cargar datos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePlayerPositions = async () => {
    // Recargar datos para el nuevo período
    try {
      const [playersRes, periodsRes] = await Promise.all([
        listPlayers(teamId),
        listMatchPeriods(matchId),
      ])

      if (playersRes.error) throw playersRes.error
      if (periodsRes.error) throw periodsRes.error

      const playersList = playersRes.data || []
      const periodsData = periodsRes.data || []

      const allPeriodsMap = new Map<number, Record<number, PeriodFraction>>()
      periodsData.forEach((pd: any) => {
        if (!allPeriodsMap.has(pd.player_id)) {
          allPeriodsMap.set(pd.player_id, {})
        }
        allPeriodsMap.get(pd.player_id)![pd.period] = pd.fraction
      })

      const mapped: PlayerWithPeriod[] = playersList.map((p: Player) => {
        const playerPeriods = allPeriodsMap.get(p.id) || {}
        return {
          ...p,
          currentPeriod: playerPeriods[selectedPeriod] || null,
        }
      })

      setPlayers(mapped)
      
      const newField = new Map<number, FieldPosition>()
      const newBench = new Set<number>()
      
      mapped.forEach((player) => {
        if (player.currentPeriod === 'FULL') {
          const existingCount = newField.size
          newField.set(player.id, getDefaultPosition(existingCount))
        } else if (player.currentPeriod === 'HALF') {
          newBench.add(player.id)
        }
      })
      
      setFieldPlayers(newField)
      setBenchPlayers(newBench)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al actualizar',
        variant: 'destructive',
      })
    }
  }

  const getDefaultPosition = (index: number): FieldPosition => {
    // Formación 3-2-1 por defecto
    const formations = [
      { x: 50, y: 85 }, // Portero
      { x: 25, y: 65 }, // Defensa izq
      { x: 50, y: 65 }, // Defensa centro
      { x: 75, y: 65 }, // Defensa der
      { x: 35, y: 40 }, // Medio izq
      { x: 65, y: 40 }, // Medio der
      { x: 50, y: 20 }, // Delantero
    ]
    return formations[index % formations.length] || { x: 50, y: 50 }
  }

  const handleDragStart = (playerId: number) => {
    setDraggedPlayer(playerId)
  }

  const handleDragEnd = () => {
    setDraggedPlayer(null)
  }

  const handleFieldDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!draggedPlayer) return

    // Validar mínimo 7 jugadores convocados
    if (calledUpCount < 7) {
      toast({
        variant: 'destructive',
        title: 'Convocatoria incompleta',
        description: 'Debes convocar al menos 7 jugadores antes de asignar posiciones.'
      })
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Verificar límite de 7 jugadores en campo
    if (!fieldPlayers.has(draggedPlayer) && fieldPlayers.size >= 7) {
      toast({
        title: 'Límite alcanzado',
        description: 'Solo puedes tener 7 jugadores en el campo',
        variant: 'destructive',
      })
      return
    }

    // Mover jugador al campo
    const newField = new Map(fieldPlayers)
    newField.set(draggedPlayer, { x, y })
    setFieldPlayers(newField)

    // Remover del banco si estaba ahí
    const newBench = new Set(benchPlayers)
    newBench.delete(draggedPlayer)
    setBenchPlayers(newBench)

    // Actualizar período a FULL
    updatePlayerPeriod(draggedPlayer, 'FULL')
  }

  const handleBenchDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!draggedPlayer) return

    // Validar mínimo 7 jugadores convocados
    if (calledUpCount < 7) {
      toast({
        variant: 'destructive',
        title: 'Convocatoria incompleta',
        description: 'Debes convocar al menos 7 jugadores antes de asignar posiciones.'
      })
      return
    }

    // Mover jugador al banco
    const newBench = new Set(benchPlayers)
    newBench.add(draggedPlayer)
    setBenchPlayers(newBench)

    // Remover del campo
    const newField = new Map(fieldPlayers)
    newField.delete(draggedPlayer)
    setFieldPlayers(newField)

    // Actualizar período a HALF
    updatePlayerPeriod(draggedPlayer, 'HALF')
  }

  const updatePlayerPeriod = async (playerId: number, fraction: PeriodFraction) => {
    try {
      const { error } = await upsertMatchPeriod(matchId, playerId, selectedPeriod, fraction)
      if (error) throw error

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId ? { ...p, currentPeriod: fraction } : p
        )
      )
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al actualizar jugador',
        variant: 'destructive',
      })
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const getPlayerById = (id: number) => players.find((p) => p.id === id)

  const availablePlayers = players.filter(
    (p) => !fieldPlayers.has(p.id) && !benchPlayers.has(p.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Alineación - Vista de Cancha</span>
            {onSwitchToTable && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSwitchToTable}
                >
                  <Table className="h-4 w-4 mr-1" />
                  Tabla
                </Button>
                <Button
                  size="sm"
                  variant="default"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Cancha
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="space-y-3 overflow-y-auto flex-1">
            {/* Alerta de convocatoria incompleta */}
            {calledUpCount < 7 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">
                    Convocatoria incompleta
                  </div>
                  <div>
                    Debes convocar al menos 7 jugadores para poder asignar posiciones.
                    Actualmente tienes {calledUpCount} jugador(es) convocado(s).
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Selector de período */}
            <div className="flex gap-2 justify-center">
              {([1, 2, 3, 4] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period)}
                >
                  Q{period}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {/* Jugadores disponibles */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">
                  Jugadores Disponibles ({availablePlayers.length})
                </h3>
                <div className="border rounded-lg p-2 max-h-[400px] overflow-y-auto bg-gray-50">
                  {calledUpCount < 7 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      Convoca al menos 7 jugadores para comenzar
                    </p>
                  ) : players.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      No hay jugadores convocados
                    </p>
                  ) : availablePlayers.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      Todos asignados
                    </p>
                  ) : (
                    availablePlayers.map((player) => (
                      <div
                        key={player.id}
                        draggable={calledUpCount >= 7}
                        onDragStart={() => handleDragStart(player.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white border rounded p-2 mb-2 ${calledUpCount >= 7 ? 'cursor-move hover:bg-gray-100' : 'cursor-not-allowed opacity-50'}`}
                      >
                        <div className="text-xs font-semibold text-gray-900">
                          {player.jersey_number ? `#${player.jersey_number} ` : ''}{player.full_name}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cancha */}
              <div className="col-span-3 space-y-2">
                <h3 className="font-semibold text-sm">
                  Cancha ({fieldPlayers.size}/7 jugadores)
                </h3>
                <div
                  className="relative w-full h-[400px] bg-gradient-to-b from-green-600 to-green-700 rounded-lg border-4 border-white overflow-hidden"
                  onDrop={handleFieldDrop}
                  onDragOver={handleDragOver}
                >
                  {/* Líneas de la cancha */}
                  <div className="absolute inset-0">
                    {/* Línea central */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/50" />
                    {/* Círculo central */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/50 rounded-full" />
                    {/* Área superior */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-16 border-2 border-white/50 border-t-0" />
                    {/* Área inferior */}
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-16 border-2 border-white/50 border-b-0" />
                  </div>

                  {/* Jugadores en el campo */}
                  {Array.from(fieldPlayers.entries()).map(([playerId, pos]) => {
                    const player = getPlayerById(playerId)
                    if (!player) return null
                    return (
                      <div
                        key={playerId}
                        draggable={calledUpCount >= 7}
                        onDragStart={() => handleDragStart(playerId)}
                        onDragEnd={handleDragEnd}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 ${calledUpCount >= 7 ? 'cursor-move' : 'cursor-not-allowed opacity-50'}`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                        }}
                      >
                        <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white hover:bg-blue-700">
                          <span className="text-xs font-bold">
                            {player.jersey_number || player.full_name.substring(0, 2)}
                          </span>
                        </div>
                        <div className="text-[10px] text-center mt-0.5 bg-black/50 text-white px-1 rounded whitespace-nowrap max-w-[80px] truncate">
                          {player.full_name}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Banco */}
                <div>
                  <h3 className="font-semibold text-sm mb-1">Banco (HALF)</h3>
                  <div
                    className="border-2 border-dashed rounded-lg p-2 min-h-[80px] bg-gray-50"
                    onDrop={handleBenchDrop}
                    onDragOver={handleDragOver}
                  >
                    {benchPlayers.size === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-2">
                        Arrastra jugadores aquí para el banco
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Array.from(benchPlayers).map((playerId) => {
                          const player = getPlayerById(playerId)
                          if (!player) return null
                          return (
                            <div
                              key={playerId}
                              draggable={calledUpCount >= 7}
                              onDragStart={() => handleDragStart(playerId)}
                              onDragEnd={handleDragEnd}
                              className={`bg-orange-500 text-white rounded-full px-2 py-1 text-xs ${calledUpCount >= 7 ? 'cursor-move hover:bg-orange-600' : 'cursor-not-allowed opacity-50'}`}
                            >
                              {player.jersey_number ? `#${player.jersey_number}` : ''} {player.full_name}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
