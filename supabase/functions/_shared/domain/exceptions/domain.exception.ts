export class DomainException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainException'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class InvalidEmailException extends DomainException {
  constructor(email: string) {
    super(`Invalid email address: "${email}"`)
    this.name = 'InvalidEmailException'
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" not found`)
    this.name = 'EntityNotFoundException'
  }
}

export class DuplicateEmailException extends DomainException {
  constructor(email: string) {
    super(`Email "${email}" is already in use`)
    this.name = 'DuplicateEmailException'
  }
}
