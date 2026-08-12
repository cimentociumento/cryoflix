import { z } from 'zod';

export const enqueueJobSchema = z.object({
  uploadJobId: z.string().min(1),
  renditions: z.array(z.string().min(1)).optional(),
});
