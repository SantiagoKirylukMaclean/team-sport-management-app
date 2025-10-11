import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Sport } from "@/services/sports"

interface SportsTableProps {
  sports: Sport[]
  onEdit: (sport: Sport) => void
  onDelete: (sport: Sport) => void
  loading?: boolean
}

export function SportsTable({ sports, onEdit, onDelete, loading = false }: SportsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (sports.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold">No hay deportes aún</h3>
            <p className="text-sm text-muted-foreground">
              Comienza creando tu primer deporte
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sports.map((sport) => (
        <Card key={sport.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{sport.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ID: {sport.id} • Creado: {formatDate(sport.created_at)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(sport)}
                  disabled={loading}
                  aria-label={`Editar ${sport.name}`}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(sport)}
                  disabled={loading}
                  aria-label={`Eliminar ${sport.name}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}