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

  async findAll(companyId?: string): Promise<Client[]> {
    console.log('ClientsService.findAll - companyId:', companyId);
    if (companyId) {
      const clients = await this.clientRepository.find({ where: { companyId } });
      console.log('ClientsService.findAll - encontrados com companyId:', clients.length);
      return clients;
    }
    const allClients = await this.clientRepository.find();
    console.log('ClientsService.findAll - encontrados todos:', allClients.length);
    return allClients;
  }

  async findOne(id: string): Promise<Client> {
    return this.clientRepository.findOne({ where: { id } });
  }

  async create(clientData: Partial<Client>): Promise<Client> {
    // Validar que pelo menos um tipo foi selecionado
    if (!clientData.isCliente && !clientData.isFornecedor && !clientData.isColaborador) {
      throw new Error('Selecione pelo menos um tipo: Cliente, Fornecedor ou Colaborador/Associado');
    }
    
    // Garantir que razaoSocial sempre tenha um valor (mesmo que seja string vazia)
    if (!clientData.razaoSocial && clientData.name) {
      clientData.razaoSocial = clientData.name;
    } else if (!clientData.razaoSocial) {
      clientData.razaoSocial = '';
    }
    const client = this.clientRepository.create(clientData);
    return this.clientRepository.save(client);
  }

  async update(id: string, clientData: Partial<Client>): Promise<Client> {
    // Validar que pelo menos um tipo foi selecionado
    // Se nenhum tipo foi enviado, verificar os valores atuais
    if (clientData.isCliente === undefined && clientData.isFornecedor === undefined && clientData.isColaborador === undefined) {
      // Não validar se nenhum tipo foi enviado (mantém os valores atuais)
    } else {
      // Se algum tipo foi enviado, verificar se pelo menos um está marcado
      const existingClient = await this.findOne(id);
      const isCliente = clientData.isCliente !== undefined ? clientData.isCliente : existingClient.isCliente;
      const isFornecedor = clientData.isFornecedor !== undefined ? clientData.isFornecedor : existingClient.isFornecedor;
      const isColaborador = clientData.isColaborador !== undefined ? clientData.isColaborador : existingClient.isColaborador;
      
      if (!isCliente && !isFornecedor && !isColaborador) {
        throw new Error('Selecione pelo menos um tipo: Cliente, Fornecedor ou Colaborador/Associado');
      }
    }
    
    await this.clientRepository.update(id, clientData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.clientRepository.delete(id);
  }
}

