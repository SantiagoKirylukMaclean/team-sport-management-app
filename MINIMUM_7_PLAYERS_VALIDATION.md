# Validación de Mínimo 7 Jugadores Convocados

## Implementación

Se ha agregado una validación que requiere **mínimo 7 jugadores convocados** antes de permitir cualquier cambio en las vistas de tabla o cancha.

## Cambios Realizados

### MatchLineupPanel (Vista Tabla)

**Validaciones agregadas:**
1. **Alerta visual** cuando hay menos de 7 convocados
2. **Selectores deshabilitados** (disabled) para asignar períodos
3. **Botón "Cancha" deshabilitado** hasta tener 7+ convocados
4. **Toast de error** si intenta hacer cambios sin cumplir el mínimo

**Código:**
```typescript
// Estado para contar convocados
const [calledUpCount, setCalledUpCount] = useState(0)

// Validación en handlePeriodChange
if (calledUpCount < 7) {
  toast({
    variant: 'destructive',
    title: 'Convocatoria incompleta',
    description: 'Debes convocar al menos 7 jugadores antes de asignar minutos.'
  })
  return
}

// Selectores deshabilitados
<Select disabled={calledUpCount < 7}>

// Botón Cancha deshabilitado
<Button disabled={calledUpCount < 7}>
```

### MatchFieldLineup (Vista Cancha)

**Validaciones agregadas:**
1. **Alerta visual** cuando hay menos de 7 convocados
2. **Drag & drop deshabilitado** para todos los jugadores
3. **Toast de error** al intentar arrastrar jugadores
4. **Mensaje informativo** en lista de disponibles
5. **Opacidad reducida** en elementos no interactivos

**Código:**
```typescript
// Validación en handleFieldDrop
if (calledUpCount < 7) {
  toast({
    variant: 'destructive',
    title: 'Convocatoria incompleta',
    description: 'Debes convocar al menos 7 jugadores antes de asignar posiciones.'
  })
  return
}

// Drag deshabilitado
<div draggable={calledUpCount >= 7}>

// Estilos condicionales
className={`${calledUpCount >= 7 ? 'cursor-move' : 'cursor-not-allowed opacity-50'}`}
```

## Flujo de Usuario

### Antes (Sin validación)
1. Coach crea partido
2. Coach puede asignar minutos sin convocar a nadie
3. Confusión sobre quién está convocado

### Ahora (Con validación)
1. Coach crea partido
2. Coach hace clic en "Convocar"
3. **Debe seleccionar mínimo 7 jugadores**
4. Guarda convocatorias
5. Ahora puede hacer clic en "Minutos"
6. **Si tiene < 7 convocados:**
   - ❌ Alerta roja visible
   - ❌ Selectores deshabilitados
   - ❌ Botón "Cancha" deshabilitado
   - ❌ Drag & drop no funciona
7. **Si tiene 7+ convocados:**
   - ✅ Puede asignar períodos en tabla
   - ✅ Puede cambiar a vista cancha
   - ✅ Puede arrastrar jugadores
   - ✅ Validación de mínimo 2 cuartos activa

## Mensajes de Usuario

### Alerta en Panel (Tabla y Cancha)
```
⚠️ Convocatoria incompleta

Debes convocar al menos 7 jugadores para poder asignar minutos.
Actualmente tienes X jugador(es) convocado(s).
```

### Toast al Intentar Cambios
```
❌ Convocatoria incompleta

Debes convocar al menos 7 jugadores antes de asignar minutos.
```

## Reglas de Negocio

### Convocatorias
- **Mínimo**: 7 jugadores
- **Máximo**: Sin límite (todos los del equipo)
- **Validación**: Antes de cualquier asignación de minutos

### Asignación de Minutos
- **Requisito previo**: 7+ jugadores convocados
- **Vista Tabla**: Selectores deshabilitados si < 7
- **Vista Cancha**: Drag & drop deshabilitado si < 7
- **Validación adicional**: Mínimo 2 cuartos por convocado

### Vista de Cancha
- **Máximo en campo**: 7 jugadores (FULL)
- **Banco**: Ilimitado (HALF)
- **Disponibles**: Convocados sin asignar

## Feedback Visual

### Elementos Deshabilitados
- **Opacidad**: 50%
- **Cursor**: `cursor-not-allowed`
- **Interacción**: Bloqueada

### Elementos Habilitados
- **Opacidad**: 100%
- **Cursor**: `cursor-move` o `cursor-pointer`
- **Interacción**: Completa

### Alertas
- **Color**: Rojo (destructive)
- **Icono**: AlertTriangle
- **Posición**: Parte superior del panel
- **Persistencia**: Hasta cumplir requisito

## Archivos Modificados

1. **src/pages/coach/components/MatchLineupPanel.tsx**
   - Agregado estado `calledUpCount`
   - Validación en `handlePeriodChange`
   - Alerta condicional
   - Selectores con `disabled`
   - Botón Cancha con `disabled`

2. **src/pages/coach/components/MatchFieldLineup.tsx**
   - Agregado estado `calledUpCount`
   - Carga de convocatorias con `listMatchCallUps`
   - Filtrado de solo jugadores convocados
   - Validación en `handleFieldDrop` y `handleBenchDrop`
   - Alerta condicional
   - Drag & drop condicional
   - Estilos condicionales

## Testing Manual

### Caso 1: Sin convocados
1. Crear partido
2. Hacer clic en "Minutos"
3. **Resultado**: Alerta roja, selectores deshabilitados, botón Cancha deshabilitado

### Caso 2: Con 3 convocados
1. Convocar 3 jugadores
2. Hacer clic en "Minutos"
3. **Resultado**: Alerta "tienes 3 jugador(es)", todo deshabilitado

### Caso 3: Con 7 convocados
1. Convocar 7 jugadores
2. Hacer clic en "Minutos"
3. **Resultado**: Sin alerta, selectores habilitados, botón Cancha habilitado
4. Cambiar a vista Cancha
5. **Resultado**: Drag & drop funciona, puede asignar posiciones

### Caso 4: Con 10 convocados
1. Convocar 10 jugadores
2. Hacer clic en "Minutos"
3. **Resultado**: Todo habilitado, puede asignar a todos

## Beneficios

1. **Claridad**: Coach sabe exactamente cuántos jugadores necesita convocar
2. **Prevención de errores**: No puede asignar minutos sin convocatoria completa
3. **Feedback inmediato**: Alertas y contadores visibles
4. **Consistencia**: Misma validación en ambas vistas
5. **UX mejorada**: Elementos deshabilitados claramente identificables

## Próximos Pasos Opcionales

1. **Configuración**: Permitir cambiar el mínimo de 7 a otro número
2. **Sugerencias**: Botón "Convocar automáticamente 7 jugadores"
3. **Estadísticas**: Mostrar promedio de convocados por partido
4. **Notificaciones**: Avisar cuando se alcanza el mínimo
