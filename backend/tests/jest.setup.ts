process.env.REDIS_ENABLED = 'false';
// A suíte HTTP é isolada dos dados e das credenciais presentes no .env local.
process.env.DATABASE_URL = '';
process.env.NODE_ENV = 'test';


// As suítes exercitam o fluxo com verificação de e-mail (como em produção com SMTP).
// O envio real não acontece: RegisterUser não dispara e-mail com NODE_ENV=test.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { EmailService } = require('../src/shared/services/EmailService');
jest.spyOn(EmailService.prototype, 'isConfigured').mockReturnValue(true);
