import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Mail, Shield, Calendar, Key, Users } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  role: string
  created_at: string
  last_sign_in_at: string | null
}

interface PlayerInfo {
  id: number
  full_name: string
  jersey_number: number | null
  team: {
    id: number
    name: string
    club: {
      id: number
      name: string
      sport: {
        id: number
        name: string
      }
    }
  }
}

const Profile: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      // Wait for auth to finish loading
      if (authLoading) return
      
      // If no user after auth loaded, stop loading
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Get user metadata from auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) throw authError

        if (authUser) {
          const userProfile = {
            id: authUser.id,
            email: authUser.email || '',
            role: authUser.user_metadata?.role || 'user',
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at || null
          }
          setProfile(userProfile)

          // If user is a player, fetch player information
          if (userProfile.role === 'player') {
            const { data: playerData, error: playerError } = await supabase
              .from('players')
              .select(`
                id,
                full_name,
                jersey_number,
                team_id,
                teams(
                  id,
                  name,
                  club_id,
                  clubs(
                    id,
                    name,
                    sport_id,
                    sports(
                      id,
                      name
                    )
                  )
                )
              `)
              .eq('user_id', authUser.id)
              .single()

            if (!playerError && playerData) {
              const team = playerData.teams as any
              const club = team?.clubs as any
              const sport = club?.sports as any

              if (team && club && sport) {
                setPlayerInfo({
                  id: playerData.id,
                  full_name: playerData.full_name,
                  jersey_number: playerData.jersey_number,
                  team: {
                    id: team.id,
                    name: team.name,
                    club: {
                      id: club.id,
                      name: club.name,
                      sport: {
                        id: sport.id,
                        name: sport.name
                      }
                    }
                  }
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setMessage({ type: 'error', text: 'Error al cargar el perfil' })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, authLoading])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Todos los campos son obligatorios' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    try {
      setChangingPassword(true)

      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword
      })

      if (signInError) {
        setMessage({ type: 'error', text: 'La contraseña actual es incorrecta' })
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: error.message || 'Error al cambiar la contraseña' })
    } finally {
      setChangingPassword(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      coach: 'Entrenador',
      player: 'Jugador',
      user: 'Usuario'
    }
    return roles[role] || role
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>No se pudo cargar la información del perfil</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Usuario
          </CardTitle>
          <CardDescription>
            Detalles de tu cuenta y perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Correo Electrónico
              </Label>
              <p className="text-lg font-medium">{profile.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Rol
              </Label>
              <p className="text-lg font-medium">{getRoleName(profile.role)}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Cuenta Creada
              </Label>
              <p className="text-sm">{formatDate(profile.created_at)}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Último Acceso
              </Label>
              <p className="text-sm">{formatDate(profile.last_sign_in_at)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">ID de Usuario</Label>
              <p className="text-xs font-mono bg-muted p-2 rounded">{profile.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Team Information Card - Only shown for players */}
      {profile.role === 'player' && playerInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Información del Equipo
            </CardTitle>
            <CardDescription>
              Tu relación con el equipo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nombre del Jugador</Label>
                <p className="text-lg font-medium">{playerInfo.full_name}</p>
              </div>

              {playerInfo.jersey_number && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Número de Camiseta</Label>
                  <p className="text-lg font-medium">#{playerInfo.jersey_number}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground">Equipo</Label>
                <p className="text-lg font-medium">{playerInfo.team.name}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Club</Label>
                <p className="text-lg font-medium">{playerInfo.team.club.name}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Deporte</Label>
                <p className="text-lg font-medium">{playerInfo.team.club.sport.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                disabled={changingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                disabled={changingPassword}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                disabled={changingPassword}
              />
            </div>

            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando Contraseña...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile