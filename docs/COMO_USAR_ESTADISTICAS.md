# Cómo Usar las Estadísticas de Partidos

## Acceso a la Funcionalidad

### Para Entrenadores y Administradores

1. **Acceder a Estadísticas**
   - En el menú lateral principal, hacer click en "Estadísticas"
   - O navegar directamente a `/estadisticas`

2. **Seleccionar Equipo**
   - En la parte superior verás un selector de equipos
   - Selecciona el equipo del cual quieres ver las estadísticas
   - Las estadísticas se cargarán automáticamente

3. **Interpretar los Datos**
   - **Partidos Convocados**: Cuántos partidos fue convocado el jugador del total de partidos del equipo
   - **% Convocatorias**: Porcentaje de partidos en los que fue convocado
   - **Prom. Cuartos**: Promedio de cuartos jugados por partido (máximo 4)
   - **% Cuartos Jugados**: Representación visual del promedio de cuartos

4. **Colores Indicadores**
   - 🟢 **Verde** (≥75%): Jugador con alta participación
   - 🟡 **Amarillo** (≥50%): Jugador con participación media
   - 🔴 **Rojo** (<50%): Jugador con baja participación

5. **Ver Detalle del Jugador**
   - Hacer click en cualquier fila de la tabla
   - Serás redirigido a la página de detalle del jugador

### Para Jugadores

1. **Acceder a tus Estadísticas**
   - En el menú lateral principal, hacer click en "Estadísticas"
   - O navegar directamente a `/estadisticas`

2. **Ver tus Datos**
   - Verás automáticamente tus propias estadísticas
   - No necesitas seleccionar equipo
   - Los datos se muestran solo para ti

## Ejemplos de Interpretación

### Ejemplo 1: Jugador Titular
```
Nombre: Juan Pérez
Partidos Convocados: 10 de 10
% Convocatorias: 100%
Prom. Cuartos: 3.8
% Cuartos Jugados: 95% (Verde)
```
**Interpretación**: Jugador titular que participa en casi todos los cuartos de todos los partidos.

### Ejemplo 2: Jugador Suplente Activo
```
Nombre: María García
Partidos Convocados: 8 de 10
% Convocatorias: 80%
Prom. Cuartos: 2.0
% Cuartos Jugados: 50% (Amarillo)
```
**Interpretación**: Jugador que es convocado frecuentemente pero juega aproximadamente la mitad de los cuartos.

### Ejemplo 3: Jugador de Rotación
```
Nombre: Carlos López
Partidos Convocados: 5 de 10
% Convocatorias: 50%
Prom. Cuartos: 1.5
% Cuartos Jugados: 37.5% (Rojo)
```
**Interpretación**: Jugador que participa en algunos partidos con tiempo limitado.

## Cálculo de Cuartos

El sistema calcula los cuartos de la siguiente manera:

- **Cuarto Completo (FULL)**: 1.0 cuarto
- **Medio Cuarto (HALF)**: 0.5 cuarto

### Ejemplo de Cálculo
Si un jugador en 4 partidos jugó:
- Partido 1: 4 cuartos completos = 4.0
- Partido 2: 3 cuartos completos = 3.0
- Partido 3: 2 cuartos completos + 1 medio = 2.5
- Partido 4: 2 cuartos completos = 2.0

**Promedio**: (4.0 + 3.0 + 2.5 + 2.0) / 4 = **2.875 cuartos**
**Porcentaje**: (2.875 / 4) × 100 = **71.9%** (Amarillo)

## Preguntas Frecuentes

### ¿Por qué un jugador tiene 0% si fue convocado?
Si un jugador fue convocado pero no jugó ningún cuarto, su promedio será 0. Esto puede pasar si estuvo en el banco todo el partido.

### ¿Cómo se cuentan los partidos?
Solo se cuentan los partidos del equipo seleccionado. Si un jugador juega en múltiples equipos, las estadísticas son independientes por equipo.

### ¿Puedo ver estadísticas históricas?
Actualmente se muestran todas las estadísticas desde que se comenzó a registrar. En futuras versiones se podrán filtrar por rango de fechas.

### ¿Qué pasa si no hay datos?
Si un equipo no tiene partidos registrados o ningún jugador ha sido convocado, verás un mensaje indicando que no hay datos disponibles.

## Solución de Problemas

### No veo ningún equipo
- Verifica que tengas equipos asignados
- Contacta al administrador para que te asigne equipos

### Las estadísticas están en 0
- Verifica que haya partidos registrados para el equipo
- Verifica que los jugadores hayan sido convocados a los partidos
- Verifica que se hayan registrado los cuartos jugados en cada partido

### No puedo hacer click en un jugador
- Esta funcionalidad estará disponible cuando se implemente la página de detalle del jugador
- Por ahora, puedes ver toda la información en la tabla principal
