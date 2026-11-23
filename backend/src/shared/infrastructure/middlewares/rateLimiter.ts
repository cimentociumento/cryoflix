import rateLimit from 'express-rate-limit';

// Suítes automatizadas (jest + e2e) fazem dezenas de login/registro do
// mesmo IP em segundos — sem isso, o rate limit real (pensado pra tráfego
// de produção) derruba a própria suíte de teste com 429.
const skipInTest = () => process.env.NODE_ENV === 'test';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo de 10 tentativas por IP na janela
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
});

export const authSensitiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    message: 'Muitas tentativas. Aguarde alguns minutos.',
  },
});

export const metadataRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas requisições de metadados. Tente novamente em instantes.',
  },
});

