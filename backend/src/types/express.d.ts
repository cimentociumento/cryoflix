import type { DomainRole } from '../modules/auth/domain/types/AccountTypes';
import type { DomainAccountStatus } from '../modules/auth/domain/types/AccountTypes';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sub: string;
        email: string;
        role: DomainRole;
        status: DomainAccountStatus;
      };
    }
  }
}

export {};
