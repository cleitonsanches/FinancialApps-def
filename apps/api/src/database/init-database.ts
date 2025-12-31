import { DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';

// Importar todas as entidades explicitamente (ordem é importante para relacionamentos)
import { Company } from './entities/company.entity';
import { User } from './entities/user.entity';
import { Contact } from './entities/contact.entity';
import { Client } from './entities/client.entity';
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';
import { BankAccount } from './entities/bank-account.entity';
import { ServiceType } from './entities/service-type.entity';
import { SubscriptionProduct } from './entities/subscription-product.entity';
import { ProposalTemplate } from './entities/proposal-template.entity';
import { Proposal } from './entities/proposal.entity';
import { ProjectTemplate } from './entities/project-template.entity';
import { ProjectTemplateTask } from './entities/project-template-task.entity';
import { ProjectTemplatePhase } from './entities/project-template-phase.entity';
import { Project, ProjectTask } from './entities/project.entity';
import { Phase } from './entities/phase.entity';
import { Invoice, InvoiceTax } from './entities/invoice.entity';
import { InvoiceHistory } from './entities/invoice-history.entity';
import { InvoiceAccountPayable } from './entities/invoice-account-payable.entity';
import { AccountPayable } from './entities/account-payable.entity';
import { Reimbursement } from './entities/reimbursement.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { ProposalAditivo } from './entities/proposal-aditivo.entity';

async function initDatabase() {
  // Determinar caminho do banco: usar variável de ambiente ou caminho relativo à raiz do projeto
  // O PM2 roda na raiz (/var/www/FinancialApps-def), então process.cwd() é a raiz
  // Mas quando executado via npm run, pode estar em apps/api, então subimos 3 níveis do __dirname
  let databasePath: string;
  
  if (process.env.DATABASE_PATH) {
    // Se é caminho relativo, converter para absoluto baseado na raiz do projeto
    const projectRoot = join(__dirname, '../../../../');
    if (process.env.DATABASE_PATH.startsWith('./') || !process.env.DATABASE_PATH.startsWith('/')) {
      databasePath = join(projectRoot, process.env.DATABASE_PATH.replace(/^\.\//, ''));
    } else {
      databasePath = process.env.DATABASE_PATH;
    }
  } else {
    // Calcular caminho relativo à raiz do projeto
    // __dirname está em apps/api/src/database, precisamos subir 3 níveis
    const projectRoot = join(__dirname, '../../../../');
    databasePath = join(projectRoot, 'database.sqlite');
  }
  
  console.log('📂 Database path:', databasePath);
  console.log('📂 __dirname:', __dirname);
  console.log('📂 process.cwd():', process.cwd());
  
  // Forçar importação de todas as entidades (garante que classes sejam carregadas)
  // ProposalAditivo deve vir DEPOIS de Proposal (ordem importa para relacionamentos)
  const allEntities = [
    Company,
    User,
    Contact,
    Client,
    ChartOfAccounts,
    BankAccount,
    ServiceType,
    SubscriptionProduct,
    ProposalTemplate,
    ProjectTemplate,
    ProjectTemplateTask,
    ProjectTemplatePhase,
    Proposal, // Deve vir antes de ProposalAditivo
    ProposalAditivo, // Adicionado de volta após Proposal
    Phase,
    Project,
    ProjectTask,
    Invoice,
    InvoiceTax,
    InvoiceHistory,
    InvoiceAccountPayable,
    AccountPayable,
    Reimbursement,
    TimeEntry,
  ];
  
  console.log(`📦 Carregadas ${allEntities.length} entidades`);
  
  // Verificar se o banco já existe e tem dados
  const dbExists = fs.existsSync(databasePath);
  let existingTables: string[] = [];
  
  if (dbExists) {
    // Conectar temporariamente para verificar tabelas existentes
    const tempDataSource = new DataSource({
      type: 'sqlite',
      database: databasePath,
      entities: allEntities,
      synchronize: false, // NUNCA usar synchronize em banco existente
      logging: false,
    });
    
    try {
      await tempDataSource.initialize();
      const queryRunner = tempDataSource.createQueryRunner();
      const tables = await queryRunner.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      existingTables = tables.map((t: any) => t.name);
      await tempDataSource.destroy();
      
      if (existingTables.length > 0) {
        console.log(`⚠️ AVISO: Banco já existe com ${existingTables.length} tabela(s): ${existingTables.join(', ')}`);
        console.log('⚠️ NÃO será apagado ou recriado. Use migrations para adicionar tabelas.');
        return; // Sair sem fazer nada para preservar dados existentes
      }
    } catch (error) {
      console.log('⚠️ Não foi possível verificar tabelas existentes. Continuando...');
      await tempDataSource.destroy().catch(() => {});
    }
  }

  // Criar DataSource usando lista explícita (mais confiável que glob para ts-node)
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: allEntities, // Lista explícita garante que todas sejam carregadas
    synchronize: true, // Seguro aqui porque só cria se não existir
    logging: true,
  });

  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('✅ Banco de dados conectado com sucesso!');
    
    if (!dbExists || existingTables.length === 0) {
      console.log('Criando tabelas...');
      // O synchronize: true cria as tabelas apenas se não existirem
      await dataSource.synchronize();
      console.log('✅ Tabelas criadas com sucesso!');
    } else {
      console.log('✅ Banco já existe com tabelas. Preservando dados existentes.');
    }
    
    await dataSource.destroy();
    console.log('Conexão fechada.');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initDatabase();
}

export default initDatabase;
