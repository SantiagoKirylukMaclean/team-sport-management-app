# Guía de Uso: Sistema de Cambios en Partidos

## Vista Rápida

El sistema permite gestionar la participación de jugadores por cuarto con tres estados:

| Estado | Ubicación | Participación | Color Visual |
|--------|-----------|---------------|--------------|
| **FULL** | En cancha (7 jugadores) | 1.0 cuarto completo | 🔵 Azul |
| **HALF** | Cambio registrado | 0.5 medio cuarto | 🟠 Naranja (campo) / 🟢 Verde (banco) |
| **Sin registro** | En banco | 0.0 no juega | ⚪ Gris |

## Cómo Usar

### 1. Preparación Inicial

**Antes de asignar posiciones:**
- ✅ Convocar mínimo 7 jugadores
- ✅ Ir a "Minutos por Cuarto" → Vista de Cancha

### 2. Asignar Titulares (Q1)

**Arrastrar y soltar:**
1. Seleccionar jugador de "Disponibles"
2. Arrastrarlo a la cancha
3. Repetir hasta tener 7 jugadores
4. Los demás quedan en "Banco"

**Resultado:**
- 7 en cancha → FULL (1.0)
- Resto en banco → 0.0

```
Cancha (7/7):  #5, #8, #10, #12, #15, #20, #23  → FULL
Banco:         #3, #7, #18                       → 0.0
```

### 3. Hacer un Cambio (Q2)

**Activar modo cambio:**
1. Click en botón "Hacer Cambio" 🔄
2. Click en jugador del campo (ej: #5)
   - Se marca en amarillo 🟡
3. Click en jugador del banco (ej: #3)
   - Se aplica el cambio automáticamente

**Resultado:**
- #5 y #3 → HALF (0.5 cada uno)
- Aparece en lista: "↓ #5 ⇄ ↑ #3"

```
Q2 después del cambio:
Cancha:  #3, #8, #10, #12, #15, #20, #23
         ↑ HALF (cambió)
         
Banco:   #5, #7, #18
         ↑ HALF (cambió)
```

### 4. Múltiples Cambios

Puedes hacer varios cambios en el mismo cuarto:

```
Q3:
Cambio 1: #8 sale → #7 entra  (ambos HALF)
Cambio 2: #10 sale → #18 entra (ambos HALF)

Resultado:
- #8, #10, #7, #18 → HALF (0.5)
- #3, #12, #15, #20, #23 → FULL (1.0)
```

### 5. Corregir Errores

**Eliminar un cambio:**
1. Ver lista de cambios en el cuarto
2. Click en ❌ junto al cambio
3. Se restaura el estado anterior

## Ejemplos Prácticos

### Ejemplo 1: Rotación Simple

**Objetivo:** Dar minutos a todos los jugadores

```
Q1: 7 titulares → FULL
Q2: Cambio 1 → 2 jugadores HALF
Q3: Cambio 2 → otros 2 jugadores HALF
Q4: Cambio 3 → últimos 2 jugadores HALF

Total: Todos juegan al menos 2 cuartos ✅
```

### Ejemplo 2: Gestión de Lesión

**Situación:** Jugador #5 se lesiona en Q2

```
Q1: #5 en cancha → FULL
Q2: #5 sale, #3 entra → ambos HALF
Q3: #3 sigue → FULL (sin cambio)
Q4: #3 sigue → FULL (sin cambio)

Total #5: 1.5 cuartos (Q1 FULL + Q2 HALF)
Total #3: 2.5 cuartos (Q2 HALF + Q3 FULL + Q4 FULL)
```

### Ejemplo 3: Estrategia Defensiva

**Situación:** Cambiar a jugador defensivo en Q4

```
Q1-Q3: #10 (ofensivo) → FULL en todos
Q4: #10 sale, #60 (defensivo) entra → ambos HALF

Total #10: 3.5 cuartos
Total #60: 0.5 cuartos
```

## Validaciones Automáticas

El sistema previene errores:

| Error | Mensaje |
|-------|---------|
| Menos de 7 convocados | "Debes convocar al menos 7 jugadores" |
| Más de 7 en cancha | "Solo puedes tener 7 jugadores en el campo" |
| Cambio entre dos del campo | "Debes seleccionar un jugador del campo y uno del banco" |
| Cambio entre dos del banco | "Debes seleccionar un jugador del campo y uno del banco" |

## Indicadores Visuales

### En la Cancha

- 🔵 **Azul**: Titular normal (FULL)
- 🟠 **Naranja**: Involucrado en cambio (HALF)
- 🟡 **Amarillo con ring**: Seleccionado para cambio

### En el Banco

- ⚪ **Gris**: Suplente normal (sin minutos)
- 🟢 **Verde**: Involucrado en cambio (HALF)
- 🟡 **Amarillo con ring**: Seleccionado para cambio

### Etiquetas

- **(HALF)**: Jugador con cambio registrado
- **Q1, Q2, Q3, Q4**: Botones de período activo

## Tips y Mejores Prácticas

1. **Planifica antes**: Decide la rotación antes del partido
2. **Usa Q1 para titulares**: Asigna los 7 titulares en Q1
3. **Cambios graduales**: No hagas todos los cambios en un solo cuarto
4. **Verifica totales**: Asegúrate que todos tengan mínimo 2 cuartos
5. **Guarda frecuentemente**: Los cambios se guardan automáticamente

## Atajos de Teclado

- **Drag & Drop**: Mover jugadores entre áreas
- **Click**: Seleccionar para cambio (en modo cambio)
- **Botón Q1-Q4**: Cambiar de período rápidamente

## Solución de Problemas

### "No puedo hacer cambios"
- ✅ Verifica que tengas 7 convocados
- ✅ Verifica que tengas 7 en cancha
- ✅ Activa el "Modo Cambio"

### "El cambio no se aplicó"
- ✅ Selecciona uno del campo y uno del banco
- ✅ No selecciones el mismo jugador dos veces

### "Quiero deshacer un cambio"
- ✅ Click en ❌ en la lista de cambios
- ✅ El jugador que salió vuelve a FULL
- ✅ El que entró se elimina del período

## Próximos Pasos

Después de configurar los cambios:
1. Revisa la vista de "Tabla" para ver totales
2. Verifica que no haya alertas rojas
3. Cierra el panel cuando termines
4. Los cambios quedan guardados automáticamente
