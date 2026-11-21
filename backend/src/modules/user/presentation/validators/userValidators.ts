import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  preferences: z.record(z.string(), z.any()),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Nome de exibição não pode ficar vazio')
    .max(120, 'Nome de exibição deve ter no máximo 120 caracteres')
    .optional()
    .nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().max(2048).optional().nullable(),
});

