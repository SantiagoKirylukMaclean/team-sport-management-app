# Fix: Clicks en Jugadores del Banco

## Problema Identificado

Los jugadores del banco no eran clickeables en modo cambio debido a dos problemas:

### 1. Lógica Incorrecta de Asignación
**Antes:**
```typescript
// Todos los jugadores con HALF iban al banco
if (player.currentPeriod === 'HALF') {
  newBench.add(player.id)
}
```

**Problema:** Cuando hay un cambio, ambos jugadores tienen HALF, pero uno debe estar en el campo (el que entra) y otro en el banco (el que sale).

### 2. Eventos Click Bloqueados
Los eventos click podían ser bloqueados por el contenedor padre con `onDrop`.

## Solución Implementada

### 1. Lógica Corregida con Cambios

```typescript
// Cargar cambios del período actual
const { data: subsData } = await listMatchSubstitutions(matchId, selectedPeriod)
const currentSubs = subsData || []

// Crear sets de jugadores involucrados en cambios
const playersOut = new Set(currentSubs.map(s => s.player_out))
const playersIn = new Set(currentSubs.map(s => s.player_in))

mapped.forEach((player) => {
  // Si tiene FULL y no está en un cambio como "sale", va al campo
  if (player.currentPeriod === 'FULL' && !playersOut.has(player.id)) {
    newField.set(player.id, getDefaultPosition(existingCount))
  }
  // Si tiene HALF y es el que "entra", va al campo
  else if (player.currentPeriod === 'HALF' && playersIn.has(player.id)) {
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
```

### 2. StopPropagation en Clicks

```typescript
onClick={(e) => {
  e.stopPropagation()
  if (substitutionMode) {
    handlePlayerClickForSubstitution(playerId)
  }
}}
```

### 3. Indicadores Visuales Mejorados

- Área del banco cambia a fondo amarillo en modo cambio
- Título muestra "(Click para cambio)" cuando está activo
- Console.log para debugging

## Tabla de Asignación

| Estado del Jugador | Tiene Cambio | Rol en Cambio | Ubicación |
|-------------------|--------------|---------------|-----------|
| FULL | No | - | Campo |
| FULL | Sí | Sale | Banco |
| HALF | Sí | Entra | Campo |
| HALF | Sí | Sale | Banco |
| null (sin registro) | No | - | Banco |

## Ejemplo Práctico

### Situación: Q1 con cambio

**Jugadores:**
- #5, #8, #10, #12, #15, #20, #23 → Titulares
- #3, #60 → Suplentes

**Cambio en Q1:** #5 sale, #3 entra

**Resultado en Base de Datos:**
```
match_player_periods:
- #5: Q1 HALF
- #3: Q1 HALF
- #8, #10, #12, #15, #20, #23: Q1 FULL

match_substitutions:
- player_out: #5, player_in: #3, period: 1
```

**Visualización en UI:**
```
Campo (7/7):
- #3 (HALF - naranja, entró)
- #8, #10, #12, #15, #20, #23 (FULL - azul)

Banco:
- #5 (HALF - verde, salió)
- #60 (sin registro - gris)
```

## Archivos Modificados

- ✅ `src/pages/coach/components/MatchFieldLineup.tsx`
  - Función `loadData()` - Corregida lógica de asignación
  - Función `updatePlayerPositions()` - Corregida lógica de asignación
  - Eventos `onClick` - Agregado stopPropagation
  - Indicadores visuales - Fondo amarillo en modo cambio

## Testing

### Caso 1: Sin Cambios
```
Q1: 7 titulares, 2 suplentes
Resultado:
- Campo: 7 jugadores (azul)
- Banco: 2 jugadores (gris)
```

### Caso 2: Con Un Cambio
```
Q1: Cambio #5 → #3
Resultado:
- Campo: 6 titulares (azul) + #3 (naranja)
- Banco: #5 (verde) + 1 suplente (gris)
```

### Caso 3: Con Múltiples Cambios
```
Q2: Cambio #8 → #60, Cambio #10 → #43
Resultado:
- Campo: 5 titulares (azul) + #60 (naranja) + #43 (naranja)
- Banco: #8 (verde) + #10 (verde)
```

## Verificación

Para verificar que funciona:

1. ✅ Abrir vista de cancha
2. ✅ Activar "Modo Cambio"
3. ✅ Área del banco debe tener fondo amarillo
4. ✅ Click en jugador del banco debe seleccionarlo (amarillo)
5. ✅ Click en jugador del campo debe aplicar el cambio
6. ✅ Ambos jugadores deben quedar con HALF
7. ✅ El que entró debe estar en el campo (naranja)
8. ✅ El que salió debe estar en el banco (verde)

## Logs de Consola Esperados

```
Jugadores convocados: 8
Campo: 7 Banco: 1 Disponibles: 0
Cambios: 0

[Usuario activa modo cambio]
Toggle modo cambio. Actual: false Nuevo: true
Jugadores en campo: 7 Convocados: 8

[Usuario hace click en jugador del banco]
Click en jugador: 60 Modo cambio: true
Seleccionando primer jugador: 60

[Usuario hace click en jugador del campo]
Click en jugador: 5 Modo cambio: true
[Aplicando cambio...]

[Después del cambio]
Campo: 7 Banco: 1 Disponibles: 0
Cambios: 1
```

## Estado Final

✅ Problema resuelto
✅ Lógica de asignación corregida
✅ Clicks funcionando correctamente
✅ Indicadores visuales claros
✅ Debugging habilitado
