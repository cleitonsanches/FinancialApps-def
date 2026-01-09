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

  async findAll(companyId?: string, isCliente?: boolean, isFornecedor?: boolean): Promise<Client[]> {
    try {
      console.log('ClientsService.findAll - companyId:', companyId, 'isCliente:', isCliente, 'isFornecedor:', isFornecedor);
      
      // Primeiro, verificar quantos registros existem SEM filtro
      const totalCount = await this.clientRepository.count();
      console.log('ClientsService.findAll - Total de registros na tabela (sem filtros):', totalCount);
      
      const where: any = {};
      if (companyId) {
        where.companyId = companyId;
        // Verificar quantos registros têm esse companyId
        const countWithCompany = await this.clientRepository.count({ where: { companyId } });
        console.log(`ClientsService.findAll - Registros com companyId=${companyId}:`, countWithCompany);
      }
      if (isCliente !== undefined) {
        where.isCliente = isCliente;
      }
      if (isFornecedor !== undefined) {
        where.isFornecedor = isFornecedor;
      }
      
      console.log('ClientsService.findAll - condições where:', JSON.stringify(where));
      
      const clients = await this.clientRepository.find({ where });
      console.log('ClientsService.findAll - encontrados:', clients.length, 'clientes');
      
      if (clients.length > 0) {
        console.log('ClientsService.findAll - primeiro cliente:', {
          id: clients[0].id,
          name: clients[0].name,
          companyId: clients[0].companyId,
          isCliente: clients[0].isCliente,
          isClienteType: typeof clients[0].isCliente,
          isFornecedor: clients[0].isFornecedor,
          isFornecedorType: typeof clients[0].isFornecedor
        });
      } else {
        console.warn('ClientsService.findAll - NENHUM cliente encontrado com os filtros aplicados!');
        // Se não encontrou nada e tinha filtro de companyId, tentar sem o filtro para debug
        if (companyId) {
          console.log('ClientsService.findAll - Tentando buscar SEM filtro de companyId para debug...');
          const allClients = await this.clientRepository.find({ take: 5 });
          console.log('ClientsService.findAll - Primeiros 5 registros (sem filtro):', allClients.map(c => ({
            id: c.id,
            name: c.name,
            companyId: c.companyId
          })));
        }
      }
      
      return clients;
    } catch (error: any) {
      console.error('ClientsService.findAll - ERRO:', error.message);
      console.error('ClientsService.findAll - Stack:', error.stack);
      throw error;
    }
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

