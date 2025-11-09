# Gestión de Contraseñas - Flujo de Invitación de Jugadores

## Resumen

Este documento explica cuándo y cómo los jugadores pueden establecer y cambiar sus contraseñas en el sistema.

## Flujo de Invitación de Jugadores

### 1. Creación de la Invitación (Admin)

El administrador invita a un jugador desde `/admin/invite-player`:

1. Selecciona un jugador del roster (que no tenga cuenta)
2. Ingresa el email del jugador
3. El sistema genera un link de invitación único
4. El admin comparte este link con el jugador (WhatsApp, email, etc.)

### 2. Primera Configuración de Contraseña (Jugador)

Cuando el jugador hace clic en el link de invitación:

1. **Es redirigido a `/set-password`** (página dedicada)
2. El sistema verifica automáticamente el token de invitación
3. El jugador ve su email y solo necesita:
   - Ingresar una nueva contraseña (mínimo 6 caracteres)
   - Confirmar la contraseña
4. Al establecer la contraseña:
   - La cuenta se activa automáticamente
   - El trigger de base de datos vincula al usuario con su perfil de jugador
   - Es redirigido al dashboard
   - Ya puede iniciar sesión normalmente

**Nota importante:** Esta es la ÚNICA vez que el jugador usa el link de invitación. El link expira después de usarse.

### 3. Cambio de Contraseña (Después del Registro)

Una vez que el jugador ha establecido su contraseña inicial, puede cambiarla en cualquier momento:

1. **Inicia sesión** con su email y contraseña
2. **Navega a `/profile`** (desde el menú lateral → "Profile")
3. En la sección "Cambiar Contraseña":
   - Ingresa su contraseña actual
   - Ingresa la nueva contraseña
   - Confirma la nueva contraseña
4. El sistema valida la contraseña actual antes de permitir el cambio
5. La contraseña se actualiza inmediatamente

## Páginas Involucradas

### `/admin/invite-player`
- **Rol requerido:** Admin o Super Admin
- **Función:** Crear invitaciones para jugadores
- **Genera:** Link de invitación con token de recuperación
- **Redirección configurada:** `${origin}/set-password`

### `/set-password`
- **Acceso:** Público (requiere token válido en URL)
- **Función:** Primera configuración de contraseña
- **Características:**
  - Verifica token de invitación automáticamente
  - Muestra el email del usuario
  - Valida que las contraseñas coincidan
  - Redirige al dashboard después del éxito
  - Maneja tokens inválidos o expirados

### `/profile`
- **Acceso:** Usuarios autenticados (todos los roles)
- **Función:** Gestión de perfil y cambio de contraseña
- **Características:**
  - Muestra información completa del usuario
  - Permite cambiar contraseña en cualquier momento
  - Valida contraseña actual antes de cambiar
  - Feedback inmediato de éxito/error

## Seguridad

### Validaciones en `/set-password`
- ✅ Token de recuperación válido y no expirado
- ✅ Contraseña mínimo 6 caracteres
- ✅ Contraseñas deben coincidir
- ✅ Token se invalida después de usarse

### Validaciones en `/profile` (cambio de contraseña)
- ✅ Usuario debe estar autenticado
- ✅ Debe proporcionar contraseña actual correcta
- ✅ Nueva contraseña mínimo 6 caracteres
- ✅ Contraseñas nuevas deben coincidir
- ✅ No se puede usar la misma contraseña (validación de Supabase)

## Casos de Uso Comunes

### Caso 1: Jugador Nuevo
```
Admin → Invita jugador → Genera link
Jugador → Clic en link → /set-password → Establece contraseña
Jugador → Redirigido a /dashboard → Puede usar la app
```

### Caso 2: Jugador Olvidó su Contraseña
```
Jugador → /login → "Olvidé mi contraseña"
Sistema → Envía email de recuperación
Jugador → Clic en link → /set-password → Establece nueva contraseña
```

### Caso 3: Jugador Quiere Cambiar Contraseña
```
Jugador → Inicia sesión → /profile
Jugador → Sección "Cambiar Contraseña"
Jugador → Ingresa contraseña actual + nueva contraseña
Sistema → Valida y actualiza
```

### Caso 4: Link de Invitación Expirado
```
Jugador → Clic en link expirado → /set-password
Sistema → Muestra error "Link inválido o expirado"
Jugador → Botón "Ir a Inicio de Sesión"
Solución → Admin debe generar nueva invitación
```

## Diferencias con Signup Regular

### Signup Regular (`/signup`)
- Usuario crea cuenta desde cero
- Debe proporcionar email Y contraseña
- No está vinculado a ningún jugador automáticamente
- Rol por defecto: 'user'

### Invitación de Jugador (`/set-password`)
- Usuario ya fue pre-creado por admin
- Email ya está en el sistema
- Solo establece contraseña
- Automáticamente vinculado a perfil de jugador
- Rol: 'player'
- Asignado automáticamente a su equipo

## Troubleshooting

### "Link de invitación inválido o expirado"
**Causa:** Token expirado, ya usado, o malformado
**Solución:** Admin debe crear nueva invitación

### "La contraseña actual es incorrecta"
**Causa:** Usuario ingresó mal su contraseña actual en /profile
**Solución:** Verificar contraseña o usar recuperación de contraseña

### "Las contraseñas no coinciden"
**Causa:** Error al confirmar contraseña
**Solución:** Verificar que ambos campos sean idénticos

### "La contraseña debe tener al menos 6 caracteres"
**Causa:** Contraseña muy corta
**Solución:** Usar contraseña más larga y segura

## Mejoras Futuras

- [ ] Agregar requisitos de complejidad de contraseña (mayúsculas, números, símbolos)
- [ ] Implementar historial de contraseñas (no permitir reutilizar últimas N contraseñas)
- [ ] Agregar autenticación de dos factores (2FA)
- [ ] Implementar expiración de contraseñas (cambio obligatorio cada X días)
- [ ] Agregar indicador de fortaleza de contraseña en tiempo real
- [ ] Implementar recuperación de contraseña desde /login
- [ ] Notificaciones por email cuando se cambia la contraseña

## Referencias

- Página de invitación: `src/pages/admin/InvitePlayerPage.tsx`
- Página de establecer contraseña: `src/pages/SetPassword.tsx`
- Página de perfil: `src/pages/Profile.tsx`
- Servicio de invitaciones: `src/services/invites.ts`
- Edge Function: `supabase/functions/invite-user/index.ts`
