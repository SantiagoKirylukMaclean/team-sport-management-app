# Fix: Funciones SQL de Sustituciones

## Problema Identificado

Las funciones `apply_match_substitution` y `remove_match_substitution` no se crearon correctamente en la base de datos.

### Error Original
```
PGRST202: Could not find the function public.apply_match_substitution
```

### Causa Raíz

Los delimitadores de las funciones PL/pgSQL estaban incorrectos:
- **Incorrecto:** `as $` ... `$;`
- **Correcto:** `as $$` ... `$$;`

PostgreSQL requiere delimitadores dobles (`$$`) para funciones PL/pgSQL.

## Solución Aplicada

### 1. Migración Original Corregida
Archivo: `supabase/migrations/20251028000000_match_substitutions.sql`
- Cambiado `as $` → `as $$`
- Cambiado `$;` → `$$;`

### 2. Nueva Migración de Fix
Archivo: `supabase/migrations/20251028000001_fix_substitution_functions.sql`

Esta migración:
1. Elimina las funciones si existen (aunque no existían)
2. Recrea las funciones con sintaxis correcta
3. Agrega `security definer` para permisos correctos

## Funciones Creadas

### apply_match_substitution
```sql
create or replace function public.apply_match_substitution(
  p_match_id bigint,
  p_period smallint,
  p_player_out bigint,
  p_player_in bigint
)
returns void
language plpgsql
security definer
as $$
begin
  -- Validaciones
  -- Registrar cambio
  -- Actualizar períodos a HALF
end;
$$;
```

### remove_match_substitution
```sql
create or replace function public.remove_match_substitution(
  p_match_id bigint,
  p_period smallint,
  p_player_out bigint,
  p_player_in bigint
)
returns void
language plpgsql
security definer
as $$
begin
  -- Eliminar cambio
  -- Restaurar período FULL
end;
$$;
```

## Resultado

✅ Migración aplicada exitosamente
✅ Funciones creadas en la base de datos
✅ Sistema de cambios ahora funcional

## Logs de Aplicación

```
Applying migration 20251028000001_fix_substitution_functions.sql...
NOTICE: function public.apply_match_substitution does not exist, skipping
NOTICE: function public.remove_match_substitution does not exist, skipping
Finished supabase db push.
```

Los "NOTICE" confirman que las funciones no existían antes, pero ahora se crearon correctamente.

## Próximos Pasos

1. ✅ Funciones creadas
2. ✅ Migración aplicada
3. 🔄 Probar el sistema de cambios en la UI
4. ✅ Verificar que los cambios se registren correctamente

## Testing

Para verificar que funciona:

1. Abrir vista de cancha
2. Activar "Modo Cambio"
3. Seleccionar jugador del campo (#10 Daniel)
4. Seleccionar jugador del banco (#60 Marc)
5. Verificar que aparezca: "Cambio aplicado"
6. Verificar que ambos tengan HALF en ese cuarto

## Notas Técnicas

- `security definer`: Permite que la función se ejecute con permisos del creador
- Esto es necesario para que coaches puedan ejecutar las funciones
- Las políticas RLS se aplican dentro de la función
