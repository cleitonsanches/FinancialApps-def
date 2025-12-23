import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../database/entities/contact.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createContactDto: any, companyId: string) {
    if (!companyId) {
      throw new Error('companyId é obrigatório para criar um contato');
    }
    
    if (!createContactDto.name || createContactDto.name.trim() === '') {
      throw new Error('O nome do contato é obrigatório');
    }
    
    const contact = this.contactRepository.create({
      name: createContactDto.name,
      phone: createContactDto.phone || null,
      email: createContactDto.email || null,
      clientId: createContactDto.clientId || null,
      companyId,
    });
    
    console.log('Criando contato com dados:', {
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      clientId: contact.clientId,
      companyId: contact.companyId,
    });
    
    try {
      const saved = await this.contactRepository.save(contact);
      console.log('Contato criado com sucesso:', saved.id);
      return saved;
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error);
      console.error('Dados do contato:', contact);
      throw error;
    }
  }

  async findAll(companyId: string, clientId?: string, excludeUsers: boolean = false) {
    const where: any = { companyId };
    if (clientId) {
      where.clientId = clientId;
    }
    
    const contacts = await this.contactRepository.find({
      where,
      relations: ['client'],
      order: { name: 'ASC' },
    });

    // Se excludeUsers for true, filtrar contatos que são usuários
    if (excludeUsers) {
      const users = await this.userRepository.find({
        where: { companyId },
        select: ['contactId'],
      });
      
      const userContactIds = new Set(users.map(u => u.contactId).filter(Boolean));
      
      return contacts.filter(contact => !userContactIds.has(contact.id));
    }
    
    return contacts;
  }

  async findOne(id: string, companyId: string) {
    const contact = await this.contactRepository.findOne({
      where: { id, companyId },
      relations: ['client'],
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }

    return contact;
  }

  async update(id: string, updateContactDto: any, companyId: string) {
    await this.contactRepository.update({ id, companyId }, updateContactDto);
    return await this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string) {
    await this.contactRepository.delete({ id, companyId });
  }
}
