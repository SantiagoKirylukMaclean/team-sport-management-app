import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { 
  listInvitations, 
  cancelInvitation, 
  getTeamDetails,
  type TeamDetails 
} from '@/services/invites'
import type { PendingInvite } from '@/types/db'
import { Search, X, Calendar, User, Mail, Users, AlertCircle, RefreshCw } from 'lucide-react'

export default function InvitationManagementPage() {
  usePageTitle('Invitation Management')
  
  const { toast } = useToast()
  
  // State
  const [invitations, setInvitations] = useState<PendingInvite[]>([])
  const [teamDetailsMap, setTeamDetailsMap] = useState<Map<number, TeamDetails>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'canceled'>('all')
  const [searchEmail, setSearchEmail] = useState('')
  
  // Cancellation
  const [cancelingInvitation, setCancelingInvitation] = useState<PendingInvite | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    loadInvitations()
  }, [statusFilter, searchEmail])

  const loadInvitations = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await listInvitations({
        status: statusFilter === 'all' ? undefined : statusFilter,
        email: searchEmail || undefined
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      const invitationData = result.data || []
      setInvitations(invitationData)

      // Get all unique team IDs from invitations
      const allTeamIds = Array.from(
        new Set(invitationData.flatMap(inv => inv.team_ids))
      )

      if (allTeamIds.length > 0) {
        const teamDetailsResult = await getTeamDetails(allTeamIds)
        if (teamDetailsResult.error) {
          console.warn('Failed to load team details:', teamDetailsResult.error.message)
          toast({
            title: "Warning",
            description: "Some team details could not be loaded, but invitations are displayed.",
            variant: "destructive"
          })
        } else {
          const teamMap = new Map<number, TeamDetails>()
          teamDetailsResult.data?.forEach(team => {
            teamMap.set(team.id, team)
          })
          setTeamDetailsMap(teamMap)
        }
      }

      // Success toast for successful loads (only if there were previous errors)
      if (error) {
        toast({
          title: "✅ Invitations loaded",
          description: `Successfully loaded ${invitationData.length} invitation${invitationData.length === 1 ? '' : 's'}.`
        })
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred'
      setError(errorMessage)
      
      // Enhanced error handling
      let userMessage = 'Error loading invitations'
      let description = errorMessage
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userMessage = 'Network error'
        description = 'Please check your internet connection and try again.'
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
        userMessage = 'Access denied'
        description = 'You do not have permission to view invitations.'
      } else if (errorMessage.includes('timeout')) {
        userMessage = 'Request timeout'
        description = 'The request took too long. Please try again.'
      }
      
      toast({
        title: `❌ ${userMessage}`,
        description,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvitation = async () => {
    if (!cancelingInvitation) return

    try {
      setCancelLoading(true)
      
      const result = await cancelInvitation(cancelingInvitation.id)
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      toast({
        title: "✅ Invitation cancelled",
        description: `The invitation for ${cancelingInvitation.email} has been successfully cancelled.`
      })

      // Refresh the list
      await loadInvitations()
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred'
      
      let userMessage = 'Failed to cancel invitation'
      let description = errorMessage
      
      if (errorMessage.includes('not found') || errorMessage.includes('cannot be canceled')) {
        userMessage = 'Cannot cancel invitation'
        description = 'The invitation may have already been accepted or cancelled.'
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
        userMessage = 'Access denied'
        description = 'You do not have permission to cancel this invitation.'
      }
      
      toast({
        title: `❌ ${userMessage}`,
        description,
        variant: "destructive"
      })
    } finally {
      setCancelLoading(false)
      setCancelingInvitation(null)
    }
  }

  const getStatusBadge = (status: PendingInvite['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aceptada</Badge>
      case 'canceled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTeamNames = (teamIds: number[]) => {
    return teamIds
      .map(id => teamDetailsMap.get(id))
      .filter(Boolean)
      .map(team => `${team!.sport_name} > ${team!.club_name} > ${team!.name}`)
      .join(', ')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" message="Loading invitations..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Failed to Load Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-700">{error}</p>
            <div className="flex gap-2">
              <Button onClick={loadInvitations} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="ghost"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Invitaciones</h1>
        <Button asChild>
          <Link to="/admin/invite-user">
            Nueva Invitación
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Buscar por email</label>
            <div className="relative">
              <Input
                placeholder="Buscar por email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pr-10"
              />
              {searchEmail && (
                <button
                  onClick={() => setSearchEmail('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Estado</label>
            <Select 
              value={statusFilter} 
              onValueChange={(value: any) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="accepted">Aceptadas</SelectItem>
                <SelectItem value="canceled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invitaciones ({invitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron invitaciones con los filtros aplicados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TableHead>
                  <TableHead>
                    <User className="h-4 w-4 inline mr-2" />
                    Rol
                  </TableHead>
                  <TableHead>
                    <Users className="h-4 w-4 inline mr-2" />
                    Equipos
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Creada
                  </TableHead>
                  <TableHead>
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Aceptada
                  </TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {invitation.role === 'coach' ? 'Entrenador' : 'Administrador'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-muted-foreground truncate" title={getTeamNames(invitation.team_ids)}>
                        {getTeamNames(invitation.team_ids) || 'Sin equipos'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invitation.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invitation.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.accepted_at ? formatDate(invitation.accepted_at) : '-'}
                    </TableCell>
                    <TableCell>
                      {invitation.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelingInvitation(invitation)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Cancelar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={!!cancelingInvitation}
        onCancel={() => setCancelingInvitation(null)}
        onConfirm={handleCancelInvitation}
        title="Cancelar Invitación"
        description={`¿Estás seguro de que quieres cancelar la invitación para ${cancelingInvitation?.email}? Esta acción no se puede deshacer.`}
        confirmText="Cancelar Invitación"
        cancelText="Mantener"
        loading={cancelLoading}
        variant="destructive"
      />
    </div>
  )
}