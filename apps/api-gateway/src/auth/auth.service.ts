import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  validateUser(username: string, pass: string): any {
    // The "Neural Identity" check
    if (username === 'admin' && pass === 'budget2026') {
      return { username: 'admin' };
    }
    throw new UnauthorizedException('Invalid System Credentials');
  }
}