import { z } from 'zod';

export const recordEventSchema = z.object({
  event: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});
