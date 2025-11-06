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
  listMatchSubstitutions,
  applyMatchSubstitution,
  removeMatchSubstitution,
  type MatchSubstitution,
} from '@/services/matches'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, ArrowLeftRight, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: number
  teamId: number
}

type PlayerWithPeriod = Player & {
  currentPeriod: PeriodFraction | null
}

type FieldPosition = {
  x: number
  y: number
}

export function MatchFieldLineup({ open, onOpenChange, matchId, teamId }: Props) {
  const { toast } = useToast()
  const [players, setPlayers] = useState<PlayerWithPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<1 | 2 | 3 | 4>(1)
  const [fieldPlayers, setFieldPlayers] = useState<Map<number, FieldPosition>>(new Map())
  const [benchPlayers, setBenchPlayers] = useState<Set<number>>(new Set())
  const [draggedPlayer, setDraggedPlayer] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [calledUpCount, setCalledUpCount] = useState(0)
  const [substitutions, setSubstitutions] = useState<MatchSubstitution[]>([])
  const [substitutionMode, setSubstitutionMode] = useState(false)
  const [selectedPlayerForSub, setSelectedPlayerForSub] = useState<number | null>(null)

  // Debug: monitorear cambios en selectedPlayerForSub
  useEffect(() => {
    console.log('🎯 Estado selectedPlayerForSub cambió a:', selectedPlayerForSub)
  }, [selectedPlayerForSub])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, matchId, teamId])

  useEffect(() => {
    if (players.length > 0) {
      updatePlayerPositions()
      loadSubstitutions()
    }
    // Reset selección al cambiar de período
    setSelectedPlayerForSub(null)
    setSubstitutionMode(false)
  }, [selectedPeriod])

  const loadSubstitutions = async () => {
    try {
      const { data, error } = await listMatchSubstitutions(matchId, selectedPeriod)
      if (error) throw error
      setSubstitutions(data || [])
    } catch (err: any) {
      console.error('Error loading substitutions:', err)
    }
  }

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
      
      // Cargar cambios del período actual
      const { data: subsData } = await listMatchSubstitutions(matchId, selectedPeriod)
      const currentSubs = subsData || []
      
      // Crear sets de jugadores involucrados en cambios
      const playersOut = new Set(currentSubs.map(s => s.player_out))
      const playersIn = new Set(currentSubs.map(s => s.player_in))
      
      // Actualizar posiciones basado en el período actual y cambios
      const newField = new Map<number, FieldPosition>()
      const newBench = new Set<number>()
      
      mapped.forEach((player) => {
        // Si tiene FULL y no está en un cambio como "sale", va al campo
        if (player.currentPeriod === 'FULL' && !playersOut.has(player.id)) {
          const existingCount = newField.size
          newField.set(player.id, getDefaultPosition(existingCount))
        }
        // Si tiene HALF y es el que "entra", va al campo
        else if (player.currentPeriod === 'HALF' && playersIn.has(player.id)) {
          const existingCount = newField.size
          newField.set(player.id, getDefaultPosition(existingCount))
        }
        // Si tiene HALF y es el que "sale", va al banco
        else if (player.currentPeriod === 'HALF' && playersOut.has(player.id)) {
          newBench.add(player.id)
        }
        // Si no tiene período registrado, va al banco (suplente sin minutos)
        else if (!player.currentPeriod) {
          newBench.add(player.id)
        }
      })
      
      console.log('Campo:', newField.size, 'Banco:', newBench.size, 'Disponibles:', mapped.length - newField.size - newBench.size)
      console.log('Cambios:', currentSubs.length)
      
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

      // Filtrar solo jugadores convocados
      const calledUpPlayerIds = new Set(callUpsData.map(c => c.player_id))
      const calledUpPlayers = playersList.filter((p: Player) => calledUpPlayerIds.has(p.id))

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
      
      // Cargar cambios del período actual
      const { data: subsData } = await listMatchSubstitutions(matchId, selectedPeriod)
      const currentSubs = subsData || []
      
      // Crear sets de jugadores involucrados en cambios
      const playersOut = new Set(currentSubs.map(s => s.player_out))
      const playersIn = new Set(currentSubs.map(s => s.player_in))
      
      const newField = new Map<number, FieldPosition>()
      const newBench = new Set<number>()
      
      mapped.forEach((player) => {
        // Si tiene FULL y no está en un cambio como "sale", va al campo
        if (player.currentPeriod === 'FULL' && !playersOut.has(player.id)) {
          const existingCount = newField.size
          newField.set(player.id, getDefaultPosition(existingCount))
        }
        // Si tiene HALF y es el que "entra", va al campo
        else if (player.currentPeriod === 'HALF' && playersIn.has(player.id)) {
          const existingCount = newField.size
          newField.set(player.id, getDefaultPosition(existingCount))
        }
        // Todos los demás van al banco
        else {
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

    // Actualizar período a FULL solo si no está involucrado en un cambio
    const isInSubstitution = substitutions.some(
      sub => sub.player_out === draggedPlayer || sub.player_in === draggedPlayer
    )
    if (!isInSubstitution) {
      updatePlayerPeriod(draggedPlayer, 'FULL')
    }
  }

  const handleBenchDrop = async (e: React.DragEvent<HTMLDivElement>) => {
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

    console.log('🔄 Moviendo jugador al banco:', draggedPlayer)

    try {
      // Eliminar el registro del período en la base de datos
      const { error } = await supabase
        .from('match_player_periods')
        .delete()
        .match({ match_id: matchId, player_id: draggedPlayer, period: selectedPeriod })

      if (error) throw error

      console.log('✅ Período eliminado de la base de datos')

      // Actualizar estado local
      const newBench = new Set(benchPlayers)
      newBench.add(draggedPlayer)
      setBenchPlayers(newBench)

      // Remover del campo
      const newField = new Map(fieldPlayers)
      newField.delete(draggedPlayer)
      setFieldPlayers(newField)

      // Actualizar el estado del jugador
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === draggedPlayer ? { ...p, currentPeriod: null } : p
        )
      )

      console.log('✅ Estado actualizado')
    } catch (err: any) {
      console.error('❌ Error al mover jugador al banco:', err)
      toast({
        title: 'Error',
        description: err.message || 'Error al actualizar jugador',
        variant: 'destructive',
      })
    }
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

  const handlePlayerClickForSubstitution = async (playerId: number) => {
    console.log('=== CLICK EN JUGADOR ===')
    console.log('Player ID:', playerId)
    console.log('Modo cambio:', substitutionMode)
    console.log('Jugador ya seleccionado:', selectedPlayerForSub)
    console.log('Campo:', Array.from(fieldPlayers.keys()))
    console.log('Banco:', Array.from(benchPlayers))
    
    if (!substitutionMode) {
      console.log('❌ Modo cambio no está activo')
      return
    }

    // Si no hay jugador seleccionado, seleccionar este
    if (!selectedPlayerForSub) {
      console.log('✅ Seleccionando primer jugador:', playerId)
      setSelectedPlayerForSub(playerId)
      return
    }

    // Si es el mismo jugador, deseleccionar
    if (selectedPlayerForSub === playerId) {
      console.log('🔄 Deseleccionando jugador:', playerId)
      setSelectedPlayerForSub(null)
      return
    }

    console.log('🔍 Validando cambio...')
    console.log('Jugador 1 (seleccionado):', selectedPlayerForSub, 'en campo?', fieldPlayers.has(selectedPlayerForSub))
    console.log('Jugador 2 (nuevo click):', playerId, 'en campo?', fieldPlayers.has(playerId))

    // Validar que uno esté en campo y otro en banco
    const player1InField = fieldPlayers.has(selectedPlayerForSub)
    const player2InField = fieldPlayers.has(playerId)

    if (player1InField === player2InField) {
      console.log('❌ Cambio inválido: ambos en', player1InField ? 'campo' : 'banco')
      toast({
        title: 'Cambio inválido',
        description: 'Debes seleccionar un jugador del campo y uno del banco',
        variant: 'destructive',
      })
      setSelectedPlayerForSub(null)
      return
    }

    // Determinar quién sale y quién entra
    const playerOut = player1InField ? selectedPlayerForSub : playerId
    const playerIn = player1InField ? playerId : selectedPlayerForSub

    console.log('✅ Cambio válido!')
    console.log('Sale del campo:', playerOut)
    console.log('Entra al campo:', playerIn)

    try {
      console.log('📡 Aplicando cambio en servidor...')
      const { error } = await applyMatchSubstitution(matchId, selectedPeriod, playerOut, playerIn)
      if (error) {
        console.error('❌ Error del servidor:', error)
        throw error
      }

      console.log('✅ Cambio aplicado exitosamente')
      toast({
        title: 'Cambio aplicado',
        description: 'Ambos jugadores tienen HALF en este cuarto',
      })

      // Recargar datos
      console.log('🔄 Recargando datos...')
      await loadData()
      await loadSubstitutions()
      setSelectedPlayerForSub(null)
      console.log('✅ Datos recargados')
    } catch (err: any) {
      console.error('❌ Error al aplicar cambio:', err)
      toast({
        title: 'Error',
        description: err.message || 'Error al aplicar cambio',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveSubstitution = async (sub: MatchSubstitution) => {
    try {
      const { error } = await removeMatchSubstitution(matchId, sub.period, sub.player_out, sub.player_in)
      if (error) throw error

      toast({
        title: 'Cambio eliminado',
        description: 'Se restauró el estado anterior',
      })

      // Recargar datos
      await loadData()
      await loadSubstitutions()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al eliminar cambio',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            <span>Alineación - Vista de Cancha</span>
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

            {/* Selector de período y modo cambio */}
            <div className="flex gap-2 justify-between items-center">
              <div className="flex gap-2">
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
              <Button
                variant={substitutionMode ? 'default' : 'outline'}
                onClick={() => {
                  console.log('Toggle modo cambio. Actual:', substitutionMode, 'Nuevo:', !substitutionMode)
                  console.log('Jugadores en campo:', fieldPlayers.size, 'Convocados:', calledUpCount)
                  setSubstitutionMode(!substitutionMode)
                  setSelectedPlayerForSub(null)
                }}
                disabled={calledUpCount < 7 || fieldPlayers.size < 7}
              >
                <ArrowLeftRight className="h-4 w-4 mr-1" />
                {substitutionMode ? 'Cancelar Cambio' : 'Hacer Cambio'}
              </Button>
            </div>

            {/* Modo cambio activo */}
            {substitutionMode && (
              <Alert>
                <ArrowLeftRight className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">Modo Cambio Activo</div>
                  <div className="text-sm">
                    {selectedPlayerForSub 
                      ? 'Selecciona el segundo jugador para completar el cambio'
                      : 'Selecciona un jugador del campo y uno del banco para hacer un cambio'}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Cambios registrados */}
            {substitutions.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Cambios en Q{selectedPeriod} ({substitutions.length})
                </h4>
                <div className="space-y-2">
                  {substitutions.map((sub) => {
                    const playerOut = getPlayerById(sub.player_out)
                    const playerIn = getPlayerById(sub.player_in)
                    return (
                      <div 
                        key={sub.id} 
                        className="group relative flex items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded p-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer border-2 border-transparent hover:border-red-300 transition-all"
                        onClick={() => handleRemoveSubstitution(sub)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            ↓ {playerOut?.jersey_number ? `#${playerOut.jersey_number}` : ''} {playerOut?.full_name}
                          </span>
                          <ArrowLeftRight className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ↑ {playerIn?.jersey_number ? `#${playerIn.jersey_number}` : ''} {playerIn?.full_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500 group-hover:text-red-600 font-medium">
                            Click para eliminar
                          </span>
                          <X className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* Cancha */}
              <div className="space-y-2">
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
                    const isSelected = selectedPlayerForSub === playerId
                    const isInSubstitution = substitutions.some(
                      sub => sub.player_out === playerId || sub.player_in === playerId
                    )
                    return (
                      <div
                        key={playerId}
                        draggable={calledUpCount >= 7 && !substitutionMode}
                        onDragStart={() => handleDragStart(playerId)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          console.log('🖱️ onClick disparado en campo, jugador:', playerId)
                          e.stopPropagation()
                          e.preventDefault()
                          console.log('Modo cambio:', substitutionMode)
                          if (substitutionMode) {
                            console.log('Llamando a handlePlayerClickForSubstitution')
                            handlePlayerClickForSubstitution(playerId)
                          } else {
                            console.log('Modo cambio no activo, ignorando click')
                          }
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                          substitutionMode 
                            ? 'cursor-pointer' 
                            : calledUpCount >= 7 ? 'cursor-move' : 'cursor-not-allowed opacity-50'
                        }`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                        }}
                      >
                        <div className={`rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 ${
                          isSelected 
                            ? 'bg-yellow-500 border-yellow-300 ring-2 ring-yellow-400' 
                            : isInSubstitution
                            ? 'bg-orange-500 border-white'
                            : 'bg-blue-600 border-white hover:bg-blue-700'
                        } text-white`}>
                          <span className="text-xs font-bold">
                            {player.jersey_number || player.full_name.substring(0, 2)}
                          </span>
                        </div>
                        <div className="text-[10px] text-center mt-0.5 bg-black/50 text-white px-1 rounded whitespace-nowrap max-w-[80px] truncate">
                          {player.full_name}
                          {isInSubstitution && ' (HALF)'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Banco */}
                <div>
                  <h3 className="font-semibold text-sm mb-1">
                    Banco {substitutionMode && '(Click para cambio)'}
                  </h3>
                  <div
                    className={`border-2 border-dashed rounded-lg p-2 min-h-[80px] ${
                      substitutionMode ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'
                    }`}
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
                          const isSelected = selectedPlayerForSub === playerId
                          const isInSubstitution = substitutions.some(
                            sub => sub.player_out === playerId || sub.player_in === playerId
                          )
                          return (
                            <div
                              key={playerId}
                              draggable={calledUpCount >= 7 && !substitutionMode}
                              onDragStart={() => handleDragStart(playerId)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                console.log('🖱️ onClick disparado en banco, jugador:', playerId)
                                e.stopPropagation()
                                e.preventDefault()
                                console.log('Modo cambio:', substitutionMode)
                                if (substitutionMode) {
                                  console.log('Llamando a handlePlayerClickForSubstitution')
                                  handlePlayerClickForSubstitution(playerId)
                                } else {
                                  console.log('Modo cambio no activo, ignorando click')
                                }
                              }}
                              className={`text-white rounded-full px-2 py-1 text-xs ${
                                isSelected
                                  ? 'bg-yellow-500 ring-2 ring-yellow-400 cursor-pointer'
                                  : isInSubstitution
                                  ? 'bg-green-500 cursor-pointer hover:bg-green-600'
                                  : substitutionMode
                                  ? 'bg-gray-500 cursor-pointer hover:bg-gray-600'
                                  : calledUpCount >= 7 
                                  ? 'bg-gray-500 cursor-move hover:bg-gray-600' 
                                  : 'bg-gray-400 cursor-not-allowed opacity-50'
                              }`}
                            >
                              {player.jersey_number ? `#${player.jersey_number}` : ''} {player.full_name}
                              {isInSubstitution && ' (HALF)'}
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
