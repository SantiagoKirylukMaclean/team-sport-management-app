# Guía Rápida: Invitación de Jugadores

## ¿Qué se implementó?

Se extendió el sistema de invitaciones para permitir invitar **jugadores (players)** y vincularlos automáticamente con sus registros en la tabla `players`.

## Cambios Principales

### 1. Base de Datos ✅

**Nueva columna en `players`:**
```sql
user_id uuid -- Vincula el jugador con el usuario autenticado
```

**Nueva columna en `pending_invites`:**
```sql
player_id bigint -- Para invitaciones de players, indica qué jugador vincular
```

**Rol 'player' ahora permitido en invitaciones**

### 2. Nueva Página de Invitación ✅

**Ruta:** `/admin/invite-player`

**Características:**
- Selector de jugadores sin cuenta
- Formulario simplificado
- Vinculación automática al aceptar

### 3. Componentes Nuevos ✅

- `PlayerSelect` - Selector de jugadores disponibles
- `InvitePlayerPage` - Página de invitación de players
- `players.ts` - Servicio para gestionar jugadores

### 4. Edge Function Actualizado ✅

Ahora acepta `role: 'player'` y `playerId` en las invitaciones.

## Cómo Usar

### Paso 1: Crear el jugador (si no existe)

```typescript
// En la página de gestión de jugadores
await supabase.from('players').insert({
  team_id: 5,
  full_name: 'Juan Pérez',
  jersey_number: 10
})
```

### Paso 2: Invitar al jugador

1. Ir a `/admin/invite-player`
2. Seleccionar el jugador del dropdown
3. Ingresar su email
4. Click en "Create Invitation"
5. Copiar y compartir el link generado

### Paso 3: El jugador acepta

1. El jugador recibe el link
2. Click en el link
3. Establece su contraseña
4. **Automáticamente vinculado:** `players.user_id` se actualiza

## Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin crea jugador en la tabla players                  │
│    (team_id, full_name, jersey_number)                     │
│    user_id = NULL                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Admin invita al jugador                                  │
│    - Selecciona jugador en /admin/invite-player            │
│    - Ingresa email                                          │
│    - Sistema genera link de invitación                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Jugador recibe y acepta invitación                      │
│    - Click en link                                          │
│    - Establece contraseña                                   │
│    - Trigger automático se ejecuta                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Vinculación automática                                   │
│    ✓ players.user_id = nuevo_usuario_id                    │
│    ✓ profiles.role = 'player'                              │
│    ✓ user_team_roles creado automáticamente                │
│    ✓ pending_invites.status = 'accepted'                   │
└─────────────────────────────────────────────────────────────┘
```

## Diferencias: Coach/Admin vs Player

| Característica | Coach/Admin | Player |
|----------------|-------------|--------|
| **Página** | `/admin/invite-user` | `/admin/invite-player` |
| **Equipos** | Múltiples | Solo uno (el del jugador) |
| **Vinculación** | No | Sí (con tabla `players`) |
| **Selector** | Multi-select de equipos | Selector de jugador |
| **Restricción** | Ninguna especial | Jugador debe existir y no tener cuenta |

## Consultas Útiles

### Ver jugadores con cuenta vinculada
```sql
select 
  p.full_name,
  p.jersey_number,
  pr.email,
  t.name as team
from players p
join profiles pr on pr.id = p.user_id
join teams t on t.id = p.team_id
where p.user_id is not null;
```

### Ver jugadores disponibles para invitar
```sql
select 
  p.id,
  p.full_name,
  p.jersey_number,
  t.name as team
from players p
join teams t on t.id = p.team_id
where p.user_id is null;
```

### Desvincular un jugador (si es necesario)
```sql
update players 
set user_id = null 
where id = 123;
```

## Ejemplo de Código

### Obtener información del jugador autenticado

```typescript
// En cualquier componente
const { data: player } = await supabase
  .from('players')
  .select(`
    *,
    teams (
      name,
      clubs (
        name
      )
    )
  `)
  .eq('user_id', user.id)
  .single()

if (player) {
  console.log(`Jugador: ${player.full_name}`)
  console.log(`Equipo: ${player.teams.name}`)
  console.log(`Número: ${player.jersey_number}`)
}
```

### Mostrar estadísticas solo del jugador actual

```typescript
// Dashboard de jugador
const { data: stats } = await supabase
  .from('player_statistics')
  .select('*')
  .eq('player_id', player.id)
  .order('created_at', { ascending: false })
```

### Verificar si el usuario es un jugador

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile.role === 'player') {
  // Mostrar vista de jugador
  // Obtener su player_id
  const { data: playerInfo } = await supabase
    .from('players')
    .select('id, full_name, jersey_number')
    .eq('user_id', user.id)
    .single()
}
```

## Archivos Modificados/Creados

### Nuevos Archivos
- ✅ `supabase/migrations/20251107000000_player_invitations.sql`
- ✅ `src/pages/admin/InvitePlayerPage.tsx`
- ✅ `src/components/ui/player-select.tsx`
- ✅ `src/services/players.ts`
- ✅ `docs/PLAYER_INVITATION_SYSTEM.md`
- ✅ `docs/PLAYER_INVITATION_QUICK_START.md`

### Archivos Modificados
- ✅ `src/types/db.ts` - Agregado tipo `Player` y actualizado `PendingInvite`
- ✅ `src/main.tsx` - Agregada ruta `/admin/invite-player`
- ✅ `src/layouts/AdminLayout.tsx` - Agregado link en sidebar
- ✅ `supabase/functions/invite-user/index.ts` - Soporte para rol 'player'

## Próximos Pasos

1. **Aplicar migración:**
   ```bash
   supabase db reset  # Desarrollo
   # o
   supabase db push   # Producción
   ```

2. **Probar la funcionalidad:**
   - Crear un jugador sin cuenta
   - Invitarlo desde `/admin/invite-player`
   - Aceptar la invitación
   - Verificar vinculación en la base de datos

3. **Crear dashboard para players:**
   - Vista personalizada con sus estadísticas
   - Próximos partidos
   - Historial de entrenamientos

## Soporte

Para más detalles, consultar:
- [Documentación completa](./PLAYER_INVITATION_SYSTEM.md)
- [Sistema de invitaciones original](./USER_INVITATION_SYSTEM.md)
