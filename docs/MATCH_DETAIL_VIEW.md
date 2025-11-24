# Vista de Detalle de Partido

## Descripción
Se ha implementado una nueva funcionalidad en la pantalla de partidos que permite ver información detallada de cada partido, incluyendo las estadísticas de cuartos jugados por cada jugador.

## Funcionalidad

### Botón de Detalle
- Se agregó un nuevo botón con ícono de documento (FileText) en la lista de partidos
- Al hacer clic, se abre un diálogo modal con la información detallada del partido

### Información Mostrada

#### 1. Información General del Partido
- Fecha del partido
- Oponente
- Lugar (si está disponible)
- Notas (si están disponibles)

#### 2. Estadísticas de Cuartos Jugados
Tabla que muestra para cada jugador convocado:
- Nombre del jugador
- Total de cuartos jugados (número con decimales):
  - Cuarto completo = 1.0
  - Medio cuarto = 0.5
  - Ejemplo: 3.5 significa 3 cuartos completos y 1 medio cuarto
- Indicadores visuales para cada cuarto (Q1, Q2, Q3, Q4):
  - ✓ (check verde) + "Completo" = jugó el cuarto completo (FULL)
  - ⊙ (círculo con punto amarillo) + "Medio" = jugó medio cuarto (HALF)
  - ○ (círculo gris) = no jugó ese cuarto

Se incluye una leyenda en la parte superior derecha para facilitar la interpretación.

### Ordenamiento
Los jugadores se muestran ordenados por cantidad de cuartos jugados (de mayor a menor).

## Archivos Modificados

### Nuevos Archivos
- `src/pages/coach/components/MatchDetailDialog.tsx`: Componente del diálogo de detalle

### Archivos Modificados
- `src/pages/coach/MatchesPage.tsx`: 
  - Agregado botón de detalle
  - Agregado estado y handlers para el diálogo
  - Importado nuevo componente MatchDetailDialog

- `src/services/matches.ts`:
  - Agregado tipo `MatchPlayerPeriod` para tipar los períodos jugados

## Datos Utilizados

El componente obtiene datos de:
1. `listPlayers(teamId)`: Lista de jugadores del equipo
2. `listMatchCallUpsWithPeriods(matchId)`: Jugadores convocados con total de cuartos jugados
3. `listMatchPeriods(matchId)`: Detalle de qué cuartos específicos jugó cada jugador

## Uso

1. Navegar a la página de Partidos
2. Seleccionar un equipo
3. En la lista de partidos, hacer clic en el botón de detalle (ícono de documento)
4. Se abrirá el diálogo con toda la información del partido y estadísticas de jugadores

## Notas Técnicas

- El componente usa React hooks (useState, useEffect) para manejar el estado
- Los datos se cargan de forma asíncrona cuando se abre el diálogo
- Se muestran indicadores de carga mientras se obtienen los datos
- Si no hay jugadores convocados, se muestra un mensaje apropiado
