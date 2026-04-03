import { InvalidEmailException } from '../exceptions/domain.exception.ts'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class Email {
  private readonly _value: string

  constructor(value: string) {
    const normalized = value.trim().toLowerCase()
    if (!EMAIL_REGEX.test(normalized)) {
      throw new InvalidEmailException(value)
    }
    this._value = normalized
  }

  get value(): string {
    return this._value
  }

  equals(other: Email): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
