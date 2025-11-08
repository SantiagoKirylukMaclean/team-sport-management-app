# Ejemplos de Uso: Sistema de Invitación de Jugadores

## Tabla de Contenidos
1. [Invitar un Jugador](#invitar-un-jugador)
2. [Obtener Información del Jugador Autenticado](#obtener-información-del-jugador-autenticado)
3. [Dashboard Personalizado para Jugadores](#dashboard-personalizado-para-jugadores)
4. [Restringir Datos por Jugador](#restringir-datos-por-jugador)
5. [Verificar Vinculación](#verificar-vinculación)
6. [Gestionar Jugadores sin Cuenta](#gestionar-jugadores-sin-cuenta)

---

## Invitar un Jugador

### Desde la UI (Recomendado)

```typescript
// Navegar a la página de invitación
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
navigate('/admin/invite-player')
```

### Programáticamente

```typescript
import { createInvitation } from '@/services/invites'
import { getPlayer } from '@/services/players'

async function invitePlayer(playerId: number, email: string) {
  // 1. Obtener información del jugador
  const playerResult = await getPlayer(playerId)
  
  if (playerResult.error || !playerResult.data) {
    console.error('Jugador no encontrado')
    return
  }

  const player = playerResult.data

  // 2. Crear la invitación
  const result = await createInvitation({
    email: email,
    display_name: player.full_name,
    role: 'player',
    teamIds: [player.team_id],
    playerId: playerId,
    redirectTo: 'https://myapp.com/player/dashboard'
  })

  if (result.error) {
    console.error('Error:', result.error.message)
    return
  }

  // 3. Compartir el link
  const invitationLink = result.data.action_link
  console.log('Compartir este link:', invitationLink)
  
  // Copiar al clipboard
  navigator.clipboard.writeText(invitationLink)
}

// Uso
invitePlayer(123, 'juan.perez@example.com')
```

---

## Obtener Información del Jugador Autenticado

### Hook personalizado

```typescript
// hooks/useCurrentPlayer.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PlayerWithTeam } from '@/services/players'

export function useCurrentPlayer() {
  const { user } = useAuth()
  const [player, setPlayer] = useState<PlayerWithTeam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setPlayer(null)
      setLoading(false)
      return
    }

    loadPlayer()
  }, [user])

  async function loadPlayer() {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('players')
        .select(`
          *,
          teams!inner(
            name,
            clubs!inner(
              name,
              sports!inner(
                name
              )
            )
          )
        `)
        .eq('user_id', user!.id)
        .single()

      if (fetchError) throw fetchError

      setPlayer(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading player')
      setPlayer(null)
    } finally {
      setLoading(false)
    }
  }

  return { player, loading, error, refetch: loadPlayer }
}
```

### Uso del hook

```typescript
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'

function PlayerProfile() {
  const { player, loading, error } = useCurrentPlayer()

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>
  if (!player) return <div>No eres un jugador</div>

  return (
    <div>
      <h1>{player.full_name}</h1>
      <p>Número: #{player.jersey_number}</p>
      <p>Equipo: {player.teams?.name}</p>
      <p>Club: {player.teams?.clubs?.name}</p>
      <p>Deporte: {player.teams?.clubs?.sports?.name}</p>
    </div>
  )
}
```

---

## Dashboard Personalizado para Jugadores

```typescript
import { useAuth } from '@/contexts/AuthContext'
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PlayerStats {
  total_matches: number
  total_points: number
  total_assists: number
  average_points: number
}

function PlayerDashboard() {
  const { user, profile } = useAuth()
  const { player, loading: playerLoading } = useCurrentPlayer()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (player) {
      loadPlayerData()
    }
  }, [player])

  async function loadPlayerData() {
    try {
      setLoading(true)

      // Cargar estadísticas del jugador
      const { data: statsData } = await supabase
        .from('player_statistics')
        .select('*')
        .eq('player_id', player!.id)

      if (statsData) {
        const totalMatches = statsData.length
        const totalPoints = statsData.reduce((sum, s) => sum + (s.points || 0), 0)
        const totalAssists = statsData.reduce((sum, s) => sum + (s.assists || 0), 0)
        
        setStats({
          total_matches: totalMatches,
          total_points: totalPoints,
          total_assists: totalAssists,
          average_points: totalMatches > 0 ? totalPoints / totalMatches : 0
        })
      }

      // Cargar próximos partidos del equipo
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('team_id', player!.team_id)
        .gte('match_date', new Date().toISOString())
        .order('match_date', { ascending: true })
        .limit(5)

      setUpcomingMatches(matchesData || [])

    } catch (err) {
      console.error('Error loading player data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (playerLoading || loading) {
    return <div>Cargando dashboard...</div>
  }

  if (!player) {
    return <div>No tienes un perfil de jugador vinculado</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card p-6 rounded-lg">
        <h1 className="text-3xl font-bold">{player.full_name}</h1>
        <p className="text-muted-foreground">
          #{player.jersey_number} • {player.teams?.name}
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Partidos Jugados" 
          value={stats?.total_matches || 0} 
        />
        <StatCard 
          title="Puntos Totales" 
          value={stats?.total_points || 0} 
        />
        <StatCard 
          title="Asistencias" 
          value={stats?.total_assists || 0} 
        />
        <StatCard 
          title="Promedio de Puntos" 
          value={stats?.average_points.toFixed(1) || '0.0'} 
        />
      </div>

      {/* Próximos partidos */}
      <div className="bg-card p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Próximos Partidos</h2>
        {upcomingMatches.length === 0 ? (
          <p className="text-muted-foreground">No hay partidos programados</p>
        ) : (
          <ul className="space-y-2">
            {upcomingMatches.map((match: any) => (
              <li key={match.id} className="flex justify-between items-center p-3 bg-accent rounded">
                <span>{match.opponent}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(match.match_date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-card p-4 rounded-lg">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

export default PlayerDashboard
```

---

## Restringir Datos por Jugador

### Mostrar solo estadísticas del jugador actual

```typescript
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function MyStats() {
  const { player } = useCurrentPlayer()
  const [stats, setStats] = useState([])

  useEffect(() => {
    if (player) {
      loadStats()
    }
  }, [player])

  async function loadStats() {
    const { data } = await supabase
      .from('player_statistics')
      .select(`
        *,
        matches (
          match_date,
          opponent,
          result
        )
      `)
      .eq('player_id', player!.id)
      .order('created_at', { ascending: false })

    setStats(data || [])
  }

  return (
    <div>
      <h2>Mis Estadísticas</h2>
      {stats.map((stat: any) => (
        <div key={stat.id}>
          <p>Partido vs {stat.matches.opponent}</p>
          <p>Puntos: {stat.points}</p>
          <p>Asistencias: {stat.assists}</p>
        </div>
      ))}
    </div>
  )
}
```

### Verificar permisos antes de mostrar datos

```typescript
import { useAuth } from '@/contexts/AuthContext'
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'

function PlayerDataGuard({ 
  playerId, 
  children 
}: { 
  playerId: number
  children: React.ReactNode 
}) {
  const { profile } = useAuth()
  const { player } = useCurrentPlayer()

  // Super admin y admin pueden ver todo
  if (profile?.role === 'super_admin' || profile?.role === 'admin') {
    return <>{children}</>
  }

  // Coach puede ver jugadores de sus equipos
  if (profile?.role === 'coach') {
    // Aquí verificarías si el coach tiene acceso al equipo del jugador
    return <>{children}</>
  }

  // Player solo puede ver sus propios datos
  if (profile?.role === 'player') {
    if (player?.id === playerId) {
      return <>{children}</>
    }
    return <div>No tienes permiso para ver estos datos</div>
  }

  return <div>Acceso denegado</div>
}

// Uso
function PlayerStatsPage({ playerId }: { playerId: number }) {
  return (
    <PlayerDataGuard playerId={playerId}>
      <PlayerStats playerId={playerId} />
    </PlayerDataGuard>
  )
}
```

---

## Verificar Vinculación

### Verificar si un jugador tiene cuenta

```typescript
import { supabase } from '@/lib/supabase'

async function checkPlayerHasAccount(playerId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('players')
    .select('user_id')
    .eq('id', playerId)
    .single()

  if (error || !data) return false
  
  return data.user_id !== null
}

// Uso
const hasAccount = await checkPlayerHasAccount(123)
if (hasAccount) {
  console.log('El jugador ya tiene cuenta')
} else {
  console.log('El jugador puede ser invitado')
}
```

### Obtener email del jugador si tiene cuenta

```typescript
async function getPlayerEmail(playerId: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      user_id,
      profiles!inner(email)
    `)
    .eq('id', playerId)
    .single()

  if (error || !data || !data.user_id) return null
  
  return data.profiles.email
}
```

---

## Gestionar Jugadores sin Cuenta

### Listar jugadores disponibles para invitar

```typescript
import { getUnlinkedPlayers } from '@/services/players'
import { useState, useEffect } from 'react'

function UnlinkedPlayersList() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUnlinkedPlayers()
  }, [])

  async function loadUnlinkedPlayers() {
    setLoading(true)
    const result = await getUnlinkedPlayers()
    
    if (result.data) {
      setPlayers(result.data)
    }
    
    setLoading(false)
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <h2>Jugadores sin Cuenta ({players.length})</h2>
      <ul>
        {players.map((player: any) => (
          <li key={player.id}>
            {player.full_name} #{player.jersey_number} - {player.teams?.name}
            <button onClick={() => invitePlayer(player.id)}>
              Invitar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )

  function invitePlayer(playerId: number) {
    // Navegar a la página de invitación con el jugador pre-seleccionado
    window.location.href = `/admin/invite-player?playerId=${playerId}`
  }
}
```

### Badge de estado de cuenta

```typescript
function PlayerAccountBadge({ playerId }: { playerId: number }) {
  const [hasAccount, setHasAccount] = useState<boolean | null>(null)

  useEffect(() => {
    checkAccount()
  }, [playerId])

  async function checkAccount() {
    const { data } = await supabase
      .from('players')
      .select('user_id')
      .eq('id', playerId)
      .single()

    setHasAccount(data?.user_id !== null)
  }

  if (hasAccount === null) return null

  return (
    <span className={`badge ${hasAccount ? 'badge-success' : 'badge-warning'}`}>
      {hasAccount ? '✓ Con cuenta' : '⚠ Sin cuenta'}
    </span>
  )
}
```

---

## Ejemplo Completo: Página de Gestión de Jugadores

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { UserPlus, Mail } from 'lucide-react'

interface PlayerWithAccount {
  id: number
  full_name: string
  jersey_number: number | null
  user_id: string | null
  teams: {
    name: string
  }
  profiles?: {
    email: string
  }
}

function PlayersManagementPage() {
  const [players, setPlayers] = useState<PlayerWithAccount[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadPlayers()
  }, [])

  async function loadPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        teams!inner(name),
        profiles(email)
      `)
      .order('full_name')

    if (data) {
      setPlayers(data)
    }
    
    setLoading(false)
  }

  function handleInvitePlayer(playerId: number) {
    navigate(`/admin/invite-player?playerId=${playerId}`)
  }

  if (loading) return <div>Cargando jugadores...</div>

  const playersWithAccount = players.filter(p => p.user_id)
  const playersWithoutAccount = players.filter(p => !p.user_id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Jugadores</h1>
        <Button onClick={() => navigate('/admin/invite-player')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Jugador
        </Button>
      </div>

      {/* Jugadores sin cuenta */}
      {playersWithoutAccount.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Jugadores sin Cuenta ({playersWithoutAccount.length})
          </h2>
          <div className="space-y-2">
            {playersWithoutAccount.map(player => (
              <div 
                key={player.id} 
                className="flex justify-between items-center bg-white p-3 rounded"
              >
                <div>
                  <span className="font-medium">{player.full_name}</span>
                  {player.jersey_number && (
                    <span className="text-muted-foreground ml-2">
                      #{player.jersey_number}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground ml-2">
                    • {player.teams.name}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleInvitePlayer(player.id)}
                >
                  Invitar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jugadores con cuenta */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Jugadores con Cuenta ({playersWithAccount.length})
        </h2>
        <div className="space-y-2">
          {playersWithAccount.map(player => (
            <div 
              key={player.id} 
              className="flex justify-between items-center bg-card p-3 rounded"
            >
              <div>
                <span className="font-medium">{player.full_name}</span>
                {player.jersey_number && (
                  <span className="text-muted-foreground ml-2">
                    #{player.jersey_number}
                  </span>
                )}
                <span className="text-sm text-muted-foreground ml-2">
                  • {player.teams.name}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {player.profiles?.email || 'Sin email'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlayersManagementPage
```

---

## Notas Importantes

1. **Seguridad**: Siempre verifica los permisos antes de mostrar datos sensibles
2. **Performance**: Usa índices en las consultas frecuentes
3. **UX**: Muestra claramente qué jugadores tienen cuenta y cuáles no
4. **Validación**: Verifica que el jugador no tenga cuenta antes de invitar
5. **Error Handling**: Maneja errores de red y base de datos apropiadamente
