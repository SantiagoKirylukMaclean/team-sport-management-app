# Debug: Segundo Click No Funciona

## Problema Reportado

Al hacer click en el primer jugador (ej: #10 Daniel del campo), se selecciona correctamente (amarillo).
Pero al hacer click en el segundo jugador (ej: #60 Marc del banco), no pasa nada.

## Logs Agregados

Ahora hay logs muy detallados en cada paso:

### 1. Al hacer click en cualquier jugador

```
🖱️ onClick disparado en [campo/banco], jugador: [ID]
Modo cambio: true/false
Llamando a handlePlayerClickForSubstitution
```

### 2. Dentro de handlePlayerClickForSubstitution

```
=== CLICK EN JUGADOR ===
Player ID: [ID]
Modo cambio: true/false
Jugador ya seleccionado: [ID o null]
Campo: [array de IDs]
Banco: [array de IDs]
```

### 3. Al seleccionar primer jugador

```
✅ Seleccionando primer jugador: [ID]
🎯 Estado selectedPlayerForSub cambió a: [ID]
```

### 4. Al seleccionar segundo jugador

```
🔍 Validando cambio...
Jugador 1 (seleccionado): [ID] en campo? true/false
Jugador 2 (nuevo click): [ID] en campo? true/false
✅ Cambio válido!
Sale del campo: [ID]
Entra al campo: [ID]
📡 Aplicando cambio en servidor...
```

## Cómo Debuggear

### Paso 1: Abrir Consola
1. F12 o Cmd+Option+I
2. Pestaña "Console"
3. Limpiar consola (icono 🚫)

### Paso 2: Activar Modo Cambio
1. Click en "Hacer Cambio"
2. Verificar en consola:
```
Toggle modo cambio. Actual: false Nuevo: true
```

### Paso 3: Click en Primer Jugador (Campo)
1. Click en #10 Daniel
2. Verificar en consola:
```
🖱️ onClick disparado en campo, jugador: [ID de Daniel]
Modo cambio: true
Llamando a handlePlayerClickForSubstitution
=== CLICK EN JUGADOR ===
Player ID: [ID]
...
✅ Seleccionando primer jugador: [ID]
🎯 Estado selectedPlayerForSub cambió a: [ID]
```

### Paso 4: Click en Segundo Jugador (Banco)
1. Click en #60 Marc
2. **IMPORTANTE**: Copiar TODO lo que aparece en consola
3. Buscar específicamente:

**¿Aparece esto?**
```
🖱️ onClick disparado en banco, jugador: [ID de Marc]
```

**Si NO aparece:** El evento click no se está disparando
**Si SÍ aparece:** Continuar verificando

**¿Aparece esto?**
```
=== CLICK EN JUGADOR ===
```

**Si NO aparece:** La función no se está llamando
**Si SÍ aparece:** Continuar verificando

**¿Qué dice "Jugador ya seleccionado"?**
```
Jugador ya seleccionado: [ID de Daniel]
```

**Si es null:** El estado se perdió
**Si tiene ID:** Continuar verificando

## Posibles Problemas y Causas

### Problema 1: No aparece "🖱️ onClick disparado"
**Causa:** El evento click no se está registrando
**Posibles razones:**
- Otro elemento está encima bloqueando el click
- El elemento no es clickeable (CSS pointer-events)
- El navegador está bloqueando el evento

**Solución:**
- Inspeccionar elemento (click derecho → Inspeccionar)
- Verificar que no tenga `pointer-events: none`
- Verificar z-index

### Problema 2: Aparece onClick pero no "=== CLICK EN JUGADOR ==="
**Causa:** La función no se está llamando
**Posibles razones:**
- Error en JavaScript antes de llegar a la función
- Modo cambio no está activo

**Solución:**
- Verificar que `substitutionMode` sea `true`
- Buscar errores en consola (texto rojo)

### Problema 3: "Jugador ya seleccionado: null"
**Causa:** El estado se perdió entre clicks
**Posibles razones:**
- Re-render inesperado
- Estado no se guardó correctamente

**Solución:**
- Verificar si hay logs de "🎯 Estado selectedPlayerForSub cambió a: null"
- Buscar qué causó el cambio a null

### Problema 4: "Cambio inválido: ambos en campo/banco"
**Causa:** La validación está fallando
**Posibles razones:**
- Los estados de campo/banco no están actualizados
- El jugador no está donde debería

**Solución:**
- Verificar los arrays de "Campo:" y "Banco:"
- Confirmar que un jugador está en campo y otro en banco

## Información a Compartir

Si el problema persiste, compartir:

1. **Todos los logs de consola** desde que activas modo cambio hasta que haces el segundo click

2. **Screenshot del estado** mostrando:
   - Jugadores en campo
   - Jugadores en banco
   - Cuál está seleccionado (amarillo)

3. **Responder estas preguntas:**
   - ¿Aparece "🖱️ onClick disparado" al hacer click en el segundo jugador?
   - ¿Qué dice "Jugador ya seleccionado" en el segundo click?
   - ¿Hay algún mensaje de error (rojo) en consola?
   - ¿El jugador del banco cambia de color al hacer hover?

## Workaround Temporal

Si no funciona con clicks, puedes:

1. Usar la vista de "Tabla" en lugar de "Cancha"
2. Asignar HALF manualmente a ambos jugadores
3. Esto no registra el cambio pero da los minutos correctos

## Próximos Pasos

Basado en los logs, podré:
- Identificar exactamente dónde falla
- Aplicar el fix específico
- Verificar que funcione correctamente
