# Sistema de Evaluaciones de Jugadores

## Descripción General

Sistema completo de evaluación de jugadores basado en los baremos de fútbol infantil (9 años). Permite a los entrenadores evaluar a sus jugadores en múltiples categorías y a los jugadores ver su progreso a lo largo del tiempo.

## Características Implementadas

### 1. Base de Datos

**Tablas creadas:**
- `evaluation_categories`: Categorías principales de evaluación (7 categorías)
- `evaluation_criteria`: Criterios específicos dentro de cada categoría (33 criterios totales)
- `player_evaluations`: Evaluaciones realizadas por los entrenadores
- `evaluation_scores`: Puntuaciones individuales para cada criterio

**Categorías de Evaluación:**
1. **Coordinación Motriz** (4 criterios)
   - Coordinación general
   - Coordinación óculo-pie
   - Ritmo
   - Balance

2. **Velocidad y Agilidad** (4 criterios)
   - Velocidad de reacción
   - Aceleración
   - Agilidad
   - Velocidad gestual

3. **Técnica con Balón** (5 criterios)
   - Control
   - Conducción
   - Pase
   - Regate
   - Tiro

4. **Toma de Decisiones** (5 criterios)
   - Lectura de espacios
   - Escaneo previo
   - Timing de pase
   - Superioridades
   - Movilidad tras pase

5. **Actitud y Concentración** (5 criterios)
   - Atención continua
   - Respeto y escucha
   - Resiliencia
   - Autonomía
   - Intensidad emocional

6. **Condición Física** (4 criterios)
   - Resistencia
   - Saltabilidad
   - Movilidad articular
   - Core y equilibrio

7. **Habilidades Socioemocionales** (4 criterios)
   - Trabajo en equipo
   - Liderazgo positivo
   - Gestión de frustración
   - Juego limpio

**Políticas de Seguridad (RLS):**
- Entrenadores (usuarios con rol 'coach' o 'admin' en `user_team_roles`) pueden crear, ver, editar y eliminar evaluaciones de jugadores de sus equipos
- Jugadores pueden ver solo sus propias evaluaciones (vinculadas por `players.user_id`)
- Las categorías y criterios son públicos (lectura para todos)
- Se usan referencias a `auth.users` para los coaches
- Los `player_id` son de tipo `BIGINT` (no UUID)

### 2. Servicios (API)

**Archivo:** `src/services/evaluations.ts`

**Funciones disponibles:**
- `getEvaluationStructure()`: Obtiene todas las categorías con sus criterios
- `getPlayerEvaluations(playerId)`: Obtiene todas las evaluaciones de un jugador
- `createEvaluation(playerId, date, notes)`: Crea una nueva evaluación
- `updateEvaluation(evaluationId, date, notes)`: Actualiza una evaluación
- `deleteEvaluation(evaluationId)`: Elimina una evaluación
- `saveEvaluationScores(evaluationId, scores)`: Guarda las puntuaciones
- `getEvaluationById(evaluationId)`: Obtiene una evaluación específica

### 3. Interfaz para Entrenadores

**Página:** `/coach/evaluations`
**Componente:** `src/pages/coach/PlayerEvaluationsPage.tsx`

**Funcionalidades:**
- Selección de jugador del equipo
- Creación de nuevas evaluaciones con fecha personalizable
- Puntuación de cada criterio (0-10)
- Notas adicionales por evaluación
- Visualización del historial de evaluaciones
- Eliminación de evaluaciones
- Código de colores para puntuaciones:
  - Verde: 80-100%
  - Azul: 60-79%
  - Amarillo: 40-59%
  - Rojo: 0-39%

### 4. Interfaz para Jugadores

**Página:** `/evaluaciones`
**Componente:** `src/pages/MyEvaluations.tsx`

