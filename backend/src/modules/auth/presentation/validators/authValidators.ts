import { z } from 'zod';

const strongPassword = z
  .string()
  .min(8)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
    'Senha deve conter maiúscula, minúscula, número e caractere especial',
  );

export const registerSchema = z.object({
  email: z.string().email(),
  password: strongPassword,
  name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres válidos')
    .max(120, 'Nome deve ter no máximo 120 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: strongPassword,
});
