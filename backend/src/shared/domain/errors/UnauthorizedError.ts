import { DomainError } from './DomainError';

export class UnauthorizedError extends DomainError {
  readonly code?: string;

  constructor(message = 'Não autorizado', code?: string) {
    super(message);
    this.name = 'UnauthorizedError';
    this.code = code;
  }
}

