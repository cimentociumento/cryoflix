import { ValueObject } from '../../../../shared/domain/ValueObject';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  public static create(value: string): Email {
    if (!EMAIL_REGEX.test(value)) {
      throw new ValidationError('E-mail inválido');
    }
    return new Email(value.toLowerCase());
  }

  public get value(): string {
    return this.props.value;
  }
}

