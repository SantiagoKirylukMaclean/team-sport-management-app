# Información del Equipo en el Perfil del Jugador

## Resumen

Se agregó la visualización de la relación del jugador con su equipo en la página de perfil (`/profile`).

## Cambios Realizados

### 1. Actualización de la Página de Perfil (`src/pages/Profile.tsx`)

Se modificó la página de perfil para mostrar información del equipo cuando el usuario tiene rol de jugador:

- **Nueva interfaz `PlayerInfo`**: Define la estructura de datos del jugador y su equipo
- **Estado `playerInfo`**: Almacena la información del jugador vinculado al usuario
- **Consulta a la base de datos**: Cuando el usuario es un jugador, se consulta la tabla `players` para obtener:
  - Nombre del jugador
  - Número de camiseta
  - Equipo
  - Club
  - Deporte

- **Nueva tarjeta "Información del Equipo"**: Se muestra solo para usuarios con rol `player` y contiene:
  - Nombre del jugador
  - Número de camiseta (si existe)
  - Nombre del equipo
  - Nombre del club
  - Nombre del deporte

### 2. Nueva Migración de Base de Datos

**Archivo**: `supabase/migrations/20251111000005_player_read_club_sport.sql`

Se agregaron políticas RLS para permitir que los jugadores puedan leer información de su club y deporte:

- **`clubs_player_read_own`**: Permite a los jugadores leer información del club al que pertenece su equipo
- **`sports_player_read_own`**: Permite a los jugadores leer información del deporte de su club

Estas políticas complementan las políticas existentes:
- `players self read` (20251111000000): Permite leer su propio registro de jugador
- `teams_player_read_own` (20251111000002): Permite leer información de su equipo

## Flujo de Datos

```
Usuario autenticado (role: player)
    ↓
Consulta tabla players WHERE user_id = auth.uid()
    ↓
Obtiene: player → team → club → sport
    ↓
Muestra en tarjeta "Información del Equipo"
```

## Políticas RLS Aplicadas

Para que un jugador pueda ver su información completa, se requieren las siguientes políticas:

1. **players.players self read**: Permite leer su registro en `players`
2. **teams.teams_player_read_own**: Permite leer su equipo
3. **clubs.clubs_player_read_own**: Permite leer su club (NUEVA)
4. **sports.sports_player_read_own**: Permite leer su deporte (NUEVA)

## Ejemplo Visual

Cuando un jugador accede a `/profile`, verá:

```
┌─────────────────────────────────────┐
│ Información del Usuario             │
│ • Email: jugador@example.com        │
│ • Rol: Jugador                      │
│ • Cuenta Creada: ...                │
│ • Último Acceso: ...                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Información del Equipo              │
│ • Nombre del Jugador: Juan Pérez    │
│ • Número de Camiseta: #10           │
│ • Equipo: S9A                       │
│ • Club: Monopol CE                  │
│ • Deporte: Fútbol                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Cambiar Contraseña                  │
│ ...                                 │
└─────────────────────────────────────┘
```

## Notas Técnicas

- La información del equipo solo se muestra si el usuario tiene rol `player` y existe un registro vinculado en la tabla `players`
- Si el jugador no tiene número de camiseta asignado, ese campo no se muestra
- La consulta utiliza joins para obtener toda la información en una sola petición
- Se manejan correctamente los casos donde el jugador no tiene información vinculada
