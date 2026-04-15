import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo de 10 tentativas por IP na janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
});

