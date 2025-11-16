import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getPlayersByTeam, type PlayerWithTeam as Player } from '@/services/players'
import {
  listMatchPeriods,
  upsertMatchPeriod,
  type PeriodFraction,
  listMatchCallUps,
  listMatchSubstitutions,
  applyMatchSubstitution,
  removeMatchSubstitution,
  type MatchSubstitution,
  listMatchQuarterResults,
  upsertMatchQuarterResult,
  listMatchGoals,
  addMatchGoal,
  deleteMatchGoal,
  type Match,
  type MatchQuarterResult,
  type MatchGoal,
} from '@/services/matches'
import { listPositions, type Position } from '@/services/positions'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, ArrowLeftRight, X, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: Match
  teamId: number
}

type PlayerWithPeriod = Player & {
  currentPeriod: PeriodFraction | null
  positionId: number | null
  fieldZone: FieldZone | null
}

type FieldPosition = {
  x: number
  y: number
}

type FieldZone = 
  | 'PORTERO'
  | 'DEFENSA_IZQUIERDA'
  | 'DEFENSA_CENTRAL'
  | 'DEFENSA_DERECHA'
  | 'VOLANTE_IZQUIERDO'
  | 'VOLANTE_CENTRAL'
  | 'VOLANTE_DERECHO'
  | 'DELANTERO_IZQUIERDO'
  | 'DELANTERO_CENTRO'
  | 'DELANTERO_DERECHO'

const ZONE_POSITIONS: Record<FieldZone, FieldPosition> = {
  PORTERO: { x: 50, y: 88.5 },
  DEFENSA_IZQUIERDA: { x: 16.65, y: 72 },
  DEFENSA_CENTRAL: { x: 50, y: 72 },
  DEFENSA_DERECHA: { x: 83.35, y: 72 },
  VOLANTE_IZQUIERDO: { x: 16.65, y: 49.5 },
  VOLANTE_CENTRAL: { x: 50, y: 49.5 },
  VOLANTE_DERECHO: { x: 83.35, y: 49.5 },
  DELANTERO_IZQUIERDO: { x: 16.65, y: 27 },
  DELANTERO_CENTRO: { x: 50, y: 27 },
  DELANTERO_DERECHO: { x: 83.35, y: 27 },
}

const ZONE_LABELS: Record<FieldZone, string> = {
  PORTERO: 'Portero',
  DEFENSA_IZQUIERDA: 'Defensa izquierda',
  DEFENSA_CENTRAL: 'Defensa central',
  DEFENSA_DERECHA: 'Defensa derecha',
  VOLANTE_IZQUIERDO: 'Volante izquierdo',
  VOLANTE_CENTRAL: 'Volante central',
  VOLANTE_DERECHO: 'Volante Derecho',
  DELANTERO_IZQUIERDO: 'Delantero izquierdo',
  DELANTERO_CENTRO: 'Delantero centro',
  DELANTERO_DERECHO: 'Delantero derecho',
}

