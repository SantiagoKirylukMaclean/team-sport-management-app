import * as z from "zod"

export const sportSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(80, 'Máximo 80 caracteres')
})

export type SportFormValues = z.infer<typeof sportSchema>