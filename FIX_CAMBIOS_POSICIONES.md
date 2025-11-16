# Fix: Cambios y Movimiento de Jugadores

## Problemas Corregidos

### 1. Jugador que entra no tomaba la posición del que sale
**Problema:** Cuando se hacía un cambio, el jugador que entraba no heredaba la zona/posición del jugador que salía.

**Solución:**
- Al aplicar un cambio, se captura la zona (`fieldZone`) del jugador que sale
- Se asigna esa misma zona al jugador que entra mediante `updatePlayerPeriod()`
- Ahora el jugador que entra aparece exactamente en la misma posición del que sale

```typescript
// Obtener la zona del jugador que sale
const playerOutZone = fieldPlayers.get(playerOut)
const playerOutData = players.find(p => p.id === playerOut)

// Asignar la zona al jugador que entra
if (playerOutZone && playerOutData) {
  const positionId = playerOutData.positionId
  await updatePlayerPeriod(playerIn, 'HALF', positionId, playerOutZone)
}
```

### 2. Jugadores con HALF no se podían mover
**Problema:** Los jugadores que entraron en un cambio (marcados como HALF) no podían ser reposicionados en la cancha.

**Solución:**
- Eliminada la restricción que impedía actualizar la posición de jugadores en sustitución
- Ahora se detecta el período actual del jugador (`FULL` o `HALF`)
- Al mover un jugador, se mantiene su período actual y solo se actualiza la zona

```typescript
// Obtener el período actual del jugador
const player = players.find(p => p.id === draggedPlayer)
const currentPeriod = player?.currentPeriod || 'FULL'

// Actualizar solo la zona, manteniendo el período
const positionId = getPositionIdFromZone(zone)
updatePlayerPeriod(draggedPlayer, currentPeriod, positionId, zone)
```

## Flujo Completo de un Cambio

1. **Usuario activa modo cambio** → Click en botón "Cambio"
2. **Selecciona jugador del campo** → Jugador marcado en amarillo
3. **Selecciona jugador del banco** → Se ejecuta el cambio
4. **Sistema captura la zona** → `fieldPlayers.get(playerOut)`
5. **Aplica el cambio** → `applyMatchSubstitution()` marca ambos como HALF
6. **Asigna la zona al que entra** → `updatePlayerPeriod(playerIn, 'HALF', positionId, zone)`
7. **Resultado:** 
   - Jugador que sale → va al banco con HALF
   - Jugador que entra → aparece en la misma zona con HALF
   - Ambos pueden ser movidos a otras zonas manteniendo su estado HALF

## Archivos Modificados

- `src/pages/coach/components/MatchLineupAndResults.tsx`
  - Función `handlePlayerClickForSubstitution()` - Hereda zona en cambios
  - Función `handleFieldDrop()` - Permite mover jugadores HALF
  - Función `handleTouchEnd()` - Permite mover jugadores HALF en touch

## Beneficios

✅ Los cambios son más intuitivos - el jugador entra donde estaba el que sale
✅ Mayor flexibilidad - puedes reposicionar jugadores después de un cambio
✅ Mantiene la integridad - el estado HALF se preserva al mover jugadores
✅ Mejor UX - menos pasos para organizar la formación después de cambios
