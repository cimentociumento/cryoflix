import { z } from 'zod';

export const createVideoSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  categories: z.array(z.string()).default([]),
  duration: z.number().positive(),
  formats: z.array(z.string()).default(['mp4']),
});

