import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';

@Injectable()
export class BudgetAuthGuard implements CanActivate {
  private readonly logger = new Logger('BudgetAuthGuard');

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const apiKey = request.headers['x-api-key'];

    // Validate BOTH the API Key and the Bearer Token
    const isTokenValid = authHeader === 'Bearer budget-me-secure-session-token';
    const isApiKeyValid = apiKey === 'garavi-sokak-2026';

    if (isTokenValid && isApiKeyValid) {
      return true;
    }

    this.logger.error(`Unauthorized! Header: ${authHeader}, API-Key: ${apiKey}`);
    throw new UnauthorizedException('Neural Gate Closed: Identity mismatch');
  }
}