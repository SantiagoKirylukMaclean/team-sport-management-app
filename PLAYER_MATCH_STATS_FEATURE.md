# Estadísticas de Partidos por Jugador

## Descripción
Nueva funcionalidad que permite visualizar estadísticas de rendimiento de jugadores en partidos, mostrando el porcentaje de cuartos jugados por cada jugador.

## Ubicación
- **Ruta**: `/estadisticas`
- **Menú**: Menú principal > Estadísticas (antes de Notes)

## Características

### Visualización de Datos
- **Gráfico de barras de progreso**: Muestra visualmente el % de cuartos jugados
- **Tabla detallada** con las siguientes columnas:
  - Nombre del jugador
  - Número de camiseta
  - Partidos convocados (de total de partidos)
  - % de convocatorias
  - Promedio de cuartos jugados
  - Barra de progreso visual del % de cuartos

### Permisos por Rol

#### Admin y Coach
- Pueden ver estadísticas de **todos los jugadores** de sus equipos asignados
- Pueden seleccionar entre diferentes equipos usando un selector
- Tienen acceso completo a todas las estadísticas

#### Jugador
- Solo puede ver **sus propias estadísticas**
- No tiene selector de equipo (se muestra automáticamente su información)
- Vista limitada a su rendimiento personal

### Interactividad
- **Click en jugador**: Al hacer click en cualquier fila de la tabla, navega al detalle del jugador
- **Ordenamiento**: Los jugadores se ordenan automáticamente por promedio de cuartos jugados (mayor a menor)
- **Indicadores visuales**: 
  - Verde: ≥75% de cuartos jugados
  - Amarillo: ≥50% de cuartos jugados
  - Rojo: <50% de cuartos jugados

## Cálculo de Estadísticas

Las estadísticas se calculan usando la vista `player_statistics` que incluye:

```sql
-- Promedio de períodos jugados (solo partidos convocados)
avg_periods_played = AVG(períodos_por_partido)

-- Donde cada período puede ser:
-- FULL = 1.0 cuarto
-- HALF = 0.5 cuarto
```

### Porcentaje de Cuartos
```
% Cuartos = (avg_periods_played / 4) * 100
```

## Archivos Creados/Modificados

### Nuevos Archivos
1. `src/pages/PlayerMatchStatsPage.tsx` - Página principal de estadísticas
2. `src/components/ui/progress.tsx` - Componente de barra de progreso

### Archivos Modificados
1. `src/main.tsx` - Agregada ruta `/estadisticas` en el menú principal
2. `src/components/layout/SideBar.tsx` - Agregado ítem "Estadísticas" en menú principal (antes de Notes)
3. `src/layouts/CoachLayout.tsx` - Removido ítem de estadísticas (ya no está en panel Coach)

## Dependencias
- Usa la función existente `getTeamPlayerStatistics()` del servicio de jugadores
- Requiere las migraciones de estadísticas ya existentes:
  - `20251104000000_player_statistics.sql`
  - `20251104000001_fix_player_statistics.sql`

## Uso

### Para Coach/Admin
1. Navegar a "Estadísticas" en el menú lateral principal
2. Seleccionar el equipo deseado del selector
3. Ver las estadísticas de todos los jugadores
4. Hacer click en un jugador para ver más detalles

### Para Jugador
1. Navegar a "Estadísticas" en el menú lateral principal
2. Ver automáticamente sus propias estadísticas
3. No requiere selección de equipo

## Accesibilidad
- **Todos los roles** pueden acceder a esta página desde el menú principal
- La página está ubicada antes de "Notes" en el menú lateral
- El filtrado de datos se hace automáticamente según el rol del usuario

## Próximas Mejoras Sugeridas
- [ ] Crear página de detalle individual del jugador (`/coach/players/:id`)
- [ ] Agregar filtros por rango de fechas
- [ ] Exportar estadísticas a CSV/PDF
- [ ] Gráficos adicionales (tendencias, comparativas)
- [ ] Estadísticas por posición en el campo
