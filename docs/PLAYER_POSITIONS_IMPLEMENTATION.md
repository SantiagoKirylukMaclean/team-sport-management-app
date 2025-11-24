# Implementación de Posiciones de Jugadores en Partidos

## Resumen
Se ha agregado la funcionalidad para registrar la posición en la que jugó cada jugador en cada cuarto del partido.

## Cambios Realizados

### 1. Base de Datos
- **Archivo**: `supabase/migrations/20251116000000_player_positions.sql`
- Se creó la tabla `positions` con las 10 posiciones iniciales
- Se agregó la columna `position_id` a `match_player_periods`
- Posiciones incluidas:
  - Portero
  - Defensa Derecha
  - Defensa Central
  - Defensa Izquierda
  - Volante Derecha
  - Volante Central
  - Volante Izquierda
  - Delantero Centro
  - Delantero Derecho
  - Delantero Izquierdo

### 2. Servicios
- **Archivo**: `src/services/positions.ts` (NUEVO)
  - `listPositions()`: Obtiene todas las posiciones disponibles
  - `createPosition()`: Permite agregar nuevas posiciones en el futuro

- **Archivo**: `src/services/matches.ts` (ACTUALIZADO)
  - Se agregó `position_id` al tipo `MatchPlayerPeriod`
  - Se actualizó `upsertMatchPeriod()` para aceptar `positionId` opcional
  - Se actualizó `listMatchPeriods()` para incluir `position_id`

### 3. Componentes
- **Archivo**: `src/pages/coach/components/PositionSelectDialog.tsx` (NUEVO)
  - Diálogo para seleccionar la posición del jugador

## Cambios Pendientes en MatchLineupAndResults.tsx

Para completar la implementación, necesitas hacer los siguientes cambios en `src/pages/coach/components/MatchLineupAndResults.tsx`:

### 1. Importar el nuevo componente
```typescript
import { PositionSelectDialog } from './PositionSelectDialog'
```

### 2. Actualizar el tipo PlayerWithPeriod (YA HECHO)
```typescript
type PlayerWithPeriod = Player & {
  currentPeriod: PeriodFraction | null
  positionId: number | null  // YA AGREGADO
}
```

### 3. Agregar estados para posiciones (YA HECHO)
```typescript
const [positions, setPositions] = useState<Position[]>([])
const [showPositionDialog, setShowPositionDialog] = useState(false)
const [playerForPosition, setPlayerForPosition] = useState<number | null>(null)
```

### 4. Cargar posiciones (YA HECHO)
```typescript
const loadPositions = async () => {
  try {
    const { data, error } = await listPositions()
    if (error) throw error
    setPositions(data || [])
  } catch (err: any) {
    console.error('Error loading positions:', err)
  }
}
```

### 5. Actualizar loadData() para incluir positionId
En las dos funciones `loadData()` y `updatePlayerPositions()`, cambiar:

```typescript
// ANTES:
const mapped: PlayerWithPeriod[] = calledUpPlayers.map((p: Player) => {
  const playerPeriods = allPeriodsMap.get(p.id) || {}
  return {
    ...p,
    currentPeriod: playerPeriods[selectedPeriod] || null,
  }
})

// DESPUÉS:
const mapped: PlayerWithPeriod[] = calledUpPlayers.map((p: Player) => {
  const playerPeriods = allPeriodsMap.get(p.id) || {}
  const periodData = periodsData.find((pd: any) => pd.player_id === p.id && pd.period === selectedPeriod)
  return {
    ...p,
    currentPeriod: playerPeriods[selectedPeriod] || null,
    positionId: periodData?.position_id || null,
  }
})
```

### 6. Modificar handleFieldDrop()
Cambiar la función para mostrar el diálogo de posición:

```typescript
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

  const newField = new Map(fieldPlayers)
  newField.set(draggedPlayer, { x, y })
  setFieldPlayers(newField)

  const newBench = new Set(benchPlayers)
  newBench.delete(draggedPlayer)
  setBenchPlayers(newBench)

  const isInSubstitution = substitutions.some(
    sub => sub.player_out === draggedPlayer || sub.player_in === draggedPlayer
  )
  
  if (!isInSubstitution) {
    // Mostrar diálogo para seleccionar posición
    setPlayerForPosition(draggedPlayer)
    setShowPositionDialog(true)
  }
}
```

### 7. Actualizar updatePlayerPeriod()
```typescript
const updatePlayerPeriod = async (playerId: number, fraction: PeriodFraction, positionId?: number | null) => {
  try {
    const { error } = await upsertMatchPeriod(match.id, playerId, selectedPeriod, fraction, positionId)
    if (error) throw error

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, currentPeriod: fraction, positionId: positionId || null } : p
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
```

### 8. Agregar función para manejar confirmación de posición
```typescript
const handlePositionConfirm = async (positionId: number | null) => {
  if (!playerForPosition) return
  
  await updatePlayerPeriod(playerForPosition, 'FULL', positionId)
  setPlayerForPosition(null)
}
```

### 9. Mostrar la posición en el campo
En el render de los jugadores en el campo, agregar la posición:

```typescript
<div className="text-[10px] text-center mt-0.5 bg-black/50 text-white px-1 rounded whitespace-nowrap max-w-[80px] truncate">
  {player.full_name}
  {isInSubstitution && ' (HALF)'}
  {player.positionId && (
    <div className="text-[9px] text-yellow-300">
      {positions.find(p => p.id === player.positionId)?.name}
    </div>
  )}
</div>
```

### 10. Agregar el diálogo al final del componente
Antes del cierre del Dialog principal, agregar:

```typescript
{playerForPosition && (
  <PositionSelectDialog
    open={showPositionDialog}
    onOpenChange={setShowPositionDialog}
    positions={positions}
    playerName={getPlayerById(playerForPosition)?.full_name || ''}
    onConfirm={handlePositionConfirm}
  />
)}
```

## Aplicar la Migración

Para aplicar los cambios a la base de datos:

```bash
# Si usas Supabase local
npx supabase db reset

# O si usas Supabase en la nube
npx supabase db push
```

## Agregar Nuevas Posiciones en el Futuro

Para agregar nuevas posiciones, puedes:

1. Usar la función `createPosition()` del servicio
2. O crear una nueva migración SQL:

```sql
INSERT INTO public.positions (name, display_order) VALUES
  ('Nueva Posición', 11);
```

## Notas
- La posición es opcional (puede ser NULL)
- La posición se define por cuarto, permitiendo que un jugador juegue en diferentes posiciones en diferentes cuartos
- Solo los superadmin pueden modificar las posiciones disponibles
- Todos los usuarios pueden ver las posiciones
