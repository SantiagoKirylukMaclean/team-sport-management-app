# Guía de Resultados por Cuarto

## Descripción General

El sistema de resultados por cuarto permite registrar el marcador y los goles (con goleadores y asistidores) para cada uno de los 4 cuartos de un partido de baloncesto.

## Características

### 1. Resultados por Cuarto
- Registrar goles del equipo y del oponente para cada cuarto
- Ver el marcador total del partido (suma de todos los cuartos)
- Resumen visual de todos los cuartos

### 2. Registro de Goles
- Registrar cada gol individual con su goleador
- Opcionalmente agregar el asistidor del gol
- Solo se pueden seleccionar jugadores convocados para el partido
- Ver lista de todos los goles registrados por cuarto

### 3. Interfaz Intuitiva
- Selector de cuarto para navegar entre Q1, Q2, Q3 y Q4
- Marcador final visible en todo momento
- Resumen visual de resultados por cuarto

## Cómo Usar

### Acceder a Resultados
1. Ve a la página de **Partidos**
2. Encuentra el partido deseado en la lista
3. Haz clic en el botón con el ícono de **diana** (🎯) en la columna de acciones
4. Se abrirá el diálogo de "Resultados por Cuarto"

### Registrar Resultado de un Cuarto
1. Selecciona el cuarto (Q1, Q2, Q3 o Q4) en el selector
2. Ingresa los goles de tu equipo
3. Ingresa los goles del oponente
4. Haz clic en "Guardar Resultado del Cuarto"

### Registrar Goles Individuales
1. Asegúrate de tener jugadores convocados para el partido
2. Selecciona el cuarto donde ocurrió el gol
3. En la sección "Goles de tu equipo":
   - Selecciona el **Goleador** (obligatorio)
   - Opcionalmente selecciona el **Asistidor**
   - Haz clic en "Agregar Gol"
4. El gol aparecerá en la lista de goles registrados

### Eliminar un Gol
1. En la lista de goles registrados
2. Haz clic en el ícono de papelera (🗑️) junto al gol que deseas eliminar
3. El gol será eliminado inmediatamente

## Estructura de Datos

### Tablas de Base de Datos

#### `match_quarter_results`
Almacena el resultado (marcador) de cada cuarto:
- `match_id`: ID del partido
- `quarter`: Número del cuarto (1-4)
- `team_goals`: Goles del equipo
- `opponent_goals`: Goles del oponente

#### `match_goals`
Almacena cada gol individual con su goleador y asistidor:
- `match_id`: ID del partido
- `quarter`: Número del cuarto (1-4)
- `scorer_id`: ID del jugador que anotó
- `assister_id`: ID del jugador que asistió (opcional)

## Validaciones

- Los goles deben ser números positivos (≥ 0)
- Solo se pueden seleccionar jugadores convocados para el partido
- El goleador es obligatorio, el asistidor es opcional
- El asistidor no puede ser el mismo que el goleador

## Permisos

- **Super Admin**: Acceso completo a todos los resultados
- **Coach/Admin**: Solo puede gestionar resultados de partidos de sus equipos
- Los jugadores deben pertenecer al mismo equipo del partido

## Flujo Recomendado

1. **Crear el partido** con fecha, oponente y ubicación
2. **Convocar jugadores** para el partido
3. **Registrar minutos jugados** por cuarto (opcional pero recomendado)
4. **Registrar resultados por cuarto**:
   - Ingresar marcador de cada cuarto
   - Registrar goles individuales con goleadores y asistidores
5. **Ver detalle del partido** para revisar estadísticas completas

## Notas Importantes

- Los resultados se pueden editar en cualquier momento
- El marcador final se calcula automáticamente sumando todos los cuartos
- Los goles individuales son independientes del marcador del cuarto (puedes tener más o menos goles registrados que el marcador)
- Se recomienda registrar los resultados después de cada cuarto para mayor precisión

## Ejemplo de Uso

**Partido**: Tu Equipo vs Oponente

**Cuarto 1**:
- Marcador: 15-12
- Goles:
  - Juan Pérez (asistencia: Carlos López)
  - María García
  - Juan Pérez (asistencia: Ana Martínez)

**Cuarto 2**:
- Marcador: 18-15
- Goles:
  - Carlos López
  - Ana Martínez (asistencia: Juan Pérez)
  - María García (asistencia: Carlos López)

**Resultado Final**: 33-27 (suma automática de todos los cuartos)
