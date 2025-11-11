# Página de Estadísticas Completas

## Resumen

Se ha creado una página completa de estadísticas en `/estadisticas` que muestra todas las métricas posibles del equipo, incluyendo jugadores, partidos, goles, asistencias, entrenamientos, resultados por cuarto y formaciones.

## Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/services/statistics.ts`**
   - Servicio completo para obtener todas las estadísticas del equipo
   - Funciones implementadas:
     - `getTeamPlayerStatistics()` - Estadísticas de jugadores (entrenamientos y partidos)
     - `getPlayerGoalStats()` - Goles y asistencias por jugador
     - `getFormationStatistics()` - Análisis de formaciones más ganadoras
     - `getQuarterPerformance()` - Rendimiento por cuarto
     - `getMatchResults()` - Historial de resultados de partidos
     - `getTeamOverallStats()` - Estadísticas generales del equipo

2. **`src/pages/coach/StatisticsPage.tsx`**
   - Página completa con todas las estadísticas
   - Selector de equipo para coaches con múltiples equipos
   - 6 pestañas con diferentes vistas:
     - **Jugadores**: Rendimiento general de cada jugador
     - **Goles**: Ranking de goleadores y asistidores
     - **Partidos**: Historial completo de partidos
     - **Cuartos**: Análisis por cuarto (goles, victorias, derrotas)
     - **Formaciones**: Formaciones más efectivas
     - **Asistencias**: Ranking de asistencia a entrenamientos

3. **`src/components/ui/tabs.tsx`**
   - Componente de pestañas usando Radix UI
   - Permite navegar entre diferentes secciones de estadísticas

### Archivos Modificados

1. **`src/main.tsx`**
   - Actualizada la ruta `/estadisticas` para usar la nueva página
   - Importada `StatisticsPage` en lugar de `PlayerMatchStatsPage`

2. **`src/layouts/CoachLayout.tsx`**
   - Agregado link "Estadísticas" en el menú del coach
   - Icono: BarChart3

3. **`package.json`**
   - Agregada dependencia: `@radix-ui/react-tabs`

## Características Implementadas

### 1. Selector de Equipo
- Dropdown para seleccionar entre múltiples equipos asignados
- Auto-selección del primer equipo disponible
- Solo visible para coaches (no para jugadores)

### 2. Tarjetas de Resumen General
Muestra 4 métricas principales:
- **Partidos Jugados**: Total con desglose V-E-D
- **% Victorias**: Porcentaje con barra de progreso
- **Diferencia de Goles**: A favor y en contra
- **Asistencia Entrenamientos**: Promedio del equipo

### 3. Pestaña de Jugadores
Tabla con:
- Nombre y número de camiseta
- Partidos jugados y % de convocatorias
- Promedio de cuartos jugados
- Entrenamientos asistidos y % de asistencia

### 4. Pestaña de Goles
Ranking de goleadores con:
- Posición (trofeo dorado para el primero)
- Nombre y número
- Total de goles (badge verde)
- Total de asistencias (badge azul)
- Total combinado

### 5. Pestaña de Partidos
Historial completo con:
- Fecha del partido
- Oponente
- Resultado (Victoria/Empate/Derrota)
- Marcador
- Indicador visual de tendencia

### 6. Pestaña de Cuartos
Análisis por cada cuarto:
- Goles a favor y en contra
- Diferencia de goles
- Victorias, empates y derrotas por cuarto
- Identifica cuartos más fuertes/débiles

### 7. Pestaña de Formaciones
Análisis de efectividad:
- Formación (número de jugadores iniciales)
- Partidos jugados con esa formación
- % de victorias con barra de progreso
- Registro V-E-D
- Goles a favor y en contra
- Diferencia de goles
- Ordenado por % de victorias (más efectivas primero)

### 8. Pestaña de Asistencias
Ranking de asistencia a entrenamientos:
- Nombre y número
- Asistencias totales
- % de asistencia con badge de color según rendimiento:
  - Verde (≥90%): Excelente
  - Gris (≥75%): Bueno
  - Rojo (<75%): Necesita mejorar
- Barra de progreso visual

## Datos Utilizados

La página consume datos de las siguientes tablas:
- `players` - Información de jugadores
- `matches` - Partidos del equipo
- `match_call_ups` - Convocatorias
- `match_player_periods` - Períodos jugados
- `match_quarter_results` - Resultados por cuarto
- `match_goals` - Goles con goleador y asistidor
- `training_sessions` - Entrenamientos
- `training_attendance` - Asistencia a entrenamientos

## Acceso

La página está disponible en:
- **URL**: `http://localhost:5173/estadisticas`
- **Menú Coach**: Panel de Entrenador → Estadísticas
- **Menú Principal**: Disponible en el sidebar principal

## Estados de Carga

- Spinner mientras carga equipos
- Spinner mientras carga estadísticas
- Mensajes informativos cuando no hay datos
- Manejo de errores con toasts

## Responsive

- Grid adaptativo para las tarjetas de resumen (1-4 columnas según pantalla)
- Pestañas con scroll horizontal en móviles
- Tablas con scroll horizontal cuando es necesario

## Próximas Mejoras Sugeridas

1. Filtros por fecha (mes, temporada, año)
2. Exportar estadísticas a PDF/Excel
3. Gráficos visuales (charts) para tendencias
4. Comparación entre equipos
5. Estadísticas individuales detalladas por jugador
6. Predicciones y análisis avanzados
7. Estadísticas de lesiones y disponibilidad
8. Análisis de rendimiento por rival
