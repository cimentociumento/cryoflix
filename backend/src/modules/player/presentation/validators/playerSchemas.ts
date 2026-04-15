import { z } from 'zod';

export const embedParamsSchema = z.object({
  movieId: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().positive()),
});

export const embedQuerySchema = z.object({
  imdbId: z.string().optional(),
});

export const progressSchema = z.object({
  movieId: z.number().int().positive(),
  progress: z.number().min(0).max(1),
});


