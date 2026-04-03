import { Email } from '../value-objects/email.vo.ts'

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly email: Email,
    public passwordHash: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  updateProfile(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty')
    }
    this.name = name.trim()
    this.updatedAt = new Date()
  }

  toJSON(): Omit<UserProps, 'passwordHash'> & { id: string } {
    return {
      id: this.id,
      name: this.name,
      email: this.email.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

export interface UserProps {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

/** Contrato HTTP — o que a API serializa via toJSON(). Email é string, nunca o VO. */
export interface UserDTO {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}
