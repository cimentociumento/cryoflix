import { DomainError } from './DomainError';

export class UnauthorizedError extends DomainError {
  constructor(message = 'Não autorizado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

