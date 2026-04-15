import { z } from 'zod';

export const searchMoviesSchema = z.object({
  query: z.string().min(1, 'query é obrigatório'),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 1))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
});

export const movieIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().int().positive()),
});


