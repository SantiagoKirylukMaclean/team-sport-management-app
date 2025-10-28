# Sistema de Cambios - Implementación Completa ✅

## Estado Final

✅ **COMPLETAMENTE FUNCIONAL**

## Problema y Solución

### Problema Original
La primera migración (`20251028000000_match_substitutions.sql`) tenía delimitadores incorrectos en las funciones PL/pgSQL, lo que causó que:
- La tabla `match_substitutions` no se creara
- Las funciones no se crearan
- Error: "relation public.match_substitutions does not exist"

### Solución Aplicada
Se crearon 3 migraciones en total:

1. **20251028000000_match_substitutions.sql** (corregida)
   - Delimitadores corregidos: `$$` en lugar de `$`
   
2. **20251028000001_fix_substitution_functions.sql**
   - Intento de recrear solo las funciones
   - No funcionó porque la tabla no existía

3. **20251028000002_ensure_substitutions.sql** ✅
   - Crea tabla si no existe
   - Crea índices
   - Habilita RLS
   - Crea policies
   - Crea funciones con `security definer`
   - Otorga permisos a `authenticated`

## Componentes Implementados

### Base de Datos

#### Tabla: match_substitutions
```sql
- id (bigserial)
- match_id (bigint) → matches(id)
- period (smallint) 1-4
- player_out (bigint) → players(id)
- player_in (bigint) → players(id)
- created_at (timestamptz)
- UNIQUE(match_id, period, player_out, player_in)
```

#### Funciones

**apply_match_substitution(match_id, period, player_out, player_in)**
- Valida período (1-4)
- Valida que ambos jugadores estén convocados
- Registra el cambio en `match_substitutions`
- Actualiza ambos jugadores a HALF en `match_player_periods`

**remove_match_substitution(match_id, period, player_out, player_in)**
- Elimina el registro del cambio
- Restaura FULL para el jugador que salió
- Elimina período del jugador que entró

#### Políticas RLS
- `msub superadmin all`: Super admin acceso total
- `msub coach crud`: Coach puede CRUD si es coach del equipo

### Frontend

#### MatchFieldLineup.tsx
- Modo cambio con botón toggle
- Click para seleccionar jugadores
- Validación: uno del campo, uno del banco
- Indicadores visuales por color
- Lista de cambios del cuarto
- Logs detallados para debugging

#### Colores
- 🔵 Azul: Titular (FULL)
- 🟠 Naranja: En campo con cambio (HALF)
- 🟢 Verde: En banco con cambio (HALF)
- ⚪ Gris: Suplente sin minutos
- 🟡 Amarillo: Seleccionado para cambio

### Backend

#### matches.ts
```typescript
listMatchSubstitutions(matchId, period?)
applyMatchSubstitution(matchId, period, playerOut, playerIn)
removeMatchSubstitution(matchId, period, playerOut, playerIn)
```

## Flujo Completo

### 1. Usuario Activa Modo Cambio
```
Click "Hacer Cambio"
→ substitutionMode = true
→ Área del banco cambia a fondo amarillo
```

### 2. Usuario Selecciona Primer Jugador
```
Click en #10 Daniel (campo)
→ selectedPlayerForSub = 10
→ Jugador se pone amarillo
→ Log: "✅ Seleccionando primer jugador: 10"
```

### 3. Usuario Selecciona Segundo Jugador
```
Click en #60 Marc (banco)
→ Validación: uno en campo, otro en banco ✅
→ playerOut = 10, playerIn = 60
→ Log: "✅ Cambio válido!"
```

### 4. Sistema Aplica Cambio
```
POST /rest/v1/rpc/apply_match_substitution
{
  p_match_id: 123,
  p_period: 1,
  p_player_out: 10,
  p_player_in: 60
}

→ Función SQL ejecuta:
  1. Valida convocatorias
  2. INSERT en match_substitutions
  3. DELETE períodos existentes
  4. INSERT HALF para ambos

→ Response: success
→ Toast: "Cambio aplicado"
```

### 5. UI Se Actualiza
```
loadData() + loadSubstitutions()
→ #10 aparece en banco (verde, HALF)
→ #60 aparece en campo (naranja, HALF)
→ Lista muestra: "↓ #10 Daniel ⇄ ↑ #60 Marc"
```

## Logs de Consola

### Flujo Exitoso
```
Toggle modo cambio. Actual: false Nuevo: true
🖱️ onClick disparado en campo, jugador: 10
=== CLICK EN JUGADOR ===
✅ Seleccionando primer jugador: 10
🎯 Estado selectedPlayerForSub cambió a: 10

🖱️ onClick disparado en banco, jugador: 60
=== CLICK EN JUGADOR ===
🔍 Validando cambio...
✅ Cambio válido!
Sale del campo: 10
Entra al campo: 60
📡 Aplicando cambio en servidor...
✅ Cambio aplicado exitosamente
🔄 Recargando datos...
✅ Datos recargados
```

## Verificación

### Comprobar que Funciona

1. **Abrir vista de cancha**
   - Debe haber 7 jugadores en campo
   - Debe haber jugadores en banco

2. **Activar modo cambio**
   - Click "Hacer Cambio"
   - Área del banco debe tener fondo amarillo
   - Título debe decir "Banco (Click para cambio)"

3. **Hacer cambio**
   - Click en jugador del campo → se pone amarillo
   - Click en jugador del banco → se aplica cambio
   - Toast: "Cambio aplicado"

4. **Verificar resultado**
   - Jugador que salió: en banco, verde, "(HALF)"
   - Jugador que entró: en campo, naranja, "(HALF)"
   - Lista muestra el cambio con botón X

5. **Eliminar cambio (opcional)**
   - Click en X del cambio
   - Jugador que salió vuelve a campo (azul, FULL)
   - Jugador que entró desaparece del período

## Migraciones Aplicadas

```
✅ 20251028000000_match_substitutions.sql (corregida)
✅ 20251028000001_fix_substitution_functions.sql
✅ 20251028000002_ensure_substitutions.sql (definitiva)
```

## Permisos

- `security definer`: Funciones se ejecutan con permisos del creador
- `grant execute to authenticated`: Usuarios autenticados pueden ejecutar
- RLS policies: Solo coaches del equipo pueden hacer cambios

## Notas Importantes

1. **No usar Docker**: Conectado directamente a Supabase remoto
2. **Delimitadores SQL**: Siempre usar `$$` para funciones PL/pgSQL
3. **Logs detallados**: Mantener para debugging futuro
4. **Reset de estado**: Al cambiar de período, se resetea selección

## Archivos Clave

- `supabase/migrations/20251028000002_ensure_substitutions.sql`
- `src/pages/coach/components/MatchFieldLineup.tsx`
- `src/services/matches.ts`

## Estado: LISTO PARA PRODUCCIÓN ✅
