import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { SportsTable } from './components/SportsTable'
import { SportFormDialog } from './components/SportFormDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import * as sportsService from '@/services/sports'
import type { Sport } from '@/services/sports'

interface SportsPageState {
  sports: Sport[]
  from: number
  to: number
  hasMore: boolean
  loading: boolean
  error: string | null
}

const SportsPage: React.FC = () => {
  const { toast } = useToast()
  
  const [state, setState] = useState<SportsPageState>({
    sports: [],
    from: 0,
    to: 24,
    hasMore: false,
    loading: true,
    error: null
  })

  const [formDialog, setFormDialog] = useState<{
    open: boolean
    sport?: Sport
  }>({ open: false })

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    sport?: Sport
    loading: boolean
  }>({ open: false, loading: false })

  // Load sports
  const loadSports = async (reset = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const from = reset ? 0 : state.from
      const to = reset ? 24 : state.to
      
      const { data, error, count } = await sportsService.listSports({ from, to })
      
      if (error) throw error

      setState(prev => ({
        ...prev,
        sports: data || [],
        from: reset ? 0 : from,
        to: reset ? 24 : to,
        hasMore: (count || 0) > (to + 1),
        loading: false
      }))
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Error al cargar deportes',
        loading: false
      }))
      toast({
        title: "Error",
        description: error.message || 'Error al cargar deportes',
        variant: "destructive"
      })
    }
  }

  // Load more sports (pagination)
  const loadMore = async () => {
    try {
      const newFrom = state.to + 1
      const newTo = newFrom + 24
      
      const { data, error, count } = await sportsService.listSports({ 
        from: newFrom, 
        to: newTo 
      })
      
      if (error) throw error

      setState(prev => ({
        ...prev,
        sports: [...prev.sports, ...(data || [])],
        from: newFrom,
        to: newTo,
        hasMore: (count || 0) > newTo
      }))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Error al cargar más deportes',
        variant: "destructive"
      })
    }
  }

  // Create sport
  const handleCreate = async (values: { name: string }) => {
    try {
      const { data, error } = await sportsService.createSport(values)
      
      if (error) {
        if (error.code === '23505' || error.message.includes('unique')) {
          throw new Error('Ya existe un deporte con ese nombre')
        }
        throw error
      }

      if (data) {
        setState(prev => ({
          ...prev,
          sports: [data, ...prev.sports]
        }))
        
        toast({
          title: "Éxito",
          description: "Deporte creado correctamente",
          variant: "success"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Error al crear deporte',
        variant: "destructive"
      })
      throw error // Re-throw to keep form open
    }
  }

  // Update sport
  const handleUpdate = async (values: { name: string }) => {
    if (!formDialog.sport) return

    try {
      const { data, error } = await sportsService.updateSport(formDialog.sport.id, values)
      
      if (error) {
        if (error.code === '23505' || error.message.includes('unique')) {
          throw new Error('Ya existe un deporte con ese nombre')
        }
        throw error
      }

      if (data) {
        setState(prev => ({
          ...prev,
          sports: prev.sports.map(sport => 
            sport.id === data.id ? data : sport
          )
        }))
        
        toast({
          title: "Éxito",
          description: "Deporte actualizado correctamente",
          variant: "success"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Error al actualizar deporte',
        variant: "destructive"
      })
      throw error // Re-throw to keep form open
    }
  }

  // Delete sport
  const handleDelete = async () => {
    if (!confirmDialog.sport) return

    try {
      setConfirmDialog(prev => ({ ...prev, loading: true }))
      
      const { error } = await sportsService.deleteSport(confirmDialog.sport.id)
      
      if (error) throw error

      setState(prev => ({
        ...prev,
        sports: prev.sports.filter(sport => sport.id !== confirmDialog.sport!.id)
      }))
      
      toast({
        title: "Éxito",
        description: "Deporte eliminado correctamente",
        variant: "success"
      })
      
      setConfirmDialog({ open: false, loading: false })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Error al eliminar deporte',
        variant: "destructive"
      })
      setConfirmDialog(prev => ({ ...prev, loading: false }))
    }
  }

  // Event handlers
  const handleNewSport = () => {
    setFormDialog({ open: true })
  }

  const handleEditSport = (sport: Sport) => {
    setFormDialog({ open: true, sport })
  }

  const handleDeleteSport = (sport: Sport) => {
    setConfirmDialog({ open: true, sport, loading: false })
  }

  const handleFormSubmit = async (values: { name: string }) => {
    if (formDialog.sport) {
      await handleUpdate(values)
    } else {
      await handleCreate(values)
    }
  }

  // Load initial data
  useEffect(() => {
    loadSports(true)
  }, [])

  if (state.loading && state.sports.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deportes</h1>
            <p className="text-muted-foreground">
              Gestión de deportes del sistema
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando deportes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deportes</h1>
          <p className="text-muted-foreground">
            Gestión de deportes del sistema ({state.sports.length} deportes)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => loadSports(true)} variant="outline" size="sm">
            Actualizar
          </Button>
          <Button onClick={handleNewSport} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo deporte
          </Button>
        </div>
      </div>

      <SportsTable
        sports={state.sports}
        onEdit={handleEditSport}
        onDelete={handleDeleteSport}
        loading={state.loading}
      />

      {state.hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            variant="outline"
            disabled={state.loading}
          >
            {state.loading ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}

      <SportFormDialog
        open={formDialog.open}
        onClose={() => setFormDialog({ open: false })}
        onSubmit={handleFormSubmit}
        defaultValues={formDialog.sport ? { name: formDialog.sport.name } : undefined}
        title={formDialog.sport ? "Editar deporte" : "Nuevo deporte"}
        description={formDialog.sport ? "Modifica los datos del deporte" : "Ingresa los datos del deporte"}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title="Eliminar deporte"
        description={`¿Estás seguro de que quieres eliminar "${confirmDialog.sport?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDialog({ open: false, loading: false })}
        loading={confirmDialog.loading}
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  )
}

export default SportsPage