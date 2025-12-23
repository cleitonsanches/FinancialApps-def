import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../database/entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: any, companyId: string) {
    const client = this.clientRepository.create({
      ...createClientDto,
      companyId,
    });
    return await this.clientRepository.save(client);
  }

  async findAll(companyId: string) {
    return await this.clientRepository.find({
      where: { companyId },
      relations: ['contacts'],
      order: { dataCadastro: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string) {
    return await this.clientRepository.findOne({
      where: { id, companyId },
      relations: ['contacts'],
    });
  }

  async update(id: string, updateClientDto: any, companyId: string) {
    await this.clientRepository.update({ id, companyId }, updateClientDto);
    return await this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string) {
    await this.clientRepository.delete({ id, companyId });
  }
}

