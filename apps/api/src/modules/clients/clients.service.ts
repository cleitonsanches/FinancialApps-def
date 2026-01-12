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
      console.log('==========================================');
      console.log('ClientsService.findAll - INÍCIO');
      console.log('ClientsService.findAll - Parâmetros:', { companyId, isCliente, isFornecedor });
      console.log('==========================================');
      
      // Primeiro, verificar quantos registros existem SEM filtro
      const totalCount = await this.clientRepository.count();
      console.log('ClientsService.findAll - Total de registros na tabela (sem filtros):', totalCount);
      
      if (totalCount === 0) {
        console.warn('ClientsService.findAll - ⚠️ TABELA VAZIA! Não há nenhum cliente cadastrado no banco.');
        return [];
      }
      
      const where: any = {};
      if (companyId) {
        console.log(`ClientsService.findAll - companyId recebido: "${companyId}" (tipo: ${typeof companyId}, length: ${companyId.length})`);
        
        // SQL Server com collation case-insensitive deve funcionar, mas vamos garantir
        // Primeiro tentar case-sensitive (mais rápido)
        const countWithCompany = await this.clientRepository.count({ where: { companyId } });
        console.log(`ClientsService.findAll - Registros com companyId exato:`, countWithCompany);
        
        // Se não encontrou nada, tentar case-insensitive
        if (countWithCompany === 0) {
          console.log(`ClientsService.findAll - Tentando busca case-insensitive...`);
          const clientsCaseInsensitive = await this.clientRepository
            .createQueryBuilder('client')
            .where('LOWER(client.companyId) = LOWER(:companyId)', { companyId })
            .getMany();
          console.log(`ClientsService.findAll - Clientes encontrados (case-insensitive):`, clientsCaseInsensitive.length);
          
          if (clientsCaseInsensitive.length > 0) {
            console.log(`ClientsService.findAll - Primeiro cliente encontrado (case-insensitive):`, {
              id: clientsCaseInsensitive[0].id,
              companyId: clientsCaseInsensitive[0].companyId,
              name: clientsCaseInsensitive[0].name
            });
            // Aplicar outros filtros se necessário
            let filteredClients = clientsCaseInsensitive;
            if (isCliente !== undefined) {
              filteredClients = filteredClients.filter(c => c.isCliente === isCliente);
            }
            if (isFornecedor !== undefined) {
              filteredClients = filteredClients.filter(c => c.isFornecedor === isFornecedor);
            }
            return filteredClients;
          }
        } else {
          // Encontrou com case-sensitive, usar normalmente
          where.companyId = companyId;
        }
      }
      if (isCliente !== undefined) {
        where.isCliente = isCliente;
      }
      if (isFornecedor !== undefined) {
        where.isFornecedor = isFornecedor;
      }
      
      console.log('ClientsService.findAll - condições where:', JSON.stringify(where));
      
      // Se não há filtros, buscar todos
      let clients: Client[];
      if (Object.keys(where).length === 0) {
        console.log('ClientsService.findAll - Sem filtros, buscando TODOS os clientes...');
        clients = await this.clientRepository.find();
      } else {
        console.log('ClientsService.findAll - Com filtros, buscando com where...');
        clients = await this.clientRepository.find({ where });
      }
      
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
        console.warn('ClientsService.findAll - ⚠️ NENHUM cliente encontrado com os filtros aplicados!');
        console.warn('ClientsService.findAll - Total na tabela:', totalCount, 'mas filtros retornaram 0');
        
        // Se não encontrou nada, tentar buscar TODOS para debug
        console.log('ClientsService.findAll - Buscando TODOS os clientes para debug...');
        const allClients = await this.clientRepository.find({ take: 10 });
        console.log('ClientsService.findAll - Primeiros 10 registros (sem filtro):', allClients.length);
        if (allClients.length > 0) {
          console.log('ClientsService.findAll - Exemplo de cliente no banco:', {
            id: allClients[0].id,
            name: allClients[0].name,
            companyId: allClients[0].companyId,
            isCliente: allClients[0].isCliente,
            isFornecedor: allClients[0].isFornecedor
          });
        }
        
        // Se não havia filtros, retornar todos
        if (Object.keys(where).length === 0) {
          console.log('ClientsService.findAll - Sem filtros, retornando todos os clientes encontrados');
          return allClients;
        }
      }
      
      console.log('ClientsService.findAll - Retornando', clients.length, 'clientes');
      console.log('==========================================');
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

