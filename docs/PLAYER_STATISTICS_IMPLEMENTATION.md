# Implementación de Estadísticas de Jugadores

## Resumen
Se agregó funcionalidad para mostrar estadísticas de jugadores en la página de Jugadores, incluyendo:
- % de asistencia a entrenamientos
- % de asistencia a partidos (convocatorias)
- Promedio de períodos jugados por partido

## Archivos Modificados

### 1. Base de Datos
**`supabase/migrations/20251104000000_player_statistics.sql`**
- Vista `player_statistics` que calcula todas las estadísticas por jugador
- Función `get_team_player_statistics(p_team_id)` para obtener stats por equipo

#### Lógica de Cálculo:
- **Asistencia a entrenamientos**: Cuenta `on_time` y `late` como asistencia
- **Asistencia a partidos**: Basado en convocatorias (`match_call_ups`)
- **Promedio períodos**: Solo partidos convocados, FULL=1.0, HALF=0.5

### 2. Servicio
**`src/services/players.ts`**
- Nuevo tipo `PlayerStatistics` con todas las métricas
- Nueva función `getTeamPlayerStatistics(teamId)` para obtener estadísticas

### 3. Interfaz
**`src/pages/coach/PlayersPage.tsx`**
- Selector de equipo (ya existía)
- Tabla actualizada con columnas de estadísticas:
  - % Asist. Entrenamientos (con contador X/Y)
  - % Asist. Partidos (con contador X/Y)
  - Prom. Períodos
- Carga paralela de jugadores y estadísticas

## Estructura de Datos

### PlayerStatistics
```typescript
{
  player_id: number
  team_id: number
  full_name: string
  jersey_number: number | null
  total_trainings: number          // Total entrenamientos del equipo
  trainings_attended: number       // Entrenamientos asistidos (on_time + late)
  training_attendance_pct: number  // Porcentaje de asistencia
  total_matches: number            // Total partidos del equipo
  matches_called_up: number        // Partidos convocado
  match_attendance_pct: number     // Porcentaje de convocatorias
  avg_periods_played: number       // Promedio períodos (FULL=1, HALF=0.5)
}
```

## Próximos Pasos (Sugeridos)
- Agregar vista de detalle al hacer click en un jugador
- Mostrar historial completo de asistencias
- Gráficos de evolución temporal
- Filtros por rango de fechas
