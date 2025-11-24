# Sistema de Convocatorias para Partidos

## Resumen
Sistema completo de convocatorias que permite seleccionar qué jugadores participan en cada partido y valida que todos los convocados jueguen mínimo 2 cuartos.

## Archivos Creados/Modificados

### Migración
- **`supabase/migrations/20251026000000_match_call_ups.sql`**
  - Tabla `match_call_ups` (match_id, player_id) con PK compuesta
  - RLS policies para super_admin y coach/admin
  - Vista `match_call_ups_with_periods` que muestra convocados con conteo de períodos
  - Función `validate_match_minimum_periods()` que retorna jugadores que no cumplen mínimo 2 cuartos

### Servicios
- **`src/services/matches.ts`** (actualizado)
  - Tipos: `MatchCallUp`, `CallUpWithPeriods`, `ValidationResult`
  - Funciones:
    - `listMatchCallUps()`: Lista convocados de un partido
    - `addPlayerToCallUp()`: Agrega un jugador a convocatoria
    - `removePlayerFromCallUp()`: Elimina un jugador de convocatoria
    - `setMatchCallUps()`: Reemplaza todas las convocatorias (delete + insert)
    - `listMatchCallUpsWithPeriods()`: Lista convocados con conteo de períodos
    - `validateMatchMinimumPeriods()`: Valida regla de mínimo 2 cuartos

### Componentes UI
- **`src/components/ui/alert.tsx`** (nuevo)
  - Componente Alert con variantes (default, destructive)
  - AlertTitle y AlertDescription

- **`src/components/ui/checkbox.tsx`** (nuevo)
  - Componente Checkbox basado en Radix UI

- **`src/pages/coach/components/MatchCallUpDialog.tsx`** (nuevo)
  - Dialog para seleccionar jugadores convocados
  - Lista con checkboxes de todos los jugadores del equipo
  - Contador de jugadores seleccionados
  - Guarda convocatorias con `setMatchCallUps()`

- **`src/pages/coach/components/MatchLineupPanel.tsx`** (actualizado)
  - Ahora muestra SOLO jugadores convocados
  - Valida automáticamente la regla de mínimo 2 cuartos
  - Muestra alerta roja con jugadores que no cumplen la regla
  - Resalta en rojo las filas de jugadores con error
  - Revalida después de cada cambio de período
  - Mensaje cuando no hay jugadores convocados

- **`src/pages/coach/MatchesPage.tsx`** (actualizado)
  - Nuevo botón "Convocar" (icono UserCheck) en cada partido
  - Abre `MatchCallUpDialog` para gestionar convocatorias
  - Orden de botones: Convocar → Minutos → Editar → Eliminar

## Flujo de Uso

1. **Crear Partido**: Coach crea un partido con fecha, oponente, etc.
2. **Convocar Jugadores**: Coach hace clic en botón "Convocar" y selecciona jugadores
3. **Asignar Minutos**: Coach hace clic en "Minutos" y asigna períodos (FULL/HALF)
4. **Validación Automática**: 
   - Si un convocado tiene menos de 2 cuartos → alerta roja
   - Fila del jugador se resalta en rojo
   - Total de cuartos se muestra en rojo

## Reglas de Negocio

### Convocatorias
- Solo jugadores del mismo equipo del partido pueden ser convocados
- Un jugador puede estar convocado o no convocado (binario)
- Las convocatorias se pueden modificar en cualquier momento

### Validación de Minutos
- **Regla**: Todos los jugadores convocados DEBEN jugar mínimo 2 cuartos
- **Validación**: Se ejecuta automáticamente después de cada cambio
- **Feedback Visual**:
  - Alerta roja en la parte superior con lista de jugadores que no cumplen
  - Fila del jugador resaltada en rojo
  - Icono de advertencia junto al nombre
  - Total de cuartos en rojo

### Panel de Minutos
- Solo muestra jugadores convocados
- Si no hay convocados → mensaje informativo
- Cada período puede ser FULL (1.0) o HALF (0.5)
- Total se calcula automáticamente

## RLS (Row Level Security)

### match_call_ups
- **Super Admin**: Acceso total
- **Coach/Admin**: CRUD solo si:
  - Es coach del equipo del partido
  - El jugador pertenece al mismo equipo del partido

## Base de Datos

### Tabla: match_call_ups
```sql
match_id bigint (FK → matches.id)
player_id bigint (FK → players.id)
created_at timestamptz
PRIMARY KEY (match_id, player_id)
```

### Vista: match_call_ups_with_periods
```sql
match_id, player_id, called_up_at, periods_played (count)
```

### Función: validate_match_minimum_periods(p_match_id)
Retorna:
```sql
player_id, full_name, periods_played
```
Solo jugadores con periods_played < 2

## Dependencias Instaladas
- `@radix-ui/react-checkbox`: Para el componente Checkbox

## Próximos Pasos Sugeridos

1. **Testing**
   - Tests unitarios para servicios de convocatorias
   - Tests de integración para validación de mínimo 2 cuartos
   - Tests de UI para MatchCallUpDialog

2. **Mejoras Opcionales**
   - Exportar lista de convocados
   - Historial de convocatorias por jugador
   - Estadísticas de convocatorias (% de veces convocado)
   - Notificaciones a jugadores convocados

3. **Validaciones Adicionales**
   - Prevenir cerrar panel de minutos si hay errores de validación
   - Confirmación antes de guardar con errores
   - Sugerencias automáticas de asignación de períodos

## Verificación

Para verificar la implementación:

1. Aplicar migración: `supabase db push`
2. Verificar tabla `match_call_ups` en Supabase Dashboard
3. Acceder a `/coach/matches`
4. Crear un partido
5. Hacer clic en "Convocar" y seleccionar jugadores
6. Hacer clic en "Minutos" y verificar que solo aparecen convocados
7. Asignar menos de 2 cuartos a un jugador → debe aparecer alerta roja
8. Asignar 2+ cuartos → alerta debe desaparecer
