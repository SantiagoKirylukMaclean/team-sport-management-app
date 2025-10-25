# ✅ Validación de Mínimo 7 Jugadores - Implementado

## Cambio Solicitado

> "Quiero que en la versión tabla o cancha no pueda hacer cambios ni arreglos hasta que no tenga al menos 7 jugadores convocados."

## ✅ Implementado

### Vista Tabla (MatchLineupPanel)
- ❌ **Selectores deshabilitados** si < 7 convocados
- ❌ **Botón "Cancha" deshabilitado** si < 7 convocados
- ⚠️ **Alerta roja** mostrando cuántos faltan
- 🚫 **Toast de error** al intentar cambios

### Vista Cancha (MatchFieldLineup)
- ❌ **Drag & drop deshabilitado** si < 7 convocados
- ❌ **Jugadores no arrastrables** (opacidad 50%)
- ⚠️ **Alerta roja** mostrando cuántos faltan
- 🚫 **Toast de error** al intentar arrastrar

## Comportamiento

### Con < 7 convocados:
```
Panel de Minutos:
├─ ⚠️ Alerta: "Debes convocar al menos 7 jugadores"
├─ ❌ Selectores Q1-Q4: disabled
├─ ❌ Botón "Cancha": disabled
└─ 💬 Contador: "Actualmente tienes X jugador(es)"

Vista Cancha:
├─ ⚠️ Alerta: "Debes convocar al menos 7 jugadores"
├─ ❌ Drag & drop: bloqueado
├─ 👻 Jugadores: opacity 50%, cursor-not-allowed
└─ 💬 Mensaje: "Convoca al menos 7 jugadores para comenzar"
```

### Con 7+ convocados:
```
✅ Todo habilitado
✅ Puede asignar minutos
✅ Puede cambiar a vista cancha
✅ Puede arrastrar jugadores
✅ Validación de mínimo 2 cuartos activa
```

## Archivos Modificados

1. ✅ `src/pages/coach/components/MatchLineupPanel.tsx`
2. ✅ `src/pages/coach/components/MatchFieldLineup.tsx`

## Diagnósticos

```bash
✓ 0 errores en MatchLineupPanel.tsx
✓ 0 errores en MatchFieldLineup.tsx
```

## Testing

### Caso 1: 0 convocados
- Abrir "Minutos" → Alerta roja + todo deshabilitado ✅

### Caso 2: 5 convocados
- Abrir "Minutos" → Alerta "tienes 5 jugador(es)" + todo deshabilitado ✅

### Caso 3: 7 convocados
- Abrir "Minutos" → Sin alerta + todo habilitado ✅
- Cambiar a "Cancha" → Drag & drop funciona ✅

### Caso 4: 10 convocados
- Todo funciona normalmente ✅

## Resultado

✅ **Implementación completa**
- No se pueden hacer cambios con < 7 convocados
- Feedback visual claro en ambas vistas
- Mensajes informativos para el usuario
- Elementos deshabilitados claramente identificables
