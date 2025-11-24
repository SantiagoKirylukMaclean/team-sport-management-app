# Implementación del Sistema de Gestión de Partidos

## Resumen
Sistema completo para que coaches/admins gestionen partidos de sus equipos y registren minutos jugados por cuarto (1-4) con granularidad FULL (1.0) o HALF (0.5).

## Archivos Creados

### Migración
- `supabase/migrations/20251020020000_matches.sql`
  - Enum `period_fraction` con valores 'FULL' | 'HALF'
  - Tabla `matches` (team_id, opponent, match_date, location, notes)
  - Tabla `match_player_periods` (match_id, player_id, period, fraction) con PK compuesta
  - RLS policies para super_admin y coach/admin

### Servicios
- `src/services/matches.ts`
  - Tipos: `Match`, `PeriodFraction`
  - Funciones: `listMatches`, `createMatch`, `updateMatch`, `deleteMatch`
  - Funciones de períodos: `listMatchPeriods`, `upsertMatchPeriod`

### UI - Páginas
- `src/pages/coach/MatchesPage.tsx`
  - Lista de partidos por equipo
  - Selector de equipo
  - Acciones: Nuevo, Editar, Eliminar, Minutos

### UI - Componentes
- `src/pages/coach/components/MatchFormDialog.tsx`
  - Formulario para crear/editar partidos
  - Campos: opponent (required), match_date (required), location, notes

- `src/pages/coach/components/MatchLineupPanel.tsx`
  - Panel de minutos por cuarto
  - Tabla: jugadores × Q1-Q4
  - Selectores FULL/HALF por jugador/período
  - Cálculo de totales (FULL=1.0, HALF=0.5)

### Rutas y Navegación
- `src/main.tsx`: Agregada ruta `/coach/matches`
- `src/layouts/CoachLayout.tsx`: Agregado ítem "Partidos" con ícono Trophy
- `src/components/layout/SideBar.tsx`: Agregado ítem "Partidos" en coachItems

## Características Implementadas

### RLS (Row Level Security)
- **Super Admin**: Acceso total a todas las tablas
- **Coach/Admin**: 
  - `matches`: CRUD solo si `is_coach_of_team(team_id)`
  - `match_player_periods`: CRUD solo si el match.team_id coincide con player.team_id y es coach del equipo

### Validaciones
- Período debe estar entre 1 y 4
- Fracción solo acepta 'FULL' o 'HALF'
- Opponent y match_date son obligatorios
- RLS valida permisos por equipo

### Funcionalidades
1. **CRUD de Partidos**
   - Crear partido con oponente, fecha, lugar y notas
   - Editar información del partido
   - Eliminar partido (con confirmación)
   - Filtrar por equipo

2. **Gestión de Minutos**
   - Panel dedicado por partido
   - Selector FULL/HALF para cada jugador en cada cuarto
   - Cálculo automático de totales por jugador
   - Upsert automático (delete + insert por PK compuesta)

3. **UI/UX**
   - Toasts para feedback de operaciones
   - Loading states
   - Validación de formularios
   - Diseño responsive con tablas

## Próximos Pasos Sugeridos

1. **Testing**
   - Tests unitarios para servicios
   - Tests de integración para componentes
   - Tests de migración SQL

2. **Mejoras Opcionales**
   - Estadísticas de minutos jugados por jugador
   - Exportar datos de partidos
   - Filtros por fecha/oponente
   - Ordenamiento de columnas

3. **Validaciones Adicionales**
   - Prevenir duplicados de partidos
   - Validar fechas futuras/pasadas
   - Límites de minutos por jugador

## Verificación

Para verificar la implementación:

1. Aplicar migración: `supabase db push`
2. Verificar tablas y policies en Supabase Dashboard
3. Acceder a `/coach/matches` como coach/admin
4. Crear un partido de prueba
5. Abrir panel de minutos y asignar FULL/HALF a jugadores
6. Verificar que los totales se calculen correctamente
