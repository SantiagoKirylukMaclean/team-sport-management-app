import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import type { Club } from '@/services/clubs'
import type { Sport } from '@/services/sports'

interface ClubsTableProps {
  clubs: Club[]
  sports: Sport[]
  onEdit: (club: Club) => void
  onDelete: (club: Club) => void
}

export default function ClubsTable({ 
  clubs, 
  sports, 
  onEdit, 
  onDelete 
}: ClubsTableProps) {
  // Create a map for quick sport name lookup
  const sportsMap = new Map(sports.map(sport => [sport.id, sport.name]))

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSportName = (sportId: number) => {
    return sportsMap.get(sportId) || `Deporte ${sportId}`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Deporte</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs.map((club) => (
            <TableRow key={club.id}>
              <TableCell className="font-medium">
                {club.name}
              </TableCell>
              <TableCell>
                <span className="text-blue-600 font-medium">
                  {getSportName(club.sport_id)}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(club.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(club)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(club)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}