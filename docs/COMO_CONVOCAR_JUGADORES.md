# 📋 Cómo Convocar Jugadores - Guía Visual

## Ubicación del Botón "Convocar"

El botón **Convocar** está en la **lista de partidos**, NO dentro del panel de minutos.

## Paso a Paso

### 1. Ve a la página de Partidos
```
Menú lateral → Partidos
URL: /coach/matches
```

### 2. Busca la tabla de partidos
```
┌─────────────────────────────────────────────────────────────────┐
│ Fecha      │ Oponente  │ Lugar    │ Notas  │ Acciones          │
├─────────────────────────────────────────────────────────────────┤
│ 2025-10-26 │ Rival FC  │ Estadio  │ Final  │ [👤✓] [👥] [✏️] [🗑️] │
│                                              ↑                   │
│                                         ESTE BOTÓN               │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Haz clic en el botón 👤✓ (Convocar)
- **Icono**: UserCheck (persona con check)
- **Posición**: Primer botón en la columna "Acciones"
- **Tooltip**: "Convocar"

### 4. Se abre el diálogo de convocatorias
```
┌──────────────────────────────────────┐
│ Convocar Jugadores                   │
├──────────────────────────────────────┤
│ Selecciona los jugadores convocados. │
│ Todos deben jugar mínimo 2 cuartos.  │
│                                      │
│ ☐ Marc (#60)                         │
│ ☐ Biel (#23)                         │
│ ☐ Nicolai (#16)                      │
│ ☐ Llens (#21)                        │
│ ☐ Alex (#5)                          │
│ ☐ Unai (#8)                          │
│ ☐ Daniel (#10)                       │
│ ☐ Ibai (#1)                          │
│ ☐ Jack (#43)                         │
│ ☐ Alexis (#68)                       │
│                                      │
│ 0 jugador(es) seleccionado(s)        │
│                                      │
│         [Cancelar]  [Guardar]        │
└──────────────────────────────────────┘
```

### 5. Selecciona mínimo 7 jugadores
- Haz clic en los checkboxes
- El contador se actualiza automáticamente
- **Mínimo requerido: 7 jugadores**

### 6. Haz clic en "Guardar"
- Las convocatorias se guardan
- El diálogo se cierra

### 7. Ahora puedes hacer clic en 👥 (Minutos)
- Se abre el panel de minutos
- Verás SOLO los jugadores convocados
- Podrás asignar períodos FULL/HALF

## Orden de Botones en la Tabla

```
Columna "Acciones" (de izquierda a derecha):

1. 👤✓ Convocar    → Seleccionar jugadores convocados
2. 👥 Minutos      → Asignar períodos FULL/HALF
3. ✏️ Editar       → Modificar datos del partido
4. 🗑️ Eliminar     → Borrar el partido
```

## Flujo Completo

```
1. Página Partidos
   ↓
2. Clic en 👤✓ Convocar
   ↓
3. Seleccionar 7+ jugadores
   ↓
4. Guardar
   ↓
5. Clic en 👥 Minutos
   ↓
6. Asignar períodos
```

## Si No Ves el Botón

### Verifica que:
1. ✅ Estás en la página `/coach/matches`
2. ✅ Hay al menos un partido creado
3. ✅ La tabla de partidos es visible
4. ✅ Tienes permisos de coach/admin

### Si el botón no aparece:
1. Refresca la página (F5)
2. Verifica que el código esté actualizado
3. Revisa la consola del navegador por errores

## Mensaje en Panel de Minutos

Si abres el panel de minutos sin convocar jugadores, verás:

```
┌────────────────────────────────────────────────┐
│ Minutos por Cuarto              [Tabla] Cancha │
├────────────────────────────────────────────────┤
│                                                │
│  ⚠️ Convocatoria incompleta                    │
│  Debes convocar al menos 7 jugadores para      │
│  poder asignar minutos. Actualmente tienes     │
│  0 jugador(es) convocado(s).                   │
│                                                │
│  No hay jugadores convocados.                  │
│                                                │
│  Cierra este panel y usa el botón 👤✓ Convocar │
│  en la lista de partidos para seleccionar      │
│  jugadores.                                    │
│                                                │
│           [Volver a Partidos]                  │
│                                                │
│                                    [Cerrar]    │
└────────────────────────────────────────────────┘
```

## Resumen Visual

```
PÁGINA DE PARTIDOS
┌─────────────────────────────────────────────┐
│ Partidos                    [Nuevo Partido] │
│                                             │
│ Equipo: [S9A ▼]                             │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Fecha │ Oponente │ Lugar │ Acciones     │ │
│ ├─────────────────────────────────────────┤ │
│ │ ...   │ ...      │ ...   │ [👤✓][👥][✏️][🗑️] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 👤✓ = Convocar (EMPIEZA AQUÍ)               │
│ 👥 = Minutos (después de convocar)          │
└─────────────────────────────────────────────┘
```

## Atajos de Teclado (Futuro)

Sugerencias para implementar:
- `C` → Abrir convocatorias
- `M` → Abrir minutos
- `E` → Editar partido
- `Esc` → Cerrar diálogos
