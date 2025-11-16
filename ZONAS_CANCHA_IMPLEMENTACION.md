# Implementación de Zonas de Cancha

## Resumen
Se ha implementado un sistema de zonas predefinidas en la cancha para asignar posiciones a los jugadores mediante drag & drop, eliminando el menú desplegable de selección de posiciones.

## ✅ ACTUALIZACIÓN: Persistencia de Zonas
Se agregó la columna `field_zone` a la tabla `match_player_periods` para guardar la zona específica donde se coloca cada jugador. Ahora las posiciones se mantienen al cerrar y volver a abrir el diálogo.

## Cambios Realizados

### 1. Sistema de Zonas
Se definieron 10 zonas específicas en la cancha:

**Zona Defensiva:**
- Portero
- Defensa izquierda
- Defensa central
- Defensa derecha

**Zona de Volantes:**
- Volante izquierdo
- Volante central
- Volante derecho

**Zona Delantera:**
- Delantero izquierdo
- Delantero centro
- Delantero derecho

### 2. Asignación Automática de Posiciones
Cuando un jugador se arrastra a una zona específica:
1. Se detecta automáticamente la zona según las coordenadas (x, y)
2. Se asigna la posición correspondiente a esa zona
3. El jugador se coloca en el centro de la zona

**Mapeo de Zonas a Posiciones:**
- Portero → Posición "Portero"
- Defensas (todas) → Posición "Defensa"
- Volantes (todos) → Posición "Volante"
- Delanteros (todos) → Posición "Delantero"

### 3. Interfaz Visual

**Cancha:**
- Altura aumentada a 500px para mejor visualización
- Líneas divisorias sutiles que marcan las zonas (33% y 66% en ambos ejes)
- Etiquetas de zona visibles cuando no hay jugador asignado
- Jugadores más grandes (12x12) para mejor visibilidad

**Etiquetas:**
- Se muestran en cada zona vacía
- Desaparecen cuando un jugador ocupa la zona
- Cada jugador muestra su nombre y la zona asignada

### 4. Funcionalidad

**Drag & Drop:**
- Arrastra un jugador desde el banco a cualquier parte de la cancha
- El sistema detecta automáticamente en qué zona se soltó
- Asigna la posición correspondiente sin necesidad de diálogo

**Detección de Zonas:**
```typescript
// División de la cancha:
// Y > 80% = Portero
// Y 55-80% = Defensas (dividido en 3 columnas)
// Y 30-55% = Volantes (dividido en 3 columnas)
// Y < 30% = Delanteros (dividido en 3 columnas)
```

### 5. Eliminaciones
- Removido el componente `PositionSelectDialog`
- Eliminado el estado `showPositionDialog`
- Eliminado el estado `playerForPosition`
- Eliminada la función `handlePositionConfirm`

## Ventajas del Nuevo Sistema

1. **Más Intuitivo:** Los entrenadores ven visualmente dónde colocar a cada jugador
2. **Más Rápido:** No hay necesidad de abrir un diálogo adicional
3. **Más Visual:** Las zonas están claramente marcadas en la cancha
4. **Automático:** La posición se asigna automáticamente según la zona

## Uso

1. Arrastra un jugador desde el banco
2. Suéltalo en la zona deseada de la cancha
3. El jugador se posiciona automáticamente en el centro de esa zona
4. La posición se guarda automáticamente en la base de datos

## Notas Técnicas

- Las zonas están definidas en `ZONE_POSITIONS` con coordenadas fijas
- La función `getZoneFromPosition()` convierte coordenadas a zonas
- La función `getPositionIdFromZone()` mapea zonas a IDs de posiciones
- El sistema mantiene compatibilidad con el sistema de cambios existente

## Base de Datos

### Migración: `20251116000001_add_field_zone.sql`
- ✅ Agregada columna `field_zone` (text) a `match_player_periods`
- ✅ Índice creado para mejorar consultas
- ✅ Migración aplicada a la base de datos

### Estructura de Datos
```typescript
type PlayerWithPeriod = {
  ...Player
  currentPeriod: PeriodFraction | null
  positionId: number | null
  fieldZone: FieldZone | null  // Nueva propiedad
}
```

### Flujo de Guardado
1. Usuario arrastra jugador a una zona
2. Se detecta la zona mediante `getZoneFromPosition(x, y)`
3. Se obtiene el `position_id` mediante `getPositionIdFromZone(zone)`
4. Se guarda en BD: `upsertMatchPeriod(matchId, playerId, period, fraction, positionId, fieldZone)`
5. La tabla `match_player_periods` almacena tanto `position_id` como `field_zone`

### Flujo de Recuperación
1. Se cargan los datos de `match_player_periods` incluyendo `field_zone`
2. Si el jugador tiene `field_zone` guardado, se usa esa zona
3. Si no tiene zona guardada, se usa `getDefaultZone()` como fallback
4. El jugador aparece en la zona correcta al reabrir el diálogo
