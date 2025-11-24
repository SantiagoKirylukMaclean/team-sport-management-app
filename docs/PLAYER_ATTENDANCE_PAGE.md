# Página de Asistencia para Jugadores

## Resumen

Se implementó una página completa de asistencia en `/asistencia` que muestra al jugador logueado toda su información de asistencia a entrenamientos y convocatorias a partidos.

## Características Implementadas

### 1. Estadísticas Generales

Cuatro tarjetas con métricas clave:

- **Entrenamientos**: Total de entrenamientos registrados
- **Tasa de Asistencia**: Porcentaje de asistencia (a tiempo + tarde)
- **Partidos**: Total de convocatorias a partidos
- **Ausencias**: Número de entrenamientos perdidos

### 2. Historial de Entrenamientos

Pestaña que muestra:
- Fecha del entrenamiento
- Estado de asistencia con iconos visuales:
  - ✅ A tiempo (verde)
  - ⏰ Tarde (amarillo)
  - ❌ Ausente (rojo)
- Notas del entrenamiento (si existen)
- Ordenado por fecha descendente (más reciente primero)

### 3. Convocatorias a Partidos

Pestaña que muestra:
- Fecha del partido
- Rival
- Ubicación (local/visitante)
- Resultado (si está disponible)
- Estado: "Convocado"
- Ordenado por fecha descendente

## Estructura de Datos

### Training Attendance
```typescript
interface TrainingAttendance {
  training_id: number
  status: 'on_time' | 'late' | 'absent'
  training_sessions: {
    session_date: string
    notes: string | null
  }
}
```

### Match Call Ups
```typescript
interface MatchCallUp {
  match_id: number
  created_at: string
  matches: {
    match_date: string
    opponent: string
    location: string
    result: string | null
  }
}
```

### Statistics
```typescript
interface AttendanceStats {
  totalTrainings: number
  onTime: number
  late: number
  absent: number
  attendanceRate: number
  totalMatches: number
}
```

## Políticas RLS Aplicadas

### Nueva Migración: `20251112000000_player_read_attendance.sql`

Se agregaron tres políticas para permitir a los jugadores leer su información:

1. **`training_sessions_player_read_own`**
   - Permite leer sesiones de entrenamiento de su equipo
   - Tabla: `training_sessions`

2. **`training_attendance_player_read_own`**
   - Permite leer sus propios registros de asistencia
   - Tabla: `training_attendance`

3. **`match_call_ups_player_read_own`**
   - Permite leer sus propias convocatorias
   - Tabla: `match_call_ups`

### Políticas Existentes Utilizadas

- `players.players self read`: Permite obtener su player_id
- `matches.m player read own team`: Permite leer partidos de su equipo

## Flujo de Datos

```
Usuario autenticado (role: player)
    ↓
Obtiene player_id desde tabla players WHERE user_id = auth.uid()
    ↓
Consulta en paralelo:
    • training_attendance → training_sessions
    • match_call_ups → matches
    ↓
Calcula estadísticas
    ↓
Muestra en interfaz con tabs
```

## Componentes UI Utilizados

- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Alert`, `AlertDescription`
- Iconos de `lucide-react`:
  - `Calendar`: Fechas
  - `CheckCircle2`: Asistencia a tiempo
  - `XCircle`: Ausencias
  - `Clock`: Llegadas tarde
  - `Trophy`: Partidos
  - `Timer`: Entrenamientos
  - `Loader2`: Estado de carga

## Manejo de Estados

### Estados de Carga
- **Loading**: Muestra spinner mientras carga datos
- **Error**: Muestra alerta con mensaje de error
- **Sin datos**: Mensajes amigables cuando no hay registros

### Estados de Asistencia
- **on_time**: Verde, "A tiempo"
- **late**: Amarillo, "Tarde"
- **absent**: Rojo, "Ausente"

## Formato de Fechas

Las fechas se muestran en formato largo en español:
```
"lunes, 12 de noviembre de 2025"
```

## Ejemplo Visual

```
┌─────────────────────────────────────────────────────────┐
│ Asistencia                                              │
│ Tu historial de asistencia a entrenamientos y partidos │
└─────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Entrenamientos│ Tasa de      │ Partidos     │ Ausencias    │
│      25       │ Asistencia   │      8       │      2       │
│               │     92%      │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────┐
│ [Entrenamientos] [Partidos]                             │
│                                                          │
│ ✅ lunes, 11 de noviembre de 2025                       │
│    Entrenamiento táctico                    A tiempo    │
│                                                          │
│ ⏰ viernes, 8 de noviembre de 2025                      │
│    Preparación física                       Tarde       │
│                                                          │
│ ❌ miércoles, 6 de noviembre de 2025                    │
│    Entrenamiento técnico                    Ausente     │
└─────────────────────────────────────────────────────────┘
```

## Acceso

- **Ruta**: `/asistencia`
- **Rol requerido**: `player` (jugador autenticado)
- **Navegación**: Disponible en el menú lateral

## Seguridad

- Solo los jugadores pueden acceder a sus propios datos
- Las políticas RLS garantizan que cada jugador solo vea su información
- No se puede acceder a datos de otros jugadores
- Requiere autenticación válida

## Mejoras Futuras Posibles

1. Filtros por rango de fechas
2. Exportar historial a PDF/CSV
3. Gráficos de tendencia de asistencia
4. Comparación con promedio del equipo
5. Notificaciones de próximos entrenamientos
6. Justificación de ausencias
