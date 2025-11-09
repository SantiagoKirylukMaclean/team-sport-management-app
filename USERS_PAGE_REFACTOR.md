# Refactor Completo - Página de Gestión de Usuarios

## 🎯 Cambios Principales

### 1. **Listado Simplificado**
- ✅ Los roles ahora son **solo lectura** en la tabla
- ✅ Se muestra como Badge con colores distintivos
- ✅ No se puede modificar directamente desde la tabla

### 2. **Modal de Edición Centralizado**
- ✅ Un solo botón "Editar" por usuario
- ✅ Modal completo con todas las opciones de configuración
- ✅ Flujo paso a paso más claro

## 📋 Flujo de Edición por Rol

### **Super Admin**
- No requiere asignaciones adicionales
- Acceso total al sistema

### **Admin**
- **Selección por Clubs**
- Checkbox list de todos los clubs disponibles
- Puede seleccionar múltiples clubs
- Automáticamente obtiene acceso a TODOS los equipos de los clubs seleccionados
- Formato: `Club Name (Sport Name)`

### **Coach**
- **Selección por Equipos**
- Checkbox list de todos los equipos disponibles
- Puede seleccionar múltiples equipos
- Solo gestiona los equipos específicos seleccionados
- Formato: `Team Name - Club Name (Sport Name)`

### **Player**
- **Vinculación con Jugador**
- Sistema de filtros en cascada:
  1. **Deporte** → Filtra clubs y equipos
  2. **Club** → Filtra equipos
  3. **Equipo** → Filtra jugadores
- Solo muestra jugadores sin usuario vinculado
- Selección única (un usuario = un jugador)
- Formato: `Player Name #Jersey - Team Name (Club Name)`

## 🎨 Interfaz Mejorada

### Tabla de Usuarios
```
┌─────────────────────────────────────────────────────────────┐
│ Email          │ Nombre │ Rol    │ Fecha      │ Acciones   │
├─────────────────────────────────────────────────────────────┤
│ user@email.com │ John   │ [Coach]│ 01/01/2025 │ [Editar][Reset]│
└─────────────────────────────────────────────────────────────┘
```

### Modal de Edición

#### Paso 1: Seleccionar Rol
```
┌─────────────────────────────────────┐
│ Rol del Usuario                     │
│ [Dropdown: Super Admin/Admin/Coach/Player] │
└─────────────────────────────────────┘
```

#### Paso 2: Asignaciones (según rol)

**Para Coach:**
```
┌─────────────────────────────────────┐
│ Equipos Asignados                   │
│ ☑ S9A - Monopol CE (Fútbol)        │
│ ☐ S10A - Monopol CE (Fútbol)       │
│ ☐ U12 - Club B (Basketball)        │
│                                     │
│ 2 equipos seleccionados             │
└─────────────────────────────────────┘
```

**Para Admin:**
```
┌─────────────────────────────────────┐
│ Clubs Asignados                     │
│ ☑ Monopol CE (Fútbol)              │
│ ☐ Club B (Basketball)              │
│                                     │
│ 1 club seleccionado                 │
└─────────────────────────────────────┘
```

**Para Player:**
```
┌─────────────────────────────────────┐
│ Filtros                             │
│ [Deporte ▼] [Club ▼] [Equipo ▼]   │
│                                     │
│ Jugadores disponibles (10)          │
│ ☐ Nicolai #16 - S9A (Monopol CE)   │
│ ☐ Ibai #1 - S9A (Monopol CE)       │
│ ☑ Unai #8 - S9A (Monopol CE)       │
└─────────────────────────────────────┘
```

## 🔄 Lógica de Guardado

### 1. Actualizar Rol
```typescript
UPDATE profiles 
SET role = 'coach' 
WHERE id = user_id
```

### 2. Limpiar Asignaciones Previas
```typescript
DELETE FROM user_team_roles 
WHERE user_id = user_id
```

### 3. Crear Nuevas Asignaciones

**Coach:**
```typescript
INSERT INTO user_team_roles (user_id, team_id, role)
VALUES 
  (user_id, team1_id, 'coach'),
  (user_id, team2_id, 'coach')
```

**Admin:**
```typescript
// Obtener todos los equipos de los clubs seleccionados
const clubTeams = teams.filter(t => selectedClubs.includes(t.club_id))

INSERT INTO user_team_roles (user_id, team_id, role)
VALUES 
  (user_id, team1_id, 'admin'),
  (user_id, team2_id, 'admin'),
  ...
```

**Player:**
```typescript
// Vincular jugador
UPDATE players 
SET user_id = user_id 
WHERE id = player_id

// Asignar al equipo del jugador
INSERT INTO user_team_roles (user_id, team_id, role)
VALUES (user_id, player_team_id, 'player')
```

