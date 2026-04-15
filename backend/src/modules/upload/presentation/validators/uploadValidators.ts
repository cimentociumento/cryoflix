import { z } from 'zod';

export const signedUrlSchema = z.object({
  fileName: z.string().min(3),
  mimeType: z.string().min(3),
});

export const callbackSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(['completed', 'failed']).default('completed'),
});

