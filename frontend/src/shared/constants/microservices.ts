export type ApiEndpoint = {
  method: string;
  path: string;
  summary: string;
  service: string;
  criticality: 'core' | 'support';
};

export type Microservice = {
  name: string;
  description: string;
  owners: string[];
  stack: string[];
  status: 'stable' | 'rolling-out' | 'design';
  endpoints: ApiEndpoint[];
};

export const microservices: Microservice[] = [
  {
    name: 'Auth Service',
    description: 'Cadastro, login, refresh token e roles.',
    owners: ['Identity Squad'],
    stack: ['Node.js', 'Express', 'PostgreSQL', 'Redis'],
    status: 'stable',
    endpoints: [
      { method: 'POST', path: '/api/auth/register', summary: 'Cria usuário final', service: 'Auth', criticality: 'core' },
      { method: 'POST', path: '/api/auth/login', summary: 'Autentica e retorna JWT', service: 'Auth', criticality: 'core' },
      { method: 'POST', path: '/api/auth/refresh', summary: 'Renova access token', service: 'Auth', criticality: 'support' },
    ],
  },
  {
    name: 'Content Service',
    description: 'Catálogo, busca e publicação.',
    owners: ['Studio Squad'],
    stack: ['Node.js', 'PostgreSQL', 'ElasticSearch'],
    status: 'rolling-out',
    endpoints: [
      { method: 'GET', path: '/api/content', summary: 'Lista vídeos com filtros', service: 'Content', criticality: 'core' },
      { method: 'POST', path: '/api/content', summary: 'Registra metadados de vídeo', service: 'Content', criticality: 'core' },
      { method: 'POST', path: '/api/content/:id/publish', summary: 'Publica ativo transcodificado', service: 'Content', criticality: 'support' },
    ],
  },
  {
    name: 'Streaming Service',
    description: 'Sessões de playback, DRM e heartbeats.',
    owners: ['Edge Squad'],
    stack: ['Node.js', 'CDN', 'Redis', 'Nginx'],
    status: 'rolling-out',
    endpoints: [
      { method: 'GET', path: '/api/streaming/playback/:videoId', summary: 'Entrega manifest HLS/DASH', service: 'Streaming', criticality: 'core' },
      { method: 'POST', path: '/api/streaming/sessions/:sessionId/heartbeat', summary: 'Atualiza sessão ativa', service: 'Streaming', criticality: 'support' },
    ],
  },
  {
    name: 'Payment Service',
    description: 'Planos, billing e webhooks.',
    owners: ['Revenue Squad'],
    stack: ['Node.js', 'Stripe', 'PostgreSQL'],
    status: 'stable',
    endpoints: [
      { method: 'POST', path: '/api/payments/subscriptions', summary: 'Cria assinatura', service: 'Payment', criticality: 'core' },
      { method: 'GET', path: '/api/payments/subscriptions/:id', summary: 'Consulta assinatura', service: 'Payment', criticality: 'support' },
      { method: 'POST', path: '/api/payments/webhooks', summary: 'Recebe eventos de billing', service: 'Payment', criticality: 'support' },
    ],
  },
  {
    name: 'Recommendation Service',
    description: 'Sugestões personalizadas e feedback loops.',
    owners: ['Data Squad'],
    stack: ['Node.js', 'Python', 'Kafka'],
    status: 'design',
    endpoints: [
      { method: 'GET', path: '/api/recommendations/:userId', summary: 'Lista recomendações', service: 'Recommendation', criticality: 'core' },
      { method: 'POST', path: '/api/recommendations/feedback', summary: 'Registra feedback de usuário', service: 'Recommendation', criticality: 'support' },
    ],
  },
];

export const apiEndpoints: ApiEndpoint[] = microservices.flatMap((svc) => svc.endpoints);

export const sprintRoadmap = [
  { sprint: 'Sprint 1', focus: 'Auth + Perfis', outcomes: ['Login/Registro', 'Perfil básico'], status: 'concluido' },
  { sprint: 'Sprint 2', focus: 'Upload + Storage', outcomes: ['Signed URL', 'Callback ingestão'], status: 'em-andamento' },
  { sprint: 'Sprint 3', focus: 'Player + Streaming', outcomes: ['Playback HLS', 'Heartbeat'], status: 'proximo' },
  { sprint: 'Sprint 4', focus: 'Transcoding Multi-bitrate', outcomes: ['Fila FFmpeg', 'Renditions 240p-4K'], status: 'planejado' },
];

export const catalogHighlights = [
  { title: 'Sci-Fi Originals', duration: '45 episódios', category: 'Séries', quality: '4K HDR' },
  { title: 'Esportes ao vivo', duration: '24/7', category: 'Live', quality: 'Full HD' },
  { title: 'Coleção cinema nacional', duration: '120 filmes', category: 'Filmes', quality: 'Dolby Vision' },
];

