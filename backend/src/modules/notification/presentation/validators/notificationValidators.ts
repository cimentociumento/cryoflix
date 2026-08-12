import { z } from 'zod';

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const sendPushSchema = z.object({
  token: z.string().min(1),
  message: z.string().min(1),
});
