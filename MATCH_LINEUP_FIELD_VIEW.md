# Vista de Cancha para Alineaciones de Partidos

## Descripción

Se ha implementado una nueva vista visual de cancha con funcionalidad de drag and drop para gestionar las alineaciones de los partidos. Esta vista complementa la vista de tabla existente, permitiendo a los entrenadores elegir entre dos modos de gestión.

## Características Principales

### 1. Dos Modos de Vista

- **Vista de Tabla**: La vista original con tabla de minutos por cuarto (Q1-Q4)
- **Vista de Cancha**: Nueva vista visual con cancha de fútbol y drag and drop

### 2. Vista de Cancha

#### Componentes Visuales

- **Cancha de Fútbol**: Representación visual de una cancha con líneas y áreas
- **Selector de Período**: Botones Q1, Q2, Q3, Q4 para cambiar entre cuartos
- **Jugadores Disponibles**: Panel lateral con jugadores sin asignar
- **Campo**: Área donde se colocan los jugadores titulares (máximo 7)
- **Banco**: Área para jugadores suplentes

#### Funcionalidad Drag and Drop

1. **Arrastrar al Campo**:
   - Arrastra jugadores desde "Disponibles" o "Banco" al campo
   - Límite de 7 jugadores en el campo
   - Los jugadores en el campo se marcan como FULL para el período seleccionado
   - Posicionamiento libre en cualquier parte de la cancha

2. **Arrastrar al Banco**:
   - Arrastra jugadores desde el campo o "Disponibles" al banco
   - Los jugadores en el banco se marcan como HALF para el período seleccionado
   - Sin límite de jugadores en el banco

3. **Cambio de Período**:
   - Al cambiar de Q1 a Q2, Q3 o Q4, la vista se actualiza automáticamente
   - Muestra los jugadores asignados para ese período específico
   - Cada período mantiene su propia configuración

#### Validaciones

- **Límite de Campo**: Solo 7 jugadores permitidos en el campo simultáneamente
- **Notificaciones**: Toast de error si se intenta exceder el límite
- **Persistencia**: Los cambios se guardan automáticamente en la base de datos

### 3. Cambio entre Vistas

- Botones en la parte superior derecha del diálogo
- **Tabla**: Icono de tabla para cambiar a vista de tabla
- **Cancha**: Icono de mapa para cambiar a vista de cancha
- El cambio es instantáneo y mantiene los datos sincronizados

## Estructura de Archivos

### Nuevos Archivos

```
src/pages/coach/components/
├── MatchFieldLineup.tsx          # Nuevo componente de vista de cancha
└── MatchLineupPanel.tsx          # Modificado para soportar ambas vistas
```

### Componentes

#### MatchFieldLineup.tsx

Componente principal de la vista de cancha con:
- Estado de jugadores por período
- Lógica de drag and drop
- Renderizado de cancha visual
- Gestión de posiciones de jugadores

#### MatchLineupPanel.tsx

Componente contenedor que:
- Gestiona el estado de vista (tabla/cancha)
- Renderiza la vista de tabla (original)
- Delega a MatchFieldLineup para vista de cancha

## Uso

1. Navegar a la página de Partidos
2. Hacer clic en el icono de "Usuarios" en un partido
3. Se abre el diálogo de alineación en vista de tabla por defecto
4. Hacer clic en el botón "Cancha" para cambiar a vista de cancha
5. Seleccionar el período (Q1, Q2, Q3, Q4)
6. Arrastrar jugadores:
   - Al campo: para marcarlos como FULL
   - Al banco: para marcarlos como HALF
7. Los cambios se guardan automáticamente

## Diseño Visual

### Cancha

- Fondo verde degradado simulando césped
- Líneas blancas para delimitar áreas
- Círculo central
- Áreas de portería superior e inferior

### Jugadores

- **En Campo**: Círculos azules con número de camiseta o iniciales
  - Nombre completo debajo
  - Posicionamiento libre con drag and drop
  
- **En Banco**: Etiquetas naranjas con número y nombre
  - Disposición horizontal

- **Disponibles**: Tarjetas blancas con borde
  - Número de camiseta y nombre completo

## Formación por Defecto

Cuando se arrastran jugadores al campo por primera vez, se posicionan automáticamente en una formación 3-2-1:

1. Portero (centro, atrás)
2. Defensa izquierda
3. Defensa central
4. Defensa derecha
5. Medio izquierdo
6. Medio derecho
7. Delantero (centro, adelante)

Los jugadores pueden reposicionarse libremente después.

## Integración con Base de Datos

- Utiliza las mismas tablas y servicios que la vista de tabla
- `match_player_periods`: Almacena período y fracción (FULL/HALF)
- Sincronización automática entre ambas vistas
- Sin cambios en el esquema de base de datos

## Tecnologías Utilizadas

- React con TypeScript
- Drag and Drop nativo de HTML5
- Tailwind CSS para estilos
- Lucide React para iconos
- Shadcn/ui para componentes base

## Mejoras Futuras Posibles

- Guardar posiciones de jugadores en el campo
- Formaciones predefinidas (4-3, 3-3, etc.)
- Visualización de estadísticas por posición
- Exportar alineación como imagen
- Historial de alineaciones
