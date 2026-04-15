import { DomainError } from './DomainError';

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} com identificador '${identifier}' não encontrado`
      : `${resource} não encontrado`;
    super(message);
    this.name = 'NotFoundError';
  }
}

