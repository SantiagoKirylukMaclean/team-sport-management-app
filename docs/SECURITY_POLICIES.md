# Políticas de Seguridad RLS (Row Level Security)

Este documento describe las políticas de seguridad a nivel de fila implementadas en la base de datos.

## Función Helper Principal

### `is_coach_of_team(team_id)`
Verifica si el usuario actual tiene rol de 'coach' o 'admin' para un equipo específico.

```sql
SELECT public.is_coach_of_team(team_id)
```

Retorna `true` si el usuario actual:
- Tiene un registro en `user_team_roles` para el `team_id` especificado
- Con rol 'coach' o 'admin'

## Resumen de Permisos por Rol

### 🔑 Super Admin
- **Acceso total** a todas las tablas y operaciones (CRUD completo)

### 👨‍🏫 Coach/Admin de Equipo
Los coaches tienen **CRUD completo** sobre:

#### 1. Jugadores (`players`)
- ✅ **CREATE**: Agregar jugadores a sus equipos
- ✅ **READ**: Ver jugadores de sus equipos
- ✅ **UPDATE**: Modificar información de jugadores de sus equipos
- ✅ **DELETE**: Eliminar jugadores de sus equipos

#### 2. Entrenamientos (`training_sessions`, `training_attendance`)
- ✅ **CREATE**: Crear sesiones de entrenamiento para sus equipos
- ✅ **READ**: Ver entrenamientos de sus equipos
- ✅ **UPDATE**: Modificar entrenamientos de sus equipos
- ✅ **DELETE**: Eliminar entrenamientos de sus equipos
- ✅ **Asistencia**: Gestionar asistencia de jugadores de sus equipos

#### 3. Partidos y Relacionados
**Partidos (`matches`)**
- ✅ **CREATE**: Crear partidos para sus equipos
- ✅ **READ**: Ver partidos de sus equipos
- ✅ **UPDATE**: Modificar partidos de sus equipos
- ✅ **DELETE**: Eliminar partidos de sus equipos

**Participación por Período (`match_player_periods`)**
- ✅ **CRUD completo** para períodos de partidos de sus equipos

**Convocatorias (`match_call_ups`)**
- ✅ **CRUD completo** para convocatorias de partidos de sus equipos

**Resultados por Cuarto (`match_quarter_results`)**
- ✅ **CRUD completo** para resultados de partidos de sus equipos

**Goles (`match_goals`)**
- ✅ **CRUD completo** para goles de partidos de sus equipos
- ⚠️ Validación: Goleador y asistidor deben pertenecer al mismo equipo

**Sustituciones (`match_substitutions`)**
- ✅ **CRUD completo** para sustituciones de partidos de sus equipos

#### 4. Evaluaciones de Jugadores
**Evaluaciones (`player_evaluations`)**
- ✅ **CREATE**: Crear evaluaciones para jugadores de sus equipos
- ✅ **READ**: Ver **todas** las evaluaciones de jugadores de sus equipos (incluso las creadas por otros coaches)
- ✅ **UPDATE**: Solo las evaluaciones que **ellos mismos crearon**
- ✅ **DELETE**: Solo las evaluaciones que **ellos mismos crearon**

**Puntuaciones (`evaluation_scores`)**
- ✅ **CREATE/UPDATE/DELETE**: Solo para evaluaciones que **ellos crearon**
- ✅ **READ**: Ver puntuaciones de **todas** las evaluaciones de jugadores de sus equipos

**Categorías y Criterios**
- ✅ **READ**: Ver todas las categorías y criterios de evaluación (público)
- ❌ **CREATE/UPDATE/DELETE**: Solo super admins

### 👤 Jugadores (Players)
Los jugadores pueden:

#### Evaluaciones
- ✅ **READ**: Ver **solo sus propias** evaluaciones
- ✅ **READ**: Ver **solo sus propias** puntuaciones de evaluación

## Tablas y sus Políticas

### Tabla: `players`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) |

### Tabla: `training_sessions`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) |

### Tabla: `training_attendance`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) |

### Tabla: `matches`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) |

### Tabla: `match_player_periods`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) |

### Tabla: `match_call_ups`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) |

### Tabla: `match_quarter_results`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) |

### Tabla: `match_goals`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) |

### Tabla: `match_substitutions`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) | ✅ (su equipo) |

### Tabla: `player_evaluations`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (su equipo) | ✅ (su equipo) | ✅ (solo propias) | ✅ (solo propias) |
| Jugador | ❌ | ✅ (solo propias) | ❌ | ❌ |

### Tabla: `evaluation_scores`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Coach/Admin | ✅ (solo propias) | ✅ (su equipo) | ✅ (solo propias) | ✅ (solo propias) |
| Jugador | ❌ | ✅ (solo propias) | ❌ | ❌ |

### Tabla: `evaluation_categories`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Todos | ❌ | ✅ | ❌ | ❌ |

### Tabla: `evaluation_criteria`
| Rol | CREATE | READ | UPDATE | DELETE |
|-----|--------|------|--------|--------|
| Todos | ❌ | ✅ | ❌ | ❌ |

## Validaciones Adicionales

### Match Goals
- El goleador (`scorer_id`) debe pertenecer al equipo del partido
- El asistidor (`assister_id`), si existe, debe pertenecer al equipo del partido

### Training Attendance
- El entrenamiento y el jugador deben pertenecer al mismo equipo

### Match Player Periods
- El partido y el jugador deben pertenecer al mismo equipo

### Match Substitutions
- Ambos jugadores (entrante y saliente) deben estar convocados para el partido
- Los jugadores deben pertenecer al equipo del partido

## Migraciones Relacionadas

1. `20250923010400_base_sports_clubs_teams_and_rls.sql` - Función base `is_coach_of_team`
2. `20251020000000_players.sql` - Políticas de jugadores
3. `20251020010000_training.sql` - Políticas de entrenamientos
4. `20251020020000_matches.sql` - Políticas de partidos
5. `20251026000000_match_call_ups.sql` - Políticas de convocatorias
6. `20251028000002_ensure_substitutions.sql` - Políticas de sustituciones
7. `20251106000000_quarter_results.sql` - Políticas de resultados y goles
8. `20251112000001_player_evaluations.sql` - Políticas base de evaluaciones
9. `20251128000000_fix_evaluation_scores_view.sql` - Fix para visualización de scores
10. `20251128000001_refactor_evaluation_policies.sql` - Refactorización de políticas de evaluaciones

## Notas de Seguridad

- ✅ Todas las políticas usan la función helper `is_coach_of_team()` para consistencia
- ✅ Las funciones helper usan `security definer` con `set search_path = public` para prevenir vulnerabilities
- ✅ Los super admins siempre tienen acceso completo a través de `is_superadmin()`
- ✅ RLS está habilitado en todas las tablas sensibles
- ✅ Las políticas incluyen tanto `USING` (para SELECT/UPDATE/DELETE) como `WITH CHECK` (para INSERT/UPDATE)
