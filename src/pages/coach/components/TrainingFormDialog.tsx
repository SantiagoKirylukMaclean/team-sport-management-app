import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createTrainingSession, updateTrainingSession, type TrainingSession } from '@/services/trainings'

const trainingSchema = z.object({
  session_date: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional()
})

type TrainingFormData = z.infer<typeof trainingSchema>

interface TrainingFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  training?: TrainingSession | null
  teamId: number
}

export function TrainingFormDialog({ 
  open, 
  onClose, 
  onSave, 
  training, 
  teamId 
}: TrainingFormDialogProps) {
  const { toast } = useToast()
  const isEditing = !!training

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      session_date: '',
      notes: ''
    }
  })

  // Reset form when dialog opens/closes or training changes
  useEffect(() => {
    if (open) {
      if (training) {
        form.reset({
          session_date: training.session_date,
          notes: training.notes || ''
        })
      } else {
        form.reset({
          session_date: '',
          notes: ''
        })
      }
    }
  }, [open, training, form])

  const onSubmit = async (data: TrainingFormData) => {
    try {
      let result
      
      if (isEditing && training) {
        result = await updateTrainingSession(training.id, {
          session_date: data.session_date,
          notes: data.notes || undefined
        })
      } else {
        result = await createTrainingSession({
          team_id: teamId,
          session_date: data.session_date,
          notes: data.notes || undefined
        })
      }

      if (result.error) {
        // Handle RLS permission errors
        if (result.error.message?.includes('permission') || 
            result.error.message?.includes('policy')) {
          toast({
            title: "Sin permisos",
            description: "No tenés permisos para acceder a este recurso.",
            variant: "destructive"
          })
        } else if (result.error.code === '23503') {
          // Foreign key violation
          toast({
            title: "Error de validación",
            description: "El equipo seleccionado no existe.",
            variant: "destructive"
          })
        } else if (result.error.code === '23505') {
          // Unique constraint violation
          toast({
            title: "Error de duplicado",
            description: "Ya existe un entrenamiento con esos datos.",
            variant: "destructive"
          })
        } else {
          throw result.error
        }
        return
      }

      toast({
        title: "Éxito",
        description: `Entrenamiento ${isEditing ? 'actualizado' : 'creado'} correctamente.`
      })

      onSave()
    } catch (err: any) {
      // Handle network errors
      const errorMessage = err?.message || err?.toString() || 'Error desconocido'
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        toast({
          title: "Error de conexión",
          description: "Verificá tu conexión a internet.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: `Error al ${isEditing ? 'actualizar' : 'crear'} entrenamiento: ${errorMessage}`,
          variant: "destructive"
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="session_date"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Fecha del Entrenamiento</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas sobre el entrenamiento"
                      maxLength={500}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting 
                  ? (isEditing ? 'Actualizando...' : 'Creando...') 
                  : (isEditing ? 'Actualizar' : 'Crear')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
