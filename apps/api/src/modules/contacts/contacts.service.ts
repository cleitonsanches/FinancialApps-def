import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../database/entities/contact.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  async findAll(companyId?: string): Promise<Contact[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.contactRepository.find({ 
      where, 
      relations: ['company', 'client'],
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Contact> {
    return this.contactRepository.findOne({ 
      where: { id }, 
      relations: ['company', 'client'] 
    });
  }

  async create(contactData: Partial<Contact>): Promise<Contact> {
    const contact = this.contactRepository.create(contactData);
    return this.contactRepository.save(contact);
  }

  async update(id: string, contactData: Partial<Contact>): Promise<Contact> {
    await this.contactRepository.update(id, contactData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.contactRepository.delete(id);
  }
}

