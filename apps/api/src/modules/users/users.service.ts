import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(companyId?: string): Promise<User[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    try {
      return await this.userRepository.find({ 
        where, 
        relations: ['company', 'contact'] 
      });
    } catch (error) {
      console.error('Erro ao buscar usuários com relações:', error);
      // Se houver erro com as relações, tentar sem elas
      return await this.userRepository.find({ where });
    }
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({ 
      where: { id }, 
      relations: ['company', 'contact'] 
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.passwordHash) {
      userData.passwordHash = await bcrypt.hash(userData.passwordHash, 10);
    }
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    if (userData.passwordHash) {
      userData.passwordHash = await bcrypt.hash(userData.passwordHash, 10);
    }
    await this.userRepository.update(id, userData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}

