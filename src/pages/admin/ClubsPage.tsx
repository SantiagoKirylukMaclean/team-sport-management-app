import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'
import { listClubs, deleteClub, type Club } from '@/services/clubs'
import { listSports, type Sport } from '@/services/sports'
import ClubsTable from './components/ClubsTable'
import ClubFormDialog from './components/ClubFormDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'



const ClubsPage: React.FC = () => {
  usePageTitle('Clubs Management')
  
  const [clubs, setClubs] = useState<Club[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSportId, setSelectedSportId] = useState<number | undefined>()
  const [from, setFrom] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [deletingClub, setDeletingClub] = useState<Club | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchSports = useCallback(async () => {
    try {
      const { data, error } = await listSports({ from: 0, to: 999 }) // Get all sports
      if (error) throw error
      setSports(data || [])
    } catch (error) {
      console.error('Error fetching sports:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los deportes.',
        variant: 'destructive',
      })
    }
  }, [])

  const fetchClubs = useCallback(async (reset = false) => {
    try {
      setLoading(true)
      const currentFrom = reset ? 0 : from
      const { data, error, count } = await listClubs({
        from: currentFrom,
        to: currentFrom + 24,
        sportId: selectedSportId,
      })
      
      if (error) throw error
      
      const clubsData = data || []
      setClubs(reset ? clubsData : [...clubs, ...clubsData])
      setHasMore((count || 0) > currentFrom + 25)
      
      if (reset) {
        setFrom(25)
      } else {
        setFrom(currentFrom + 25)
      }
    } catch (error) {
      console.error('Error fetching clubs:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clubes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [from, selectedSportId, clubs])

  useEffect(() => {
    fetchSports()
  }, [fetchSports])

  useEffect(() => {
    fetchClubs(true)
  }, [selectedSportId]) // Reset when sport filter changes

  const handleSportFilterChange = (value: string) => {
    const sportId = value === 'all' ? undefined : parseInt(value)
    setSelectedSportId(sportId)
    setFrom(0)
  }

  const handleNewClub = () => {
    setEditingClub(null)
    setFormDialogOpen(true)
  }

  const handleEditClub = (club: Club) => {
    setEditingClub(club)
    setFormDialogOpen(true)
  }

  const handleDeleteClub = (club: Club) => {
    setDeletingClub(club)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingClub) return
    
    try {
      setDeleteLoading(true)
      const { error } = await deleteClub(deletingClub.id)
      
      if (error) throw error
      
      toast({
        title: 'Club eliminado',
        description: 'El club se eliminó correctamente.',
      })
      
      // Refresh the list
      fetchClubs(true)
    } catch (error: any) {
      console.error('Error deleting club:', error)
      
      // Handle specific database errors
      if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
        toast({
          title: 'Error',
          description: 'No se puede borrar el club porque tiene equipos asociados.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el club. Intentá de nuevo.',
          variant: 'destructive',
        })
      }
    } finally {
      setDeleteLoading(false)
      setConfirmDialogOpen(false)
      setDeletingClub(null)
    }
  }

  const handleFormSuccess = () => {
    fetchClubs(true)
  }

  const loadMore = () => {
    fetchClubs(false)
  }

  if (loading && clubs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clubes</h1>
          <p className="text-muted-foreground">
            Gestión de clubes del sistema
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando clubes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clubes</h1>
          <p className="text-muted-foreground">
            Gestión de clubes del sistema ({clubs.length} clubes)
          </p>
        </div>
        <Button onClick={handleNewClub}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Club
        </Button>
      </div>

      {/* Sport Filter */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium">Filtrar por deporte:</label>
        <Select
          value={selectedSportId ? selectedSportId.toString() : 'all'}
          onValueChange={handleSportFilterChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los deportes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los deportes</SelectItem>
            {sports.map((sport) => (
              <SelectItem key={sport.id} value={sport.id.toString()}>
                {sport.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clubs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="text-4xl mb-4">🏟️</div>
              <h3 className="text-lg font-semibold">No hay clubes</h3>
              <p className="text-muted-foreground">
                {selectedSportId 
                  ? 'No hay clubes para el deporte seleccionado.'
                  : 'Aún no se han registrado clubes en el sistema.'
                }
              </p>
              <Button onClick={handleNewClub} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear primer club
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <ClubsTable
            clubs={clubs}
            sports={sports}
            onEdit={handleEditClub}
            onDelete={handleDeleteClub}
          />

          {hasMore && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Cargar más'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <ClubFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        club={editingClub}
        sports={sports}
        onSuccess={handleFormSuccess}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        title="Eliminar Club"
        description={`¿Estás seguro de que querés eliminar el club "${deletingClub?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmDialogOpen(false)
          setDeletingClub(null)
        }}
        loading={deleteLoading}
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  )
}

export default ClubsPage