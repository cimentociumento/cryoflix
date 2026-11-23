import { z } from 'zod';

export const blockMovieSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
  title: z.string().min(1),
  posterPath: z.string().nullable().optional(),
  reason: z.string().optional(),
});

export const tmdbIdParamSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
});
