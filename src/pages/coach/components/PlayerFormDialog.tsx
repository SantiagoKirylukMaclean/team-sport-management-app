import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { createPlayer, updatePlayer, type PlayerWithTeam as Player } from '@/services/players'

const playerSchema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres').max(120, 'Máximo 120 caracteres'),
  jersey_number: z
    .union([
      z.number().int().min(0, 'Debe ser mayor o igual a 0').max(999, 'Debe ser menor a 1000'),
      z.nan()
    ])
    .transform(v => (Number.isNaN(v) ? null : v))
    .optional()
})

type PlayerFormData = z.infer<typeof playerSchema>

interface PlayerFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  player?: Player | null
  teamId: number
}

export function PlayerFormDialog({
  open,
  onClose,
  onSave,
  player,
  teamId
}: PlayerFormDialogProps) {
  const { toast } = useToast()
  const isEditing = !!player

  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      full_name: '',
      jersey_number: undefined
    }
  })

  // Reset form when dialog opens/closes or player changes
  useEffect(() => {
    if (open) {
      if (player) {
        form.reset({
          full_name: player.full_name,
          jersey_number: player.jersey_number || undefined
        })
      } else {
        form.reset({
          full_name: '',
          jersey_number: undefined
        })
      }
    }
  }, [open, player, form])

  const onSubmit = async (data: PlayerFormData) => {
    try {
      let result

      if (isEditing && player) {
        result = await updatePlayer(player.id, data)
      } else {
        result = await createPlayer({
          team_id: teamId,
          full_name: data.full_name,
          jersey_number: data.jersey_number
        })
      }

      if (result.error) {
        // Manejar errores específicos
        if (result.error.code === '23505') {
          toast({
            title: "Error de duplicado",
            description: "Ese número ya existe en el equipo.",
            variant: "destructive"
          })
        } else if (result.error.message?.includes('permission')) {
          toast({
            title: "Sin permisos",
            description: "No tenés permisos para este equipo.",
            variant: "destructive"
          })
        } else {
          throw result.error
        }
        return
      }

      toast({
        title: "Éxito",
        description: `Jugador ${isEditing ? 'actualizado' : 'creado'} correctamente.`
      })

      onSave()
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Error desconocido'
      toast({
        title: "Error",
        description: `Error al ${isEditing ? 'actualizar' : 'crear'} jugador: ${errorMessage}`,
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Jugador' : 'Nuevo Jugador'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre completo del jugador"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jersey_number"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Número de Camiseta (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0-999"
                      min="0"
                      max="999"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : parseInt(value))
                      }}
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