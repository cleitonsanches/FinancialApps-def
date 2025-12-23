import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Contact } from '../../database/entities/contact.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  async findAll(companyId: string, onlyActive: boolean = false) {
    const where: any = { companyId };
    if (onlyActive) {
      where.ativo = true;
    }
    
    return await this.userRepository.find({
      where,
      relations: ['company', 'contact'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, companyId: string) {
    const user = await this.userRepository.findOne({
      where: { id, companyId },
      relations: ['company', 'contact'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async create(createUserDto: any, companyId: string) {
    // Se foi fornecido contactId, buscar o contato e usar seus dados
    if (createUserDto.contactId) {
      const contact = await this.contactRepository.findOne({
        where: { id: createUserDto.contactId, companyId },
      });

      if (!contact) {
        throw new NotFoundException('Contato não encontrado');
      }

      // Verificar se já existe usuário com este email
      const existingUser = await this.userRepository.findOne({
        where: { email: contact.email || createUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Já existe um usuário com este email');
      }

      // Criar usuário com dados do contato
      const passwordHash = await bcrypt.hash(createUserDto.password || '123456', 10);
      
      const user = this.userRepository.create({
        name: contact.name,
        email: contact.email || createUserDto.email,
        passwordHash,
        companyId,
        contactId: contact.id,
        isAdmin: createUserDto.isAdmin || false,
        ativo: createUserDto.ativo !== undefined ? createUserDto.ativo : true,
      });

      return await this.userRepository.save(user);
    } else {
      // Criar usuário normalmente (sem contato)
      if (!createUserDto.email || !createUserDto.password) {
        throw new BadRequestException('Email e senha são obrigatórios');
      }

      // Verificar se já existe usuário com este email
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Já existe um usuário com este email');
      }

      const passwordHash = await bcrypt.hash(createUserDto.password, 10);
      
      const user = this.userRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash,
        companyId,
        isAdmin: createUserDto.isAdmin || false,
        ativo: createUserDto.ativo !== undefined ? createUserDto.ativo : true,
      });

      return await this.userRepository.save(user);
    }
  }

  async update(id: string, updateUserDto: any, companyId: string) {
    const user = await this.userRepository.findOne({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se estiver atualizando a senha
    if (updateUserDto.password) {
      updateUserDto.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }

    await this.userRepository.update({ id, companyId }, updateUserDto);
    return await this.userRepository.findOne({
      where: { id, companyId },
      relations: ['company', 'contact'],
    });
  }
}

