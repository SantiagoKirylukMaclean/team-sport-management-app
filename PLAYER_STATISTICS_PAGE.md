# Página de Estadísticas para Jugadores

## Resumen

Se ha implementado una nueva página en `/estadisticasdores` que muestra las estadísticas personales del jugador logueado y las estadísticas completas del equipo al que pertenece.

## Ruta

La página está disponible en: `http://localhost:5173/estadisticasdores`

También accesible desde el menú lateral con el enlace "Mis Estadísticas".

## Archivos Creados

### 1. `src/pages/player/PlayerStatisticsPage.tsx`
Página principal que muestra:

#### Estadísticas Personales del Jugador
- **Partidos**: Cantidad de partidos jugados, porcentaje de asistencia
- **Cuartos Jugados**: Promedio de cuartos jugados por partido
- **Entrenamientos**: Asistencia a entrenamientos con porcentaje
- **Goles y Asistencias**: Total de goles y asistencias del jugador

#### Estadísticas del Equipo
- **Partidos Jugados**: Total de partidos con victorias, empates y derrotas
- **% Victorias**: Porcentaje de victorias del equipo
- **Diferencia de Goles**: Goles a favor y en contra
- **Asistencia a Entrenamientos**: Promedio del equipo

#### Tabs con Información Detallada
1. **Partidos**: Historial completo de partidos con resultados
2. **Cuartos**: Rendimiento por cuarto (goles, victorias, derrotas)
3. **Goleadores**: Ranking de goleadores del equipo (destacando al jugador actual)

### 2. `src/components/RouteGuards/PlayerGuard.tsx`
Componente de protección de rutas para asegurar que solo jugadores autenticados puedan acceder a rutas específicas (creado pero no utilizado actualmente).

### 3. Migraciones de Base de Datos
- `supabase/migrations/20251111000000_player_self_read.sql`: Primera versión de política RLS
- `supabase/migrations/20251111000001_fix_player_rls.sql`: Política RLS corregida para players
- `supabase/migrations/20251111000002_player_read_team.sql`: Política RLS para que players puedan leer su equipo

### 4. Actualización del Sidebar
- `src/components/layout/SideBar.tsx`: Agregado enlace "Mis Estadísticas"

## Funcionalidad

### Carga de Datos
1. Al cargar la página, se obtiene la información del jugador vinculado al usuario logueado mediante `user_id`
2. Se cargan todas las estadísticas del equipo al que pertenece el jugador
3. Se filtran las estadísticas personales del jugador de entre todas las del equipo

### Visualización
- **Cards con métricas clave**: Muestra las 4 métricas más importantes del jugador
- **Cards del equipo**: Muestra las 4 métricas principales del equipo
- **Tabs interactivos**: Permite navegar entre diferentes vistas de estadísticas
- **Tablas ordenadas**: Información detallada en formato tabular
- **Badges y Progress bars**: Visualización clara de porcentajes y estados

### Casos Especiales
- Si el usuario no está vinculado a ningún jugador, se muestra un mensaje informativo
- Si no hay datos disponibles, se muestran mensajes apropiados en cada sección
- Estados de carga mientras se obtienen los datos

## Políticas RLS Implementadas

Para que la página funcione correctamente, se implementaron las siguientes políticas de Row Level Security:

1. **`players_read_own`**: Permite a los jugadores leer su propio registro en la tabla `players` cuando `user_id = auth.uid()`

2. **`teams_player_read_own`**: Permite a los jugadores leer información de su equipo mediante un EXISTS que verifica si tienen un registro en `players` vinculado a ese equipo

Estas políticas son esenciales para que los jugadores puedan acceder a sus datos sin necesidad de ser coach o admin.

## Integración

### Base de Datos
La página utiliza la relación `players.user_id` que vincula un jugador con un usuario autenticado:
- Tabla: `players`
- Columna: `user_id` (UUID, referencia a `auth.users`)
- Constraint: `uniq_players_user_id` (un usuario solo puede estar vinculado a un jugador)

### Servicios Utilizados
- `getTeamPlayerStatistics()`: Estadísticas de todos los jugadores del equipo
- `getPlayerGoalStats()`: Goles y asistencias de todos los jugadores
- `getQuarterPerformance()`: Rendimiento por cuarto del equipo
- `getMatchResults()`: Historial de partidos
- `getTeamOverallStats()`: Estadísticas generales del equipo

## Permisos

La página está accesible para cualquier usuario autenticado. El sistema automáticamente:
1. Verifica que el usuario esté autenticado
2. Busca el jugador vinculado al usuario mediante `user_id`
3. Carga las estadísticas del equipo correspondiente
4. Filtra y destaca las estadísticas personales del jugador

## Características Destacadas

1. **Diseño Responsivo**: Se adapta a diferentes tamaños de pantalla
2. **Información Contextual**: El jugador puede ver su rendimiento en el contexto del equipo
3. **Destacado Visual**: En la tabla de goleadores, el jugador actual se destaca con un badge "Tú"
4. **Métricas Claras**: Uso de colores y badges para facilitar la comprensión
5. **Manejo de Errores**: Mensajes claros cuando no hay datos o hay errores

## Próximos Pasos Sugeridos

1. Agregar filtros por fecha/temporada
2. Agregar gráficos visuales (charts) para mejor comprensión
3. Agregar comparación con otros jugadores del equipo
4. Agregar estadísticas de evolución temporal
5. Agregar notificaciones cuando mejore su rendimiento
