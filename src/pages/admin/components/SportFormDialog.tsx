import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { sportSchema, type SportFormValues } from "@/lib/validations/sport"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"



interface SportFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: SportFormValues) => Promise<void>
  defaultValues?: Partial<SportFormValues>
  title?: string
  description?: string
}

export function SportFormDialog({
  open,
  onClose,
  onSubmit,
  defaultValues,
  title = "Nuevo deporte",
  description = "Ingresa los datos del deporte"
}: SportFormDialogProps) {
  const form = useForm<SportFormValues>({
    resolver: zodResolver(sportSchema),
    defaultValues: {
      name: defaultValues?.name || ""
    }
  })

  const { isSubmitting } = form.formState

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: defaultValues?.name || ""
      })
    }
  }, [open, defaultValues, form])

  const handleSubmit = async (values: SportFormValues) => {
    try {
      // Normalize name (trim)
      const normalizedValues = {
        ...values,
        name: values.name.trim()
      }
      await onSubmit(normalizedValues)
      form.reset()
      onClose()
    } catch (error) {
      // Error handling is done in parent component
      console.error('Form submission error:', error)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Nombre del deporte</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Fútbol, Básquet, Tenis..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}