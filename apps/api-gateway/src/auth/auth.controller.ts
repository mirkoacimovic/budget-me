import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: any) {
    const user = this.authService.validateUser(loginDto.username, loginDto.password);
    
    return {
      message: 'Login successful',
      user: user.username,
      // Matches the 'access_token' expected by your localStorage logic
      access_token: 'budget-me-secure-session-token' 
    };
  }
}