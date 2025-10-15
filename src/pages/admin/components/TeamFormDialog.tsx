import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createTeam, updateTeam, type Team } from '@/services/teams'
import { type Club } from '@/services/clubs'

const teamSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  club_id: z.number().int().positive('Seleccioná un club')
})

type TeamFormData = z.infer<typeof teamSchema>

interface TeamFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  team?: Team | null
  clubs: Club[]
}

export function TeamFormDialog({ 
  open, 
  onClose, 
  onSave, 
  team, 
  clubs 
}: TeamFormDialogProps) {
  const { toast } = useToast()
  const isEditing = !!team

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      club_id: 0
    }
  })

  // Reset form when dialog opens/closes or team changes
  useEffect(() => {
    if (open) {
      if (team) {
        form.reset({
          name: team.name,
          club_id: team.club_id
        })
      } else {
        form.reset({
          name: '',
          club_id: 0
        })
      }
    }
  }, [open, team, form])

  const onSubmit = async (data: TeamFormData) => {
    try {
      let result
      
      if (isEditing && team) {
        result = await updateTeam(team.id, data)
      } else {
        result = await createTeam(data)
      }

      if (result.error) {
        // Manejar errores específicos
        if (result.error.code === '23505') {
          toast({
            title: "Error de duplicado",
            description: "Ya existe un equipo con ese nombre en el club seleccionado.",
            variant: "destructive"
          })
        } else {
          throw result.error
        }
        return
      }

      toast({
        title: "Éxito",
        description: `Equipo ${isEditing ? 'actualizado' : 'creado'} correctamente.`
      })

      onSave()
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al ${isEditing ? 'actualizar' : 'crear'} equipo: ${err.message}`,
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nombre del equipo" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="club_id"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Club</FormLabel>
                  <Select 
                    value={field.value ? field.value.toString() : undefined} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar club" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clubs.map(club => (
                        <SelectItem key={club.id} value={club.id.toString()}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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