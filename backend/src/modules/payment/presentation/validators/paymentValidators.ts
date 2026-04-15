import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  plan: z.enum(['basic', 'standard', 'premium']),
});

export const webhookSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.any()),
});

