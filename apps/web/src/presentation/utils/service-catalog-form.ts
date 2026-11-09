import { z } from 'zod'

export const serviceCatalogFormSchema = z.object({
  category_id: z.string().uuid('Selecione uma categoria válida.'),
  name: z.string().trim().min(1, 'Informe o nome do serviço.').max(255, 'O nome deve ter no máximo 255 caracteres.'),
  description: z.string().optional(),
  unit_type: z.string().trim().max(50, 'A unidade deve ter no máximo 50 caracteres.').optional(),
})
