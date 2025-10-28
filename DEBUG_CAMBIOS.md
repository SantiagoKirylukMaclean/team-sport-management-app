# Debug: Problema con Clicks en Jugadores del Banco

## Cambios Aplicados

### 1. Corregida lógica de asignación de jugadores
**Problema anterior:** Los jugadores con HALF siempre iban al banco, sin considerar si eran el que entra o sale
**Solución:** Ahora se cargan los cambios y se determina correctamente:
- Jugador con FULL + no está en cambio → Campo
- Jugador con HALF + es el que entra → Campo  
- Jugador con HALF + es el que sale → Banco
- Jugador sin registro → Banco (suplente)

### 2. Agregado `stopPropagation` en eventos click
- Los clicks ahora no se propagan al contenedor padre
- Tanto jugadores del campo como del banco tienen este fix

### 3. Console.log para debugging
Ahora verás en la consola del navegador:

**Al hacer click en botón "Hacer Cambio":**
```
Toggle modo cambio. Actual: false Nuevo: true
Jugadores en campo: 7 Convocados: 8
```

**Al hacer click en un jugador:**
```
Click en jugador: 123 Modo cambio: true
Seleccionando primer jugador: 123
```

### 3. Indicadores visuales mejorados
- El área del banco cambia a fondo amarillo cuando modo cambio está activo
- El título dice "Banco (Click para cambio)" en modo cambio

## Cómo Verificar

### Paso 1: Abrir Consola del Navegador
1. Presiona F12 o Cmd+Option+I (Mac)
2. Ve a la pestaña "Console"

### Paso 2: Activar Modo Cambio
1. Click en botón "Hacer Cambio"
2. Verifica en consola que aparezca: `Toggle modo cambio. Actual: false Nuevo: true`
3. El botón debe cambiar a "Cancelar Cambio"
4. El área del banco debe tener fondo amarillo

### Paso 3: Intentar Click en Jugador del Banco
1. Click en cualquier jugador del banco (ej: #60 Marc o #43 Jack)
2. Verifica en consola que aparezca: `Click en jugador: [ID] Modo cambio: true`

### Paso 4: Verificar Selección
- El jugador debe cambiar a color amarillo con ring
- Debe aparecer mensaje en consola: `Seleccionando primer jugador: [ID]`

## Posibles Problemas y Soluciones

### Problema 1: No aparece nada en consola al hacer click
**Causa:** El evento click no se está disparando
**Solución:** 
- Verifica que el modo cambio esté activo (botón debe decir "Cancelar Cambio")
- Intenta hacer click directamente en el texto del jugador, no en el espacio vacío

### Problema 2: Aparece "Modo cambio no está activo"
**Causa:** El estado `substitutionMode` no se está actualizando
**Solución:**
- Verifica que el botón "Hacer Cambio" no esté deshabilitado (gris)
- Debe haber 7 jugadores en campo y 7 convocados mínimo

### Problema 3: El botón está deshabilitado
**Causa:** No hay suficientes jugadores
**Solución:**
- Verifica que tengas al menos 7 jugadores convocados
- Verifica que tengas exactamente 7 jugadores en el campo
- Mira el contador: "Cancha (7/7 jugadores)"

### Problema 4: Los jugadores del banco no son clickeables
**Causa:** Posible conflicto con drag & drop
**Solución:**
- En modo cambio, el drag & drop se desactiva automáticamente
- Verifica que `draggable={calledUpCount >= 7 && !substitutionMode}` sea false

## Información de Debug

### Estado Esperado en Modo Cambio

```javascript
substitutionMode: true
selectedPlayerForSub: null (o ID del jugador seleccionado)
fieldPlayers.size: 7
benchPlayers.size: 2 (o más)
calledUpCount: 8 (o más)
```

### Eventos que Deben Dispararse

1. **Click en botón "Hacer Cambio"**
   - `setSubstitutionMode(true)`
   - `setSelectedPlayerForSub(null)`

2. **Click en jugador del banco**
   - `handlePlayerClickForSubstitution(playerId)`
   - `setSelectedPlayerForSub(playerId)`

3. **Click en jugador del campo**
   - `handlePlayerClickForSubstitution(playerId)`
   - Validación y aplicación del cambio

## Próximos Pasos

Si después de estos cambios aún no funciona:

1. **Compartir logs de consola**: Copia y pega lo que aparece en la consola
2. **Verificar estado**: Toma screenshot del estado cuando haces click
3. **Probar en otro navegador**: A veces hay problemas específicos del navegador

## Código Relevante

### Click Handler en Jugadores del Banco

```tsx
onClick={(e) => {
  e.stopPropagation()
  if (substitutionMode) {
    handlePlayerClickForSubstitution(playerId)
  }
}}
```

### Función de Manejo de Click

```tsx
const handlePlayerClickForSubstitution = async (playerId: number) => {
  console.log('Click en jugador:', playerId, 'Modo cambio:', substitutionMode)
  
  if (!substitutionMode) {
    console.log('Modo cambio no está activo')
    return
  }

  // Si no hay jugador seleccionado, seleccionar este
  if (!selectedPlayerForSub) {
    console.log('Seleccionando primer jugador:', playerId)
    setSelectedPlayerForSub(playerId)
    return
  }
  // ... resto del código
}
```