**Funcionalidades:**
- Vista de la última evaluación con gráfico radar
- Barras de progreso por categoría
- Comparación con evaluación anterior (progreso/retroceso)
- Gráfico de línea temporal mostrando evolución
- Historial detallado de todas las evaluaciones
- Visualización de notas del entrenador
- Indicadores visuales de tendencia (↑ ↓ →)

**Gráficos incluidos:**
- Radar Chart: Vista general de la última evaluación
- Line Chart: Evolución temporal de las categorías
- Progress Bars: Comparación entre evaluaciones

### 5. Navegación

**Para Entrenadores:**
- Nuevo link en CoachLayout: "Evaluaciones"
- Accesible desde `/coach/evaluations`

**Para Jugadores:**
- Nuevo link en Sidebar: "Mis Evaluaciones"
- Accesible desde `/evaluaciones`

### 6. Traducciones

Agregadas en `src/i18n/locales/`:
- `nav.evaluations`: "Evaluaciones" (ES) / "Evaluations" (EN)

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install recharts
```

### 2. Ejecutar Migración

✅ **Ya aplicada exitosamente**

La migración se aplicó con:
```bash
cd supabase
npx supabase db push
```

Si necesitas reaplicarla en local:
```bash
npx supabase db reset
```

### 3. Verificar Configuración

La migración `20251112000001_player_evaluations.sql` debe ejecutarse correctamente.

## Uso

### Como Entrenador

1. Ir a `/coach/evaluations`
2. Seleccionar un jugador del dropdown
3. Hacer clic en "New Evaluation"
4. Ingresar la fecha de evaluación
5. Puntuar cada criterio (0-10)
6. Agregar notas opcionales
7. Guardar la evaluación

### Como Jugador

1. Ir a `/evaluaciones` desde el menú lateral
2. Ver la última evaluación con gráfico radar
3. Revisar el progreso comparado con la evaluación anterior
4. Explorar el historial completo de evaluaciones
5. Ver las observaciones del entrenador

## Estructura de Archivos

```
supabase/migrations/
  └── 20251112000001_player_evaluations.sql

src/
  ├── services/
  │   └── evaluations.ts
  ├── pages/
  │   ├── MyEvaluations.tsx
  │   └── coach/
  │       └── PlayerEvaluationsPage.tsx
  ├── layouts/
  │   └── CoachLayout.tsx (actualizado)
  ├── components/
  │   └── layout/
  │       └── SideBar.tsx (actualizado)
  ├── i18n/
  │   └── locales/
  │       ├── es.json (actualizado)
  │       └── en.json (actualizado)
  └── main.tsx (actualizado con rutas)
```

## Próximas Mejoras Sugeridas

1. **Exportación de Reportes**
   - PDF con evaluaciones
   - Gráficos comparativos entre jugadores

2. **Notificaciones**
   - Avisar al jugador cuando recibe una nueva evaluación

3. **Comparación de Jugadores**
   - Vista para comparar múltiples jugadores
   - Estadísticas del equipo

4. **Plantillas de Evaluación**
   - Diferentes baremos según edad/categoría
   - Evaluaciones personalizables

5. **Objetivos y Metas**
   - Establecer objetivos por criterio
   - Seguimiento de cumplimiento de metas

6. **Comentarios por Criterio**
   - Notas específicas en cada puntuación
   - Recomendaciones de mejora

## Notas Técnicas

- Las puntuaciones se almacenan de 0 a 10 por defecto
- Los porcentajes se calculan dinámicamente en el frontend
- Los gráficos usan la librería Recharts
- Las políticas RLS garantizan la privacidad de las evaluaciones
- Las evaluaciones se ordenan por fecha descendente
- Se incluyen índices para optimizar las consultas

## Soporte

Para cualquier problema o pregunta sobre el sistema de evaluaciones, revisar:
1. Los logs de la consola del navegador
2. Los errores de Supabase en la consola
3. Las políticas RLS en la base de datos
4. Los permisos del usuario actual
