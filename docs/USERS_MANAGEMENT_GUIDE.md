# Guía de Gestión de Usuarios

## Descripción General

La página de gestión de usuarios (`/admin/users`) proporciona una interfaz completa para que los super administradores gestionen todos los aspectos relacionados con los usuarios del sistema.

## Acceso

- **URL**: `http://localhost:5173/admin/users`
- **Permisos requeridos**: Super Admin
- **Ubicación**: Panel de administración → Usuarios

## Funcionalidades

### 1. Visualización de Usuarios

La página muestra una tabla con todos los usuarios registrados en el sistema, incluyendo:

- **Email**: Dirección de correo electrónico del usuario
- **Nombre**: Nombre para mostrar (display_name)
- **Rol**: Rol actual del usuario en el sistema
- **Fecha de Registro**: Cuándo se creó la cuenta

### 2. Filtros y Búsqueda

#### Búsqueda por Texto
- Busca usuarios por email o nombre
- Búsqueda en tiempo real mientras escribes
- No distingue entre mayúsculas y minúsculas

#### Filtro por Rol
Filtra usuarios por su rol:
- **Todos los roles**: Muestra todos los usuarios
- **Super Admin**: Administradores del sistema
- **Admin**: Administradores de equipos
- **Coach**: Entrenadores
- **Player**: Jugadores

### 3. Gestión de Roles

#### Cambiar Rol de Usuario
- Haz clic en el badge del rol actual del usuario
- Selecciona el nuevo rol del menú desplegable
- Los cambios se aplican inmediatamente
- Se muestra una confirmación visual

#### Roles Disponibles
- **Super Admin**: Acceso completo al sistema
- **Admin**: Gestión de equipos y usuarios
- **Coach**: Gestión de jugadores, entrenamientos y partidos
- **Player**: Acceso básico como jugador

### 4. Gestión de Equipos

#### Ver Equipos Asignados
1. Haz clic en el botón "Equipos" junto al usuario
2. Se abre un diálogo mostrando:
   - Equipos actuales del usuario
   - Rol en cada equipo (Admin o Coach)
   - Club al que pertenece cada equipo

#### Asignar Nuevo Equipo
1. En el diálogo de equipos, ve a la sección "Asignar Nuevo Equipo"
2. Selecciona un equipo y rol del menú desplegable
3. El formato es: `[Nombre del Equipo] ([Club]) - [Rol]`
4. El equipo se asigna inmediatamente

#### Cambiar Rol en Equipo
1. En la lista de equipos asignados
2. Usa el selector de rol junto a cada equipo
3. Cambia entre "Admin" y "Coach"
4. El cambio se aplica inmediatamente

#### Remover Equipo
1. En la lista de equipos asignados
2. Haz clic en el botón "Remover" junto al equipo
3. El usuario pierde acceso a ese equipo inmediatamente

### 5. Recuperación de Contraseña

#### Enviar Link de Reset
1. Haz clic en el botón "Reset" junto al usuario
2. Se envía un email automático al usuario con un link para cambiar su contraseña
3. El link redirige a: `http://localhost:5173/reset-password`
4. Se muestra una confirmación cuando el email se envía

**Nota**: Esta funcionalidad usa el sistema de autenticación de Supabase.

## Estructura de Datos

### Tabla: profiles
```sql
- id: uuid (referencia a auth.users)
- email: text
- display_name: text
- role: app_role (enum)
- created_at: timestamptz
```

### Tabla: user_team_roles
```sql
- user_id: uuid (referencia a auth.users)
- team_id: bigint (referencia a teams)
- role: app_role (solo 'admin' o 'coach')
- created_at: timestamptz
```

## Permisos y Seguridad

### Row Level Security (RLS)

Todas las operaciones están protegidas por políticas RLS:

1. **Lectura de Perfiles**: Solo super_admin puede ver todos los perfiles
2. **Actualización de Roles**: Solo super_admin puede cambiar roles
3. **Gestión de Equipos**: Solo super_admin puede asignar/remover equipos
4. **Reset de Contraseña**: Usa el sistema de autenticación de Supabase

### Funciones Helper

- `is_superadmin()`: Verifica si el usuario actual es super admin
- `is_coach_of_team(team_id)`: Verifica si el usuario es coach de un equipo

## Mensajes y Notificaciones

La página muestra mensajes de éxito o error para todas las operaciones:

### Mensajes de Éxito (Verde)
- "Rol actualizado correctamente"
- "Email de recuperación enviado a [email]"
- "Equipo asignado correctamente"
- "Equipo removido correctamente"

### Mensajes de Error (Rojo)
- "Error al cargar usuarios"
- "Error al actualizar el rol"
- "Error al enviar email de recuperación"
- "Error al asignar equipo"
- "Error al remover equipo"

## Casos de Uso Comunes

### 1. Promover un Usuario a Coach
1. Busca el usuario por email
2. Cambia su rol a "Coach"
3. Haz clic en "Equipos"
4. Asigna el equipo correspondiente con rol "Coach"

### 2. Crear un Administrador de Equipo
1. Busca el usuario
2. Cambia su rol a "Admin"
3. Asigna los equipos que debe administrar con rol "Admin"

### 3. Usuario Olvidó su Contraseña
1. Busca el usuario por email
2. Haz clic en "Reset"
3. El usuario recibirá un email con instrucciones

### 4. Transferir Equipo a Otro Coach
1. Busca el coach actual
2. Haz clic en "Equipos"
3. Remueve el equipo
4. Busca el nuevo coach
5. Asigna el equipo al nuevo coach

## Integración con Supabase Auth

La página utiliza las siguientes funcionalidades de Supabase:

### Gestión de Usuarios
```typescript
supabase.from('profiles').select('*')
supabase.from('profiles').update({ role: newRole })
```

### Reset de Contraseña
```typescript
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})
```

### Gestión de Equipos
```typescript
supabase.from('user_team_roles').insert(...)
supabase.from('user_team_roles').delete()
```

## Consideraciones Técnicas

### Performance
- La página carga todos los usuarios al inicio
- Los filtros se aplican en el cliente (no requieren consultas adicionales)
- Las operaciones de actualización son individuales y optimistas

### Estado de Carga
- Spinner durante la carga inicial
- Botones deshabilitados durante operaciones
- Mensajes de confirmación inmediatos

### Validaciones
- No se puede enviar reset a usuarios sin email
- Solo se pueden asignar roles "Admin" o "Coach" a equipos
- No se pueden asignar equipos duplicados

## Próximas Mejoras Sugeridas

1. **Paginación**: Para sistemas con muchos usuarios
2. **Exportar Datos**: Descargar lista de usuarios en CSV/Excel
3. **Historial de Cambios**: Auditoría de cambios de roles
4. **Búsqueda Avanzada**: Filtros por fecha, múltiples criterios
5. **Acciones en Lote**: Cambiar roles o asignar equipos a múltiples usuarios
6. **Desactivar Usuarios**: Soft delete en lugar de eliminar
7. **Estadísticas**: Dashboard con métricas de usuarios
