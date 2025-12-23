import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      console.log('Tentativa de login para:', loginDto.email);
      console.log('Senha recebida:', loginDto.password ? '***' : 'VAZIA');
      
      if (!loginDto.password) {
        console.log('Erro: Senha não fornecida no DTO');
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const user = await this.userRepository.findOne({
        where: { email: loginDto.email },
        relations: ['company'],
      });

      if (!user) {
        console.log(`Usuário não encontrado: ${loginDto.email}`);
        throw new UnauthorizedException('Credenciais inválidas');
      }

      if (!user.passwordHash || user.passwordHash.trim() === '') {
        console.log(`Usuário sem senha hash: ${loginDto.email}`);
        throw new UnauthorizedException('Credenciais inválidas');
      }

      console.log('Comparando senha para usuário:', loginDto.email);
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Buscar o companyId atualizado do banco
      const updatedUser = await this.userRepository.findOne({
        where: { id: user.id },
        select: ['id', 'email', 'name', 'companyId'],
      });

      const payload = {
        sub: updatedUser.id,
        email: updatedUser.email,
        companyId: updatedUser.companyId || null,
        name: updatedUser.name,
      };

      return {
        token: this.jwtService.sign(payload),
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          companyId: updatedUser.companyId,
        },
      };
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async refreshToken(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'name', 'companyId'],
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        companyId: user.companyId || null,
        name: user.name,
      };

      return {
        token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          companyId: user.companyId,
        },
      };
    } catch (error) {
      console.error('Erro ao atualizar token:', error);
      throw error;
    }
  }
}

