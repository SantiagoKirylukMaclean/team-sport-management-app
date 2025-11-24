# ✅ Sistema de Convocatorias - Deployment Exitoso

## Migración Aplicada

```bash
✓ supabase db push
✓ Applying migration 20251026000000_match_call_ups.sql...
✓ Finished supabase db push.
```

## Estructura Creada en Base de Datos

### Tabla: `match_call_ups`
- `match_id` (FK → matches.id)
- `player_id` (FK → players.id)
- `created_at`
- PK compuesta (match_id, player_id)
- RLS habilitado con 2 policies

### Vista: `match_call_ups_with_periods`
- Muestra convocados con conteo de períodos jugados
- Join entre match_call_ups y match_player_periods

### Función: `validate_match_minimum_periods(p_match_id)`
- Retorna jugadores convocados con < 2 cuartos
- Usada para validación en tiempo real

## Código TypeScript

### Servicios (0 errores)
✅ `src/services/matches.ts`
- 6 nuevas funciones para gestionar convocatorias
- Tipos: MatchCallUp, CallUpWithPeriods, ValidationResult

### Componentes (0 errores)
✅ `src/pages/coach/components/MatchCallUpDialog.tsx`
✅ `src/pages/coach/components/MatchLineupPanel.tsx`
✅ `src/pages/coach/MatchesPage.tsx`
✅ `src/components/ui/alert.tsx`
✅ `src/components/ui/checkbox.tsx`

## Funcionalidad Implementada

1. **Botón "Convocar"** en lista de partidos
   - Abre dialog con checkboxes de jugadores
   - Guarda convocatorias en batch

2. **Panel de Minutos actualizado**
   - Muestra SOLO jugadores convocados
   - Validación automática de regla "mínimo 2 cuartos"
   - Alerta roja con lista de jugadores que no cumplen
   - Filas resaltadas en rojo para errores

3. **Validación en Tiempo Real**
   - Se ejecuta después de cada cambio de período
   - Feedback visual inmediato
   - No bloquea guardado (solo advierte)

## Flujo de Usuario

```
1. Coach crea partido
   ↓
2. Coach hace clic en "Convocar" (icono UserCheck)
   ↓
3. Selecciona jugadores con checkboxes (mínimo 7)
   ↓
4. Guarda convocatorias
   ↓
5. Coach hace clic en "Minutos" (icono Users)
   ↓
6. Si tiene < 7 convocados:
   ❌ Alerta roja visible
   ❌ Selectores deshabilitados
   ❌ Botón "Cancha" deshabilitado
   ❌ Debe volver a convocar más jugadores
   ↓
7. Si tiene 7+ convocados:
   ✅ Ve SOLO jugadores convocados
   ✅ Puede asignar períodos FULL/HALF
   ✅ Puede cambiar a vista cancha
   ↓
8. Asigna períodos en tabla o posiciones en cancha
   ↓
9. Si algún convocado tiene < 2 cuartos → Alerta roja
   ↓
10. Corrige asignaciones hasta que todos cumplan
```

## Reglas de Negocio Implementadas

### 1. Mínimo 7 Jugadores Convocados
**"Debes convocar al menos 7 jugadores antes de asignar minutos"**

- ✅ Validación en ambas vistas (tabla y cancha)
- ✅ Selectores y drag & drop deshabilitados si < 7
- ✅ Alerta roja con contador de convocados
- ✅ Botón "Cancha" deshabilitado hasta cumplir mínimo

### 2. Mínimo 2 Cuartos por Convocado
**"Todos los jugadores convocados DEBEN jugar mínimo 2 cuartos"**

- ✅ Validación automática después de cada cambio
- ✅ Feedback visual claro (filas rojas)
- ✅ No permite confusión entre "no convocado" y "convocado sin minutos"

## Próximos Pasos

El sistema está listo para usar. Sugerencias opcionales:

1. **Testing**: Agregar tests de integración
2. **Exportar**: Función para exportar lista de convocados
3. **Notificaciones**: Avisar a jugadores convocados
4. **Estadísticas**: Dashboard de convocatorias por jugador

## Verificación

Para verificar en producción:
1. Ir a `/coach/matches`
2. Crear un partido de prueba
3. Hacer clic en "Convocar" → seleccionar jugadores
4. Hacer clic en "Minutos" → verificar que solo aparecen convocados
5. Asignar 1 cuarto a un jugador → debe aparecer alerta roja
6. Asignar 2+ cuartos → alerta debe desaparecer

---

**Estado**: ✅ Producción Ready
**Fecha**: 26 de Octubre, 2025
**Migración**: 20251026000000_match_call_ups.sql
