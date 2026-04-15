import { z } from 'zod';

export const subtitleQuerySchema = z.object({
  movieId: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .pipe(z.number().int().positive().optional()),
  imdbId: z.string().optional(),
});

export const downloadSchema = z.object({
  fileId: z.number().int().positive(),
});

export const downloadParamsSchema = z.object({
  fileId: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().positive()),
});