export function MatchLineupAndResults({ open, onOpenChange, match, teamId }: Props) {
  const { toast } = useToast()
  const [players, setPlayers] = useState<PlayerWithPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<1 | 2 | 3 | 4>(1)
  const [fieldPlayers, setFieldPlayers] = useState<Map<number, FieldZone>>(new Map())
  const [benchPlayers, setBenchPlayers] = useState<Set<number>>(new Set())
  const [draggedPlayer, setDraggedPlayer] = useState<number | null>(null)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [calledUpCount, setCalledUpCount] = useState(0)
  const [substitutions, setSubstitutions] = useState<MatchSubstitution[]>([])
  const [substitutionMode, setSubstitutionMode] = useState(false)
  const [selectedPlayerForSub, setSelectedPlayerForSub] = useState<number | null>(null)
  
  // Estados para resultados
  const [quarterResults, setQuarterResults] = useState<MatchQuarterResult[]>([])
  const [goals, setGoals] = useState<MatchGoal[]>([])
  const [teamGoals, setTeamGoals] = useState<number>(0)
  const [opponentGoals, setOpponentGoals] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  
  // Estados para posiciones
  const [positions, setPositions] = useState<Position[]>([])

  useEffect(() => {
    if (open) {
      loadData()
      loadPositions()
    }
  }, [open, match.id, teamId])
  
  const loadPositions = async () => {
    try {
      const { data, error } = await listPositions()
      if (error) throw error
      setPositions(data || [])
    } catch (err: any) {
      console.error('Error loading positions:', err)
    }
  }

  useEffect(() => {
    if (players.length > 0) {
      updatePlayerPositions()
      loadSubstitutions()
    }
    setSelectedPlayerForSub(null)
    setSubstitutionMode(false)
  }, [selectedPeriod])

  useEffect(() => {
    // Actualizar los valores cuando cambia el cuarto seleccionado
    const result = quarterResults.find((r) => r.quarter === selectedPeriod)
    const quarterGoalsCount = goals.filter((g) => g.quarter === selectedPeriod).length
    setTeamGoals(quarterGoalsCount)
    
    if (result) {
      setOpponentGoals(result.opponent_goals)
    } else {
      setOpponentGoals(0)
    }
  }, [selectedPeriod, quarterResults, goals])

  const loadSubstitutions = async () => {
    try {
      const { data, error } = await listMatchSubstitutions(match.id, selectedPeriod)
      if (error) throw error
      setSubstitutions(data || [])
    } catch (err: any) {
      console.error('Error loading substitutions:', err)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [playersRes, periodsRes, callUpsRes, resultsRes, goalsRes] = await Promise.all([
        getPlayersByTeam(teamId),
        listMatchPeriods(match.id),
        listMatchCallUps(match.id),
        listMatchQuarterResults(match.id),
        listMatchGoals(match.id),
      ])

      if (playersRes.error) throw playersRes.error
      if (periodsRes.error) throw periodsRes.error
      if (callUpsRes.error) throw callUpsRes.error
      if (resultsRes.error) throw resultsRes.error
      if (goalsRes.error) throw goalsRes.error

      const playersList = playersRes.data || []
      const periodsData = periodsRes.data || []
      const callUpsData = callUpsRes.data || []

      setCalledUpCount(callUpsData.length)
      setQuarterResults(resultsRes.data || [])
      setGoals(goalsRes.data || [])

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
        const periodData = periodsData.find((pd: any) => pd.player_id === p.id && pd.period === selectedPeriod)
        return {
          ...p,
          currentPeriod: playerPeriods[selectedPeriod] || null,
          positionId: periodData?.position_id || null,
          fieldZone: periodData?.field_zone as FieldZone || null,
        }
      })

      setPlayers(mapped)
      
      const { data: subsData } = await listMatchSubstitutions(match.id, selectedPeriod)
      const currentSubs = subsData || []
      
      const playersOut = new Set(currentSubs.map(s => s.player_out))
      const playersIn = new Set(currentSubs.map(s => s.player_in))
      
      const newField = new Map<number, FieldZone>()
      const newBench = new Set<number>()
      
      mapped.forEach((player) => {
        if (player.currentPeriod === 'FULL' && !playersOut.has(player.id)) {
          // Usar la zona guardada si existe, sino usar zona por defecto
          const zone = player.fieldZone || getDefaultZone(newField.size)
          newField.set(player.id, zone)
        }
        else if (player.currentPeriod === 'HALF' && playersIn.has(player.id)) {
          // Usar la zona guardada si existe, sino usar zona por defecto
          const zone = player.fieldZone || getDefaultZone(newField.size)
          newField.set(player.id, zone)
        }
        else if (player.currentPeriod === 'HALF' && playersOut.has(player.id)) {
          newBench.add(player.id)
        }
        else if (!player.currentPeriod) {
          newBench.add(player.id)
        }
      })
      
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
    try {
      const [playersRes, periodsRes, callUpsRes] = await Promise.all([
        getPlayersByTeam(teamId),
        listMatchPeriods(match.id),
        listMatchCallUps(match.id),
      ])

      if (playersRes.error) throw playersRes.error
      if (periodsRes.error) throw periodsRes.error
      if (callUpsRes.error) throw callUpsRes.error

      const playersList = playersRes.data || []
      const periodsData = periodsRes.data || []
      const callUpsData = callUpsRes.data || []

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
        const periodData = periodsData.find((pd: any) => pd.player_id === p.id && pd.period === selectedPeriod)
        return {
          ...p,
          currentPeriod: playerPeriods[selectedPeriod] || null,
          positionId: periodData?.position_id || null,
          fieldZone: periodData?.field_zone as FieldZone || null,
        }
      })

      setPlayers(mapped)
      
      const { data: subsData } = await listMatchSubstitutions(match.id, selectedPeriod)
      const currentSubs = subsData || []
      
      const playersOut = new Set(currentSubs.map(s => s.player_out))
      const playersIn = new Set(currentSubs.map(s => s.player_in))
      
      const newField = new Map<number, FieldZone>()
      const newBench = new Set<number>()
      
      mapped.forEach((player) => {
        if (player.currentPeriod === 'FULL' && !playersOut.has(player.id)) {
          // Usar la zona guardada si existe, sino usar zona por defecto
          const zone = player.fieldZone || getDefaultZone(newField.size)
          newField.set(player.id, zone)
        }
        else if (player.currentPeriod === 'HALF' && playersIn.has(player.id)) {
          // Usar la zona guardada si existe, sino usar zona por defecto
          const zone = player.fieldZone || getDefaultZone(newField.size)
          newField.set(player.id, zone)
        }
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

  const getDefaultZone = (index: number): FieldZone => {
    const zones: FieldZone[] = [
      'PORTERO',
      'DEFENSA_IZQUIERDA',
      'DEFENSA_CENTRAL',
      'DEFENSA_DERECHA',
      'VOLANTE_IZQUIERDO',
      'VOLANTE_CENTRAL',
      'VOLANTE_DERECHO',
    ]
    return zones[index % zones.length] || 'VOLANTE_CENTRAL'
  }
  
  const getZoneFromPosition = (x: number, y: number): FieldZone | null => {
    // Dividir la cancha en zonas basadas en coordenadas
    // Ajustado para coincidir con la cuadrícula 3x3 + zona de portero
    // Y: 0-38.5% = Delanteros, 38.5-61% = Volantes, 61-83.5% = Defensas, 83.5-100% = Portero
    // X: 0-33.33% = Izquierda, 33.33-66.66% = Centro, 66.66-100% = Derecha
    
    if (y > 83.5) {
      // Zona de portero (toda la fila superior)
      return 'PORTERO'
    } else if (y > 61) {
      // Zona defensiva (segunda fila)
      if (x < 33.33) return 'DEFENSA_IZQUIERDA'
      if (x < 66.66) return 'DEFENSA_CENTRAL'
      return 'DEFENSA_DERECHA'
    } else if (y > 38.5) {
      // Zona de volantes (tercera fila)
      if (x < 33.33) return 'VOLANTE_IZQUIERDO'
      if (x < 66.66) return 'VOLANTE_CENTRAL'
      return 'VOLANTE_DERECHO'
    } else {
      // Zona delantera (cuarta fila)
      if (x < 33.33) return 'DELANTERO_IZQUIERDO'
      if (x < 66.66) return 'DELANTERO_CENTRO'
      return 'DELANTERO_DERECHO'
    }
  }

  const handleDragStart = (playerId: number) => {
    setDraggedPlayer(playerId)
  }

  const handleDragEnd = () => {
    setDraggedPlayer(null)
  }

  const handleTouchStart = (e: React.TouchEvent, playerId: number) => {
    if (substitutionMode) return
    if (calledUpCount < 7) return
    
    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
    setDraggedPlayer(playerId)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedPlayer || !touchStartPos) return
    e.preventDefault()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedPlayer || !touchStartPos) return
    
    const touch = e.changedTouches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    
    // Verificar si se soltó en la cancha
    const fieldElement = document.getElementById('soccer-field')
    if (fieldElement && fieldElement.contains(element)) {
      const rect = fieldElement.getBoundingClientRect()
      const x = ((touch.clientX - rect.left) / rect.width) * 100
      const y = ((touch.clientY - rect.top) / rect.height) * 100
      
      if (!fieldPlayers.has(draggedPlayer) && fieldPlayers.size >= 7) {
        toast({
          title: 'Límite alcanzado',
          description: 'Solo puedes tener 7 jugadores en el campo',
          variant: 'destructive',
        })
      } else {
        const zone = getZoneFromPosition(x, y)
        if (zone) {
          const newField = new Map(fieldPlayers)
          newField.set(draggedPlayer, zone)
          setFieldPlayers(newField)

          const newBench = new Set(benchPlayers)
          newBench.delete(draggedPlayer)
          setBenchPlayers(newBench)

          // Obtener el período actual del jugador
          const player = players.find(p => p.id === draggedPlayer)
          const currentPeriod = player?.currentPeriod || 'FULL'
          
          // Asignar posición automáticamente basada en la zona
          const positionId = getPositionIdFromZone(zone)
          updatePlayerPeriod(draggedPlayer, currentPeriod, positionId, zone)
        }
      }
    }
    
    // Verificar si se soltó en el banco
    const benchElement = document.getElementById('bench-area')
    if (benchElement && benchElement.contains(element)) {
      handleBenchDropAsync()
    }
    
    setDraggedPlayer(null)
    setTouchStartPos(null)
  }

  const handleBenchDropAsync = async () => {
    if (!draggedPlayer) return

    try {
      const { error } = await supabase
        .from('match_player_periods')
        .delete()
        .match({ match_id: match.id, player_id: draggedPlayer, period: selectedPeriod })

      if (error) throw error

      const newBench = new Set(benchPlayers)
      newBench.add(draggedPlayer)
      setBenchPlayers(newBench)

      const newField = new Map(fieldPlayers)
      newField.delete(draggedPlayer)
      setFieldPlayers(newField)

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === draggedPlayer ? { ...p, currentPeriod: null } : p
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

  const getPositionIdFromZone = (zone: FieldZone): number | null => {
    // Mapear zonas a IDs de posiciones
    const zoneToPositionMap: Record<FieldZone, string> = {
      PORTERO: 'Portero',
      DEFENSA_IZQUIERDA: 'Defensa',
      DEFENSA_CENTRAL: 'Defensa',
      DEFENSA_DERECHA: 'Defensa',
      VOLANTE_IZQUIERDO: 'Volante',
      VOLANTE_CENTRAL: 'Volante',
      VOLANTE_DERECHO: 'Volante',
      DELANTERO_IZQUIERDO: 'Delantero',
      DELANTERO_CENTRO: 'Delantero',
      DELANTERO_DERECHO: 'Delantero',
    }
    
    const positionName = zoneToPositionMap[zone]
    const position = positions.find(p => p.name === positionName)
    return position?.id || null
  }

  const handleFieldDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!draggedPlayer) return

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

    if (!fieldPlayers.has(draggedPlayer) && fieldPlayers.size >= 7) {
      toast({
        title: 'Límite alcanzado',
        description: 'Solo puedes tener 7 jugadores en el campo',
        variant: 'destructive',
      })
      return
    }

    const zone = getZoneFromPosition(x, y)
    if (!zone) return

    const newField = new Map(fieldPlayers)
    newField.set(draggedPlayer, zone)
    setFieldPlayers(newField)

    const newBench = new Set(benchPlayers)
    newBench.delete(draggedPlayer)
    setBenchPlayers(newBench)

    // Obtener el período actual del jugador
    const player = players.find(p => p.id === draggedPlayer)
    const currentPeriod = player?.currentPeriod || 'FULL'
    
    // Asignar posición automáticamente basada en la zona
    const positionId = getPositionIdFromZone(zone)
    updatePlayerPeriod(draggedPlayer, currentPeriod, positionId, zone)
  }

  const handleBenchDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!draggedPlayer) return

    if (calledUpCount < 7) {
      toast({
        variant: 'destructive',
        title: 'Convocatoria incompleta',
        description: 'Debes convocar al menos 7 jugadores antes de asignar posiciones.'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('match_player_periods')
        .delete()
        .match({ match_id: match.id, player_id: draggedPlayer, period: selectedPeriod })

      if (error) throw error

      const newBench = new Set(benchPlayers)
      newBench.add(draggedPlayer)
      setBenchPlayers(newBench)

      const newField = new Map(fieldPlayers)
      newField.delete(draggedPlayer)
      setFieldPlayers(newField)

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === draggedPlayer ? { ...p, currentPeriod: null } : p
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

  const updatePlayerPeriod = async (playerId: number, fraction: PeriodFraction, positionId?: number | null, fieldZone?: FieldZone | null) => {
    try {
      const { error } = await upsertMatchPeriod(match.id, playerId, selectedPeriod, fraction, positionId, fieldZone)
      if (error) throw error

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId ? { ...p, currentPeriod: fraction, positionId: positionId || null, fieldZone: fieldZone || null } : p
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
    if (!substitutionMode) return

    if (!selectedPlayerForSub) {
      setSelectedPlayerForSub(playerId)
      return
    }

    if (selectedPlayerForSub === playerId) {
      setSelectedPlayerForSub(null)
      return
    }

    const player1InField = fieldPlayers.has(selectedPlayerForSub)
    const player2InField = fieldPlayers.has(playerId)

    if (player1InField === player2InField) {
      toast({
        title: 'Cambio inválido',
        description: 'Debes seleccionar un jugador del campo y uno del banco',
        variant: 'destructive',
      })
      setSelectedPlayerForSub(null)
      return
    }

    const playerOut = player1InField ? selectedPlayerForSub : playerId
    const playerIn = player1InField ? playerId : selectedPlayerForSub

    // Obtener la zona del jugador que sale
    const playerOutZone = fieldPlayers.get(playerOut)
    const playerOutData = players.find(p => p.id === playerOut)

    try {
      const { error } = await applyMatchSubstitution(match.id, selectedPeriod, playerOut, playerIn)
      if (error) throw error

      // Si el jugador que sale tenía una zona, asignarla al jugador que entra
      if (playerOutZone && playerOutData) {
        const positionId = playerOutData.positionId
        await updatePlayerPeriod(playerIn, 'HALF', positionId, playerOutZone)
      }

      toast({
        title: 'Cambio aplicado',
        description: 'Ambos jugadores tienen HALF en este cuarto',
      })

      await loadData()
      await loadSubstitutions()
      setSelectedPlayerForSub(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al aplicar cambio',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveSubstitution = async (sub: MatchSubstitution) => {
    try {
      const { error } = await removeMatchSubstitution(match.id, sub.period, sub.player_out, sub.player_in)
      if (error) throw error

      toast({
        title: 'Cambio eliminado',
        description: 'Se restauró el estado anterior',
      })

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

  // Funciones para resultados
  const handleSaveQuarterResult = async () => {
    setSaving(true)
    try {
      const { error } = await upsertMatchQuarterResult(
        match.id,
        selectedPeriod,
        teamGoals,
        opponentGoals
      )

      if (error) throw error

      toast({
        title: 'Guardado',
        description: 'Resultado del cuarto guardado correctamente',
      })

      await loadData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al guardar resultado',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddGoal = async (scorerId: number, assisterId?: number) => {
    try {
      const { error } = await addMatchGoal(
        match.id,
        selectedPeriod,
        scorerId,
        assisterId
      )

      if (error) throw error

      toast({
        title: 'Gol agregado',
        description: 'Gol registrado correctamente',
      })

      await loadData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al agregar gol',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteGoal = async (goalId: number) => {
    try {
      const { error } = await deleteMatchGoal(goalId)

      if (error) throw error

      toast({
        title: 'Gol eliminado',
        description: 'Gol eliminado correctamente',
      })

      await loadData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al eliminar gol',
        variant: 'destructive',
      })
    }
  }

  const getPlayerName = (playerId: number) => {
    const player = players.find((p) => p.id === playerId)
    return player ? player.full_name : 'Desconocido'
  }

  const calledUpPlayers = players
  const quarterGoals = goals.filter((g) => g.quarter === selectedPeriod)

  const getTotalScore = () => {
    const teamTotal = quarterResults.reduce((sum, r) => sum + r.team_goals, 0)
    const opponentTotal = quarterResults.reduce((sum, r) => sum + r.opponent_goals, 0)
    return { teamTotal, opponentTotal }
  }

  const { teamTotal, opponentTotal } = getTotalScore()

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Formación y Resultado - {match.opponent}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1">
            {/* COLUMNA IZQUIERDA: FORMACIÓN */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Formación</h2>
              
              {calledUpCount < 7 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">Convocatoria incompleta</div>
                    <div>
                      Debes convocar al menos 7 jugadores. Actualmente: {calledUpCount}
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
                      size="sm"
                    >
                      Q{period}
                    </Button>
                  ))}
                </div>
                <Button
                  variant={substitutionMode ? 'default' : 'outline'}
                  onClick={() => {
                    setSubstitutionMode(!substitutionMode)
                    setSelectedPlayerForSub(null)
                  }}
                  disabled={calledUpCount < 7 || fieldPlayers.size < 7}
                  size="sm"
                >
                  <ArrowLeftRight className="h-4 w-4 mr-1" />
                  {substitutionMode ? 'Cancelar' : 'Cambio'}
                </Button>
              </div>

              {substitutionMode && (
                <Alert>
                  <ArrowLeftRight className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">Modo Cambio Activo</div>
                    <div className="text-sm">
                      {selectedPlayerForSub 
                        ? 'Selecciona el segundo jugador'
                        : 'Selecciona un jugador del campo y uno del banco'}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {substitutions.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" />
                    Cambios en Q{selectedPeriod}
                  </h4>
                  <div className="space-y-2">
                    {substitutions.map((sub) => {
                      const playerOut = getPlayerById(sub.player_out)
                      const playerIn = getPlayerById(sub.player_in)
                      return (
                        <div 
                          key={sub.id} 
                          className="group flex items-center justify-between gap-2 bg-white dark:bg-gray-800 rounded p-2 text-xs hover:bg-red-50 cursor-pointer"
                          onClick={() => handleRemoveSubstitution(sub)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-red-600 font-medium truncate">
                              ↓ {playerOut?.jersey_number ? `#${playerOut.jersey_number}` : ''} {playerOut?.full_name}
                            </span>
                            <ArrowLeftRight className="h-3 w-3 shrink-0" />
                            <span className="text-green-600 font-medium truncate">
                              ↑ {playerIn?.jersey_number ? `#${playerIn.jersey_number}` : ''} {playerIn?.full_name}
                            </span>
                          </div>
                          <X className="h-4 w-4 text-gray-400 group-hover:text-red-600 shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Cancha */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">
                  Cancha ({fieldPlayers.size}/7 jugadores)
                </h3>
                <div
                  id="soccer-field"
                  className="relative w-full h-[500px] bg-gradient-to-b from-green-600 to-green-700 rounded-lg border-4 border-white overflow-hidden"
                  onDrop={handleFieldDrop}
                  onDragOver={handleDragOver}
                >
                  {/* Líneas de la cancha */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/40 rounded-full" />
                    <div className="absolute top-0 left-1/4 right-1/4 h-16 border-2 border-white/40 border-t-0" />
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-16 border-2 border-white/40 border-b-0" />
                    
                    {/* Líneas divisorias de zonas - Ajustadas para cuadrícula perfecta */}
                    <div className="absolute left-0 right-0 h-px bg-white/25" style={{ top: '38.5%' }} />
                    <div className="absolute left-0 right-0 h-px bg-white/25" style={{ top: '61%' }} />
                    <div className="absolute left-0 right-0 h-px bg-white/25" style={{ top: '83.5%' }} />
                    <div className="absolute top-0 bottom-0 w-px bg-white/25" style={{ left: '33.33%' }} />
                    <div className="absolute top-0 bottom-0 w-px bg-white/25" style={{ left: '66.66%' }} />
                  </div>

                  {/* Zonas de drop con etiquetas */}
                  {(Object.keys(ZONE_POSITIONS) as FieldZone[]).map((zone) => {
                    const pos = ZONE_POSITIONS[zone]
                    const hasPlayer = Array.from(fieldPlayers.values()).includes(zone)
                    
                    return (
                      <div
                        key={zone}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          pointerEvents: 'none',
                        }}
                      >
                        {!hasPlayer && (
                          <div className="text-[10px] text-center px-2 py-1 rounded bg-white/30 text-white">
                            {ZONE_LABELS[zone]}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Jugadores */}
                  {Array.from(fieldPlayers.entries()).map(([playerId, zone]) => {
                    const player = getPlayerById(playerId)
                    if (!player) return null
                    const pos = ZONE_POSITIONS[zone]
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
                        onTouchStart={(e) => handleTouchStart(e, playerId)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          if (substitutionMode) {
                            handlePlayerClickForSubstitution(playerId)
                          }
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 ${
                          substitutionMode 
                            ? 'cursor-pointer' 
                            : calledUpCount >= 7 ? 'cursor-move' : 'cursor-not-allowed opacity-50'
                        }`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                        }}
                      >
                        <div className={`rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 ${
                          isSelected 
                            ? 'bg-yellow-500 border-yellow-300 ring-2 ring-yellow-400' 
                            : isInSubstitution
                            ? 'bg-orange-500 border-white'
                            : 'bg-blue-600 border-white hover:bg-blue-700'
                        } text-white`}>
                          <span className="text-sm font-bold">
                            {player.jersey_number || player.full_name.substring(0, 2)}
                          </span>
                        </div>
                        <div className="text-[10px] text-center mt-0.5 bg-black/70 text-white px-1.5 py-0.5 rounded max-w-[90px]">
                          <div className="truncate font-medium">{player.full_name}</div>
                          {isInSubstitution && <div className="text-orange-300">(HALF)</div>}
                          <div className="text-yellow-300 text-[9px] truncate">
                            {ZONE_LABELS[zone]}
                          </div>
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
                    id="bench-area"
                    className={`border-2 border-dashed rounded-lg p-2 min-h-[60px] ${
                      substitutionMode ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'
                    }`}
                    onDrop={handleBenchDrop}
                    onDragOver={handleDragOver}
                  >
                    {benchPlayers.size === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-2">
                        Arrastra jugadores aquí
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
                              onTouchStart={(e) => handleTouchStart(e, playerId)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                if (substitutionMode) {
                                  handlePlayerClickForSubstitution(playerId)
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

            {/* COLUMNA DERECHA: RESULTADOS */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Resultado</h2>
              
              {/* Marcador Total */}
              <div className="bg-muted p-3 rounded-lg">
                <h3 className="font-semibold text-center mb-1 text-sm">Marcador Final</h3>
                <div className="text-2xl font-bold text-center">
                  {teamTotal} - {opponentTotal}
                </div>
                <div className="text-xs text-muted-foreground text-center mt-1">
                  Tu equipo vs {match.opponent}
                </div>
              </div>

              {/* Resumen por Cuartos */}
              <div className="border rounded-lg p-3">
                <h3 className="font-semibold mb-2 text-sm">Resumen por Cuartos</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((q) => {
                    const result = quarterResults.find((r) => r.quarter === q)
                    return (
                      <div
                        key={q}
                        className={`text-center p-2 rounded ${
                          q === selectedPeriod ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        <div className="text-xs font-medium mb-1">Q{q}</div>
                        <div className="text-sm font-bold">
                          {result ? `${result.team_goals}-${result.opponent_goals}` : '-'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resultado del Cuarto */}
              <div className="border rounded-lg p-3 space-y-3">
                <h3 className="font-semibold text-sm">Resultado del Cuarto {selectedPeriod}</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="team-goals" className="text-xs">Goles de tu equipo</Label>
                    <Input
                      id="team-goals"
                      type="number"
                      min="0"
                      value={teamGoals}
                      readOnly
                      disabled
                      className="bg-muted cursor-not-allowed h-8 text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Calculado desde goleadores
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opponent-goals" className="text-xs">Goles de {match.opponent}</Label>
                    <Input
                      id="opponent-goals"
                      type="number"
                      min="0"
                      value={opponentGoals}
                      onChange={(e) => setOpponentGoals(parseInt(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveQuarterResult}
                  disabled={saving}
                  className="w-full h-8 text-sm"
                  size="sm"
                >
                  {saving ? 'Guardando...' : 'Guardar Resultado'}
                </Button>
              </div>

              {/* Goles del Equipo */}
              <div className="border rounded-lg p-3 space-y-3">
                <h3 className="font-semibold text-sm">Goles en Cuarto {selectedPeriod}</h3>
                
                {calledUpPlayers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No hay jugadores convocados
                  </p>
                ) : (
                  <GoalForm
                    players={calledUpPlayers}
                    onAddGoal={handleAddGoal}
                  />
                )}

                {quarterGoals.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium">Goles registrados:</h4>
                    <div className="space-y-1">
                      {quarterGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center justify-between bg-muted p-2 rounded text-xs"
                        >
                          <div>
                            <span className="font-medium">
                              ⚽ {getPlayerName(goal.scorer_id)}
                            </span>
                            {goal.assister_id && (
                              <span className="text-muted-foreground text-[10px]">
                                {' '}(Asist: {getPlayerName(goal.assister_id)})
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

// Componente auxiliar para el formulario de agregar gol
function GoalForm({
  players,
  onAddGoal,
}: {
  players: Player[]
  onAddGoal: (scorerId: number, assisterId?: number) => Promise<void>
}) {
  const [scorerId, setScorerId] = useState<string | undefined>(undefined)
  const [assisterId, setAssisterId] = useState<string | undefined>(undefined)
  const [adding, setAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scorerId) return

    setAdding(true)
    try {
      await onAddGoal(
        parseInt(scorerId),
        assisterId ? parseInt(assisterId) : undefined
      )
      setScorerId(undefined)
      setAssisterId(undefined)
    } finally {
      setAdding(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="scorer" className="text-xs">Goleador *</Label>
          <Select value={scorerId} onValueChange={setScorerId}>
            <SelectTrigger id="scorer" className="h-8 text-xs">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id.toString()} className="text-xs">
                  {player.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="assister" className="text-xs">Asistidor</Label>
          <Select value={assisterId} onValueChange={(value) => setAssisterId(value === 'none' ? undefined : value)}>
            <SelectTrigger id="assister" className="h-8 text-xs">
              <SelectValue placeholder="Sin asistencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">Sin asistencia</SelectItem>
              {players
                .filter((p) => p.id.toString() !== scorerId)
                .map((player) => (
                  <SelectItem key={player.id} value={player.id.toString()} className="text-xs">
                    {player.full_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={!scorerId || adding} className="w-full h-8 text-xs" size="sm">
        <Plus className="h-3 w-3 mr-1" />
        {adding ? 'Agregando...' : 'Agregar Gol'}
      </Button>
    </form>
  )
}
