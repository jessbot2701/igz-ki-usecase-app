import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { Role } from '../domain/enums';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { IUserRepository, userRepository } from '../repositories/userRepository';

export interface AuthTokenPayload {
  sub: string;
  role: Role;
  name: string;
}

export interface AuthResult {
  token: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'department'>;
}

const SALT_ROUNDS = 10;

export class AuthService {
  constructor(private readonly users: IUserRepository = userRepository) {}

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.active) {
      throw ApiError.unauthorized('Ungültige Anmeldedaten');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw ApiError.unauthorized('Ungültige Anmeldedaten');
    }
    const token = this.signToken(user);
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department }
    };
  }

  signToken(user: User): string {
    const payload: AuthTokenPayload = { sub: user.id, role: user.role as Role, name: user.name };
    const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
    return jwt.sign(payload, env.jwtSecret, options);
  }

  verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }
}

export const authService = new AuthService();