## 📊 Estructura de Datos

### Interfaces Principales

```typescript
interface UserProfile {
  id: string
  email: string | null
  display_name: string | null
  role: AppRole
  created_at: string
}

interface TeamOption {
  id: number
  name: string
  club_id: number
  club_name: string
  sport_name: string
}

interface ClubOption {
  id: number
  name: string
  sport_name: string
}

interface PlayerOption {
  id: number
  full_name: string
  jersey_number: number | null
  team_id: number
  team_name: string
  club_name: string
  sport_name: string
  user_id: string | null
}
```

## 🎯 Ventajas del Refactor

### 1. **Claridad**
- ✅ Un solo punto de edición
- ✅ Flujo lineal y predecible
- ✅ No hay confusión sobre dónde hacer cambios

### 2. **Seguridad**
- ✅ No se pueden hacer cambios accidentales
- ✅ Confirmación explícita con botón "Guardar"
- ✅ Validación antes de guardar

### 3. **Usabilidad**
- ✅ Filtros en cascada para players
- ✅ Checkboxes para selección múltiple
- ✅ Contador de elementos seleccionados
- ✅ Mensajes claros de estado

### 4. **Mantenibilidad**
- ✅ Código más organizado
- ✅ Lógica separada por rol
- ✅ Fácil agregar nuevos roles o funcionalidades

## 🚀 Casos de Uso

### Caso 1: Asignar Coach a Múltiples Equipos
1. Click en "Editar" del usuario
2. Seleccionar rol "Coach"
3. Marcar checkboxes de equipos deseados
4. Click en "Guardar Cambios"
5. ✅ Usuario ahora es coach de esos equipos

### Caso 2: Promover Usuario a Admin de Club
1. Click en "Editar" del usuario
2. Seleccionar rol "Admin"
3. Marcar checkbox del club
4. Click en "Guardar Cambios"
5. ✅ Usuario ahora es admin de todos los equipos del club

### Caso 3: Vincular Jugador con Cuenta
1. Click en "Editar" del usuario
2. Seleccionar rol "Player"
3. Usar filtros para encontrar jugador:
   - Seleccionar deporte
   - Seleccionar club
   - Seleccionar equipo
4. Marcar checkbox del jugador
5. Click en "Guardar Cambios"
6. ✅ Usuario vinculado al jugador

### Caso 4: Cambiar Rol de Coach a Admin
1. Click en "Editar" del usuario coach
2. Cambiar rol a "Admin"
3. Seleccionar clubs (las asignaciones de equipos previas se limpian)
4. Click en "Guardar Cambios"
5. ✅ Usuario ahora es admin con nuevas asignaciones

## 🔧 Funciones Principales

### `handleEditUser(user)`
- Abre el modal de edición
- Inicializa el estado con los datos del usuario
- Resetea selecciones previas

### `handleSaveUser()`
- Actualiza el rol en `profiles`
- Limpia asignaciones previas en `user_team_roles`
- Crea nuevas asignaciones según el rol
- Para players, vincula en tabla `players`
- Recarga datos y cierra modal

### `toggleTeamSelection(teamId)`
- Agrega/remueve equipo de la selección
- Para rol Coach

### `toggleClubSelection(clubId)`
- Agrega/remueve club de la selección
- Para rol Admin

### `getFilteredPlayers()`
- Filtra jugadores según deporte/club/equipo
- Solo muestra jugadores sin usuario vinculado
- Para rol Player

## 📝 Notas Importantes

1. **Limpieza de Asignaciones**: Cada vez que se guarda, se limpian TODAS las asignaciones previas y se crean nuevas. Esto evita inconsistencias.

2. **Validación de Datos**: El sistema solo muestra opciones válidas (equipos existentes, jugadores sin vincular, etc.)

3. **Feedback Visual**: Contadores y mensajes claros sobre el estado de las selecciones

4. **Permisos RLS**: Todas las operaciones respetan las políticas de seguridad de Supabase

5. **Atomicidad**: Si algo falla durante el guardado, se muestra un error y no se aplican cambios parciales

## 🎨 Colores de Roles

- 🔴 **Super Admin**: Rojo
- 🟠 **Admin**: Naranja  
- 🔵 **Coach**: Azul
- 🟢 **Player**: Verde

## ✨ Mejoras Futuras Sugeridas

1. **Búsqueda en Listas**: Agregar búsqueda en las listas de equipos/clubs/jugadores
2. **Selección Masiva**: Botones "Seleccionar todos" / "Deseleccionar todos"
3. **Vista Previa**: Mostrar resumen de cambios antes de guardar
4. **Historial**: Log de cambios de roles y asignaciones
5. **Validaciones**: Prevenir guardar sin selecciones cuando es requerido
