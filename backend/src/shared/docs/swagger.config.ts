import path from 'path';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CryoFlix API',
      version: '1.0.0',
      description: 'API REST da plataforma de streaming CryoFlix',
    },
    servers: [{ url: process.env.API_URL || 'http://localhost:4000' }],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    tags: [
      { name: 'auth', description: 'Autenticação e autorização' },
      { name: 'users', description: 'Perfil e dados do usuário' },
      { name: 'admin', description: 'Painel administrativo (requer role ADMIN)' },
      { name: 'metadata', description: 'Metadados de filmes via TMDb' },
      { name: 'player', description: 'Player e progresso de reprodução' },
    ],
  },
  apis: [
    path.join(process.cwd(), 'src', 'modules', 'auth', 'presentation', 'routes', 'authRoutes.ts'),
    path.join(process.cwd(), 'src', 'modules', 'admin', 'presentation', 'routes', 'adminRoutes.ts'),
  ],
};
