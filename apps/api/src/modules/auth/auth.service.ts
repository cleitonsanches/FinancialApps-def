import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Company } from '../../database/entities/company.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['company'],
    });

    if (!user) {
      console.log(`Usuário não encontrado: ${email}`);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`Validação de senha para ${email}: ${isPasswordValid}`);
    
    if (isPasswordValid) {
      const { passwordHash, ...result } = user;
      return result;
    }
    
    console.log(`Senha inválida para ${email}`);
    return null;
  }

  async login(user: any) {
    console.log('Gerando token para usuário:', user.email);
    const payload = { email: user.email, sub: user.id, companyId: user.companyId };
    const token = this.jwtService.sign(payload);
    console.log('Token gerado com sucesso. Tamanho:', token.length);
    
    const response = {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: user.companyId,
      },
    };
    
    console.log('Resposta do login:', JSON.stringify({ ...response, access_token: response.access_token.substring(0, 20) + '...' }));
    return response;
  }
}

