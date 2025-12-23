import { DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';

// Importar todas as entidades
import { User } from './entities/user.entity';
import { Company } from './entities/company.entity';
import { Client } from './entities/client.entity';
import { Contact } from './entities/contact.entity';
import { Proposal } from './entities/proposal.entity';
import { ProposalTemplate } from './entities/proposal-template.entity';
import { ProjectTemplate } from './entities/project-template.entity';
import { ProjectTemplateTask } from './entities/project-template-task.entity';
import { Project, ProjectTask } from './entities/project.entity';
import { Invoice, InvoiceTax } from './entities/invoice.entity';
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';
import { BankAccount } from './entities/bank-account.entity';

async function initDatabase() {
  const databasePath = join(process.cwd(), 'database.sqlite');
  
  // Criar DataSource
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [
      User,
      Company,
      Client,
      Contact,
      Proposal,
      ProposalTemplate,
      ProjectTemplate,
      ProjectTemplateTask,
      Project,
      ProjectTask,
      Invoice,
      InvoiceTax,
      ChartOfAccounts,
      BankAccount,
    ],
    synchronize: true, // Habilitar para criar tabelas
    logging: true,
  });

  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('Banco de dados conectado com sucesso!');
    
    console.log('Criando tabelas...');
    // O synchronize: true já cria as tabelas automaticamente
    await dataSource.synchronize();
    console.log('Tabelas criadas com sucesso!');
    
    await dataSource.destroy();
    console.log('Conexão fechada.');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initDatabase();
}

export default initDatabase;

