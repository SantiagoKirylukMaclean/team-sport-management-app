# Implementación de Posiciones de Jugadores - Resumen

## ✅ Completado

### 1. Migración de Base de Datos
**Archivo**: `supabase/migrations/20251116000000_player_positions.sql`

- ✅ Tabla `positions` creada con 10 posiciones iniciales:
  - Portero
  - Defensa Derecha, Central, Izquierda
  - Volante Derecha, Central, Izquierda  
  - Delantero Centro, Derecho, Izquierdo
- ✅ Columna `position_id` agregada a `match_player_periods`
- ✅ Políticas RLS configuradas

### 2. Servicios
**Archivo**: `src/services/positions.ts` (NUEVO)
- ✅ `listPositions()` - Obtener todas las posiciones
- ✅ `createPosition()` - Crear nuevas posiciones

**Archivo**: `src/services/matches.ts` (ACTUALIZADO)
- ✅ Tipo `MatchPlayerPeriod` actualizado con `position_id`
- ✅ `listMatchPeriods()` actualizado para incluir `position_id`
- ✅ `upsertMatchPeriod()` actualizado para aceptar `positionId` opcional

### 3. Componentes
**Archivo**: `src/pages/coach/components/PositionSelectDialog.tsx` (NUEVO)
- ✅ Diálogo para seleccionar posición del jugador

**Archivo**: `src/pages/coach/components/MatchLineupAndResults.tsx` (PARCIALMENTE ACTUALIZADO)
- ✅ Import de `listPositions` y `Position`
- ✅ Tipo `PlayerWithPeriod` actualizado con `positionId`
- ✅ Estados agregados: `positions`, `showPositionDialog`, `playerForPosition`
- ✅ Función `loadPositions()` agregada

## ⚠️ Pendiente - Cambios Manuales Requeridos

Necesitas hacer los siguientes cambios en `src/pages/coach/components/MatchLineupAndResults.tsx`:

### Paso 1: Importar PositionSelectDialog
Agregar al inicio del archivo:
```typescript
import { PositionSelectDialog } from './PositionSelectDialog'
```

### Paso 2: Actualizar loadData() - Línea ~165-172
**BUSCAR:**
```typescript
const mapped: PlayerWithPeriod[] = calledUpPlayers.map((p: Player) => {
  const playerPeriods = allPeriodsMap.get(p.id) || {}
  return {
    ...p,
    currentPeriod: playerPeriods[selectedPeriod] || null,
  }
})
```

**REEMPLAZAR CON:**
```typescript
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

### Paso 3: Actualizar updatePlayerPositions() - Línea ~240-248
**BUSCAR** (segunda ocurrencia del mismo código):
```typescript
const mapped: PlayerWithPeriod[] = calledUpPlayers.map((p: Player) => {
  const playerPeriods = allPeriodsMap.get(p.id) || {}
  return {
    ...p,
    currentPeriod: playerPeriods[selectedPeriod] || null,
  }
})
```

**REEMPLAZAR CON:**
```typescript
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

### Paso 4: Actualizar updatePlayerPeriod() - Línea ~380
**BUSCAR:**
```typescript
const updatePlayerPeriod = async (playerId: number, fraction: PeriodFraction) => {
  try {
    const { error } = await upsertMatchPeriod(match.id, playerId, selectedPeriod, fraction)
    if (error) throw error

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, currentPeriod: fraction } : p
      )
    )
```

**REEMPLAZAR CON:**
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
```

### Paso 5: Actualizar handleFieldDrop() - Línea ~350
**BUSCAR:**
```typescript
const isInSubstitution = substitutions.some(
  sub => sub.player_out === draggedPlayer || sub.player_in === draggedPlayer
)
if (!isInSubstitution) {
  updatePlayerPeriod(draggedPlayer, 'FULL')
}
```

**REEMPLAZAR CON:**
```typescript
const isInSubstitution = substitutions.some(
  sub => sub.player_out === draggedPlayer || sub.player_in === draggedPlayer
)
if (!isInSubstitution) {
  // Mostrar diálogo para seleccionar posición
  setPlayerForPosition(draggedPlayer)
  setShowPositionDialog(true)
}
```

### Paso 6: Agregar función handlePositionConfirm()
Agregar después de `updatePlayerPeriod()`:
```typescript
const handlePositionConfirm = async (positionId: number | null) => {
  if (!playerForPosition) return
  
  await updatePlayerPeriod(playerForPosition, 'FULL', positionId)
  setPlayerForPosition(null)
}
```

### Paso 7: Mostrar posición en el campo - Línea ~700
**BUSCAR:**
```typescript
<div className="text-[10px] text-center mt-0.5 bg-black/50 text-white px-1 rounded whitespace-nowrap max-w-[80px] truncate">
  {player.full_name}
  {isInSubstitution && ' (HALF)'}
</div>
```

**REEMPLAZAR CON:**
```typescript
<div className="text-[10px] text-center mt-0.5 bg-black/50 text-white px-1 rounded max-w-[80px]">
  <div className="truncate">{player.full_name}</div>
  {isInSubstitution && <div className="text-orange-300">(HALF)</div>}
  {player.positionId && (
    <div className="text-yellow-300 truncate">
      {positions.find(p => p.id === player.positionId)?.name}
    </div>
  )}
</div>
```

### Paso 8: Agregar el diálogo - Antes del cierre del Dialog principal (línea ~920)
**BUSCAR:**
```typescript
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**REEMPLAZAR CON:**
```typescript
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
      
      {playerForPosition && (
        <PositionSelectDialog
          open={showPositionDialog}
          onOpenChange={setShowPositionDialog}
          positions={positions}
          playerName={getPlayerById(playerForPosition)?.full_name || ''}
          onConfirm={handlePositionConfirm}
        />
      )}
    </Dialog>
  )
}
```

## 🚀 Aplicar Migración

```bash
# Aplicar la migración a la base de datos
npx supabase db push
```

## 📝 Cómo Usar

1. En el modal "Formación y Resultado", arrastra un jugador al campo
2. Se abrirá un diálogo para seleccionar la posición
3. Selecciona la posición o deja "Sin posición específica"
4. La posición se mostrará debajo del nombre del jugador en el campo
5. La posición se guarda por cuarto, permitiendo diferentes posiciones en diferentes cuartos

## 🔮 Agregar Nuevas Posiciones

Para agregar nuevas posiciones en el futuro:

```sql
INSERT INTO public.positions (name, display_order) VALUES
  ('Mediapunta', 11),
  ('Lateral Derecho', 12);
```

O usar el servicio:
```typescript
await createPosition('Mediapunta', 11)
```
