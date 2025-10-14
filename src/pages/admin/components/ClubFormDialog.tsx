import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { createClub, updateClub, type Club } from '@/services/clubs'
import type { Sport } from '@/services/sports'

const clubSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  sport_id: z.number().int().positive('Seleccioná un deporte'),
})

type ClubFormData = z.infer<typeof clubSchema>

interface ClubFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  club?: Club | null
  sports: Sport[]
  onSuccess: () => void
}

export default function ClubFormDialog({
  open,
  onOpenChange,
  club,
  sports,
  onSuccess,
}: ClubFormDialogProps) {
  const form = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: '',
      sport_id: 0,
    },
  })

  const isEditing = !!club

  useEffect(() => {
    if (open) {
      if (club) {
        form.reset({
          name: club.name,
          sport_id: club.sport_id,
        })
      } else {
        form.reset({
          name: '',
          sport_id: 0,
        })
      }
    }
  }, [open, club, form])

  const onSubmit = async (data: ClubFormData) => {
    try {
      // Trim the name before sending
      const trimmedData = {
        ...data,
        name: data.name.trim(),
      }

      if (isEditing && club) {
        const { error } = await updateClub(club.id, trimmedData)
        if (error) throw error
        toast({
          title: 'Club actualizado',
          description: 'El club se actualizó correctamente.',
        })
      } else {
        const { error } = await createClub(trimmedData)
        if (error) throw error
        toast({
          title: 'Club creado',
          description: 'El club se creó correctamente.',
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving club:', error)
      
      // Handle specific database errors
      if (error.code === '23505') {
        toast({
          title: 'Error',
          description: 'Ya existe un club con ese nombre en este deporte.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: isEditing 
            ? 'No se pudo actualizar el club. Intentá de nuevo.'
            : 'No se pudo crear el club. Intentá de nuevo.',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Club' : 'Nuevo Club'}
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
                      placeholder="Ingresá el nombre del club" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sport_id"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Deporte</FormLabel>
                  <Select 
                    onValueChange={(value: string) => field.onChange(parseInt(value))}
                    value={field.value > 0 ? field.value.toString() : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná un deporte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sports.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id.toString()}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
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