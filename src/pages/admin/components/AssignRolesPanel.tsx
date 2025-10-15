import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { 
  listAssignments, 
  addAssignment, 
  removeAssignment, 
  searchProfiles,
  type EnrichedUserTeamRole 
} from '@/services/userTeamRoles'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Profile {
  id: string
  display_name: string | null
  role: string
  created_at: string
}

interface AssignRolesPanelProps {
  teamId: number
  teamName: string
  open: boolean
  onClose: () => void
}

export function AssignRolesPanel({ 
  teamId, 
  teamName, 
  open, 
  onClose 
}: AssignRolesPanelProps) {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<EnrichedUserTeamRole[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'coach' | 'admin'>('coach')
  const [removingAssignment, setRemovingAssignment] = useState<EnrichedUserTeamRole | null>(null)

  // Cargar asignaciones cuando se abre el panel
  useEffect(() => {
    if (open && teamId) {
      loadAssignments()
    }
  }, [open, teamId])

  // Buscar usuarios cuando cambia la query
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const result = await listAssignments(teamId)
      
      if (result.error) throw result.error
      setAssignments(result.data || [])
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al cargar asignaciones: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    try {
      const result = await searchProfiles(searchQuery)
      
      if (result.error) throw result.error
      setSearchResults(result.data || [])
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al buscar usuarios: ${err.message}`,
        variant: "destructive"
      })
    }
  }

  const handleAddAssignment = async () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: "Error",
        description: "Selecciona un usuario y un rol.",
        variant: "destructive"
      })
      return
    }

    try {
      const result = await addAssignment({
        user_id: selectedUserId,
        team_id: teamId,
        role: selectedRole
      })

      if (result.error) {
        // Manejar duplicados
        if (result.error.code === '23505') {
          toast({
            title: "Error",
            description: "Ese usuario ya tiene ese rol en el equipo.",
            variant: "destructive"
          })
        } else {
          throw result.error
        }
        return
      }

      toast({
        title: "Éxito",
        description: "Asignación agregada correctamente."
      })

      // Limpiar formulario y recargar
      setSelectedUserId('')
      setSelectedRole('coach')
      setSearchQuery('')
      setSearchResults([])
      loadAssignments()
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al agregar asignación: ${err.message}`,
        variant: "destructive"
      })
    }
  }

  const handleRemoveAssignment = async (assignment: EnrichedUserTeamRole) => {
    try {
      const result = await removeAssignment({
        user_id: assignment.user_id,
        team_id: assignment.team_id,
        role: assignment.role
      })

      if (result.error) throw result.error

      toast({
        title: "Éxito",
        description: "Asignación quitada correctamente."
      })

      loadAssignments()
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al quitar asignación: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setRemovingAssignment(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      coach: 'bg-blue-100 text-blue-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Asignar Roles - {teamName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Agregar nueva asignación */}
            <Card>
              <CardHeader>
                <CardTitle>Agregar Asignación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Buscar Usuario
                  </label>
                  <Input
                    placeholder="Buscar por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                      {searchResults.map((profile) => (
                        <div
                          key={profile.id}
                          className={`p-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                            selectedUserId === profile.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedUserId(profile.id)}
                        >
                          <div className="font-medium">
                            {profile.display_name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">
                            UUID: {profile.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">
                      Rol
                    </label>
                    <Select 
                      value={selectedRole} 
                      onValueChange={(value: 'coach' | 'admin') => setSelectedRole(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={handleAddAssignment}
                      disabled={!selectedUserId || !selectedRole}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de asignaciones actuales */}
            <Card>
              <CardHeader>
                <CardTitle>Asignaciones Actuales ({assignments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Cargando...</div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay asignaciones para este equipo
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>UUID</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Asignado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={`${assignment.user_id}-${assignment.role}`}>
                          <TableCell className="font-medium">
                            {assignment.display_name || 'Sin nombre'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {assignment.user_id}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(assignment.role)}`}>
                              {assignment.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            {formatDate(assignment.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRemovingAssignment(assignment)}
                            >
                              Quitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removingAssignment}
        onCancel={() => setRemovingAssignment(null)}
        onConfirm={() => removingAssignment && handleRemoveAssignment(removingAssignment)}
        title="Quitar asignación"
        description={`¿Estás seguro de que quieres quitar el rol "${removingAssignment?.role}" del usuario "${removingAssignment?.display_name || removingAssignment?.user_id}"?`}
        variant="destructive"
      />
    </>
  )
}