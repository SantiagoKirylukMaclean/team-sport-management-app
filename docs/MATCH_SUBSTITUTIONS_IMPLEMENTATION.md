# Sistema de Cambios en Partidos - Implementación

## Resumen

Se ha implementado un sistema completo de cambios/sustituciones para los partidos, permitiendo gestionar la participación de jugadores por cuarto con las siguientes reglas:

### Reglas de Participación

1. **7 Titulares en Cancha** → FULL (1.0 cuarto completo)
2. **Jugadores en Banco** → Sin registro (0.0, no juegan)
3. **Cambio Registrado** → HALF para ambos jugadores (0.5 cada uno)

## Componentes Implementados

### 1. Base de Datos (`supabase/migrations/20251028000000_match_substitutions.sql`)

#### Tabla `match_substitutions`
- Registra todos los cambios realizados en cada período
- Campos: `match_id`, `period`, `player_out`, `player_in`
- Constraint único para evitar cambios duplicados

#### Funciones SQL

**`apply_match_substitution()`**
- Registra un cambio entre dos jugadores
- Valida que ambos estén convocados
- Actualiza automáticamente los períodos a HALF para ambos

**`remove_match_substitution()`**
- Elimina un cambio registrado
- Restaura FULL para el jugador que salió
- Elimina el registro del jugador que entró

### 2. Servicio (`src/services/matches.ts`)

Nuevas funciones exportadas:

```typescript
// Listar cambios de un partido (opcionalmente filtrado por período)
listMatchSubstitutions(matchId: number, period?: number)

// Aplicar un cambio
applyMatchSubstitution(matchId, period, playerOut, playerIn)

// Remover un cambio
removeMatchSubstitution(matchId, period, playerOut, playerIn)
```

### 3. UI - Vista de Cancha (`src/pages/coach/components/MatchFieldLineup.tsx`)

#### Nuevas Características

**Modo Cambio**
- Botón "Hacer Cambio" para activar el modo de sustitución
- Se desactiva el drag & drop mientras está activo
- Permite seleccionar jugadores con clicks

**Flujo de Cambio**
1. Activar "Modo Cambio"
2. Click en un jugador del campo
3. Click en un jugador del banco
4. El sistema valida y aplica el cambio automáticamente

**Indicadores Visuales**
- **Jugador seleccionado**: Amarillo con ring
- **Jugador con cambio (campo)**: Naranja + etiqueta "(HALF)"
- **Jugador con cambio (banco)**: Verde + etiqueta "(HALF)"
- **Titulares normales**: Azul
- **Banco normal**: Gris

**Lista de Cambios**
- Panel que muestra todos los cambios del cuarto actual
- Formato: "↓ Jugador Sale ⇄ ↑ Jugador Entra"
- Botón X para eliminar cada cambio

## Validaciones

1. **Mínimo 7 convocados**: No se pueden hacer cambios sin convocatoria completa
2. **7 en campo**: Debe haber 7 titulares antes de hacer cambios
3. **Campo ↔ Banco**: Solo se permite cambio entre un jugador del campo y uno del banco
4. **Sin duplicados**: No se puede registrar el mismo cambio dos veces

## Flujo de Uso

### Escenario Típico

1. **Convocar jugadores** (mínimo 7)
2. **Asignar 7 titulares** arrastrándolos a la cancha
3. **Colocar suplentes** en el banco
4. **Hacer cambios**:
   - Click en "Hacer Cambio"
   - Seleccionar titular que sale
   - Seleccionar suplente que entra
   - Ambos quedan con HALF automáticamente

### Ejemplo Práctico

**Q1**: 
- 7 titulares en campo → FULL (1.0)
- 3 en banco → 0.0

**Q2**: 
- Cambio: #5 sale, #8 entra
- #5 y #8 → HALF (0.5)
- Otros 6 titulares → FULL (1.0)

**Total después de Q2**:
- #5: 1.5 cuartos (Q1 FULL + Q2 HALF)
- #8: 0.5 cuartos (Q2 HALF)
- Otros 6: 2.0 cuartos (Q1 FULL + Q2 FULL)

## Beneficios

1. **Gestión precisa** de minutos por jugador
2. **Visualización clara** de cambios en cada cuarto
3. **Validación automática** de reglas
4. **Historial completo** de sustituciones
5. **Fácil corrección** de errores (eliminar cambios)

## Próximos Pasos Sugeridos

- [ ] Agregar límite de cambios por cuarto (si aplica)
- [ ] Reportes de participación por jugador
- [ ] Estadísticas de uso de banco
- [ ] Exportar alineaciones a PDF
