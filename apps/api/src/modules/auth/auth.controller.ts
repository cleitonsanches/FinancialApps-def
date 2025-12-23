import { Controller, Post, Body, HttpException, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      console.log('POST /auth/login - Body recebido:', { email: loginDto.email, password: loginDto.password ? '***' : 'VAZIA' });
      return await this.authService.login(loginDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Erro no login:', error);
      throw new HttpException(
        error.message || 'Erro ao fazer login',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('refresh-token')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Request() req: any) {
    try {
      return await this.authService.refreshToken(req.user.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Erro ao atualizar token:', error);
      throw new HttpException(
        error.message || 'Erro ao atualizar token',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req: any) {
    return {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      companyId: req.user.companyId,
    };
  }
}

