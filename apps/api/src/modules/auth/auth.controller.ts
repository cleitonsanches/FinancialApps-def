import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    console.log('Recebida requisição de login para:', loginDto.email);
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      console.log('Usuário não validado, lançando exceção');
      throw new UnauthorizedException('Credenciais inválidas');
    }
    console.log('Usuário validado, gerando resposta de login');
    const result = await this.authService.login(user);
    console.log('Resposta de login gerada, retornando para o cliente');
    return result;
  }
}

