import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  preferences: z.record(z.string(), z.any()),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(120).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().max(2048).optional().nullable(),
});

