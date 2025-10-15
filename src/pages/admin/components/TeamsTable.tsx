import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { deleteTeam, type Team } from '@/services/teams'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface TeamsTableProps {
  teams: Team[]
  getClubName: (clubId: number) => string
  onEdit: (team: Team) => void
  onDelete: () => void
  onAssignRoles: (team: Team) => void
}

export function TeamsTable({ 
  teams, 
  getClubName, 
  onEdit, 
  onDelete, 
  onAssignRoles 
}: TeamsTableProps) {
  const { toast } = useToast()
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDelete = async (team: Team) => {
    try {
      setLoading(true)
      const result = await deleteTeam(team.id)
      
      if (result.error) {
        // Manejar errores específicos
        if (result.error.code === '23503') {
          toast({
            title: "No se puede eliminar",
            description: "Este equipo tiene datos asociados y no puede ser eliminado.",
            variant: "destructive"
          })
        } else {
          throw result.error
        }
        return
      }

      toast({
        title: "Éxito",
        description: "Equipo eliminado correctamente."
      })
      
      onDelete()
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al eliminar equipo: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setDeletingTeam(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="text-4xl">⚽</div>
            <h3 className="text-lg font-medium">No hay equipos</h3>
            <p className="text-sm text-muted-foreground">
              No se encontraron equipos con los filtros aplicados.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Equipos ({teams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{getClubName(team.club_id)}</TableCell>
                  <TableCell>{formatDate(team.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(team)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAssignRoles(team)}
                      >
                        Asignar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingTeam(team)}
                        disabled={loading}
                      >
                        Borrar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deletingTeam}
        onCancel={() => setDeletingTeam(null)}
        onConfirm={() => deletingTeam && handleDelete(deletingTeam)}
        title="Eliminar equipo"
        description={`¿Estás seguro de que quieres eliminar el equipo "${deletingTeam?.name}"? Esta acción no se puede deshacer.`}
        loading={loading}
        variant="destructive"
      />
    </>
  )
}