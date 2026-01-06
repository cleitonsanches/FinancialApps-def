import { DataSource } from 'typeorm';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config/database.config';

// Importar todas as entidades
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
import { ProposalAditivo } from './entities/proposal-aditivo.entity';
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
import { TaskComment } from './entities/task-comment.entity';

/**
 * Script para inicializar o banco de dados de testes com todas as tabelas
 * 
 * Uso:
 *   DB_TYPE=mssql DB_HOST=seu-servidor DB_USERNAME=usuario DB_PASSWORD=senha DB_DATABASE=free-db-financeapp-2 npm run init:test-db
 * 
 * Ou após build:
 *   DB_TYPE=mssql DB_HOST=seu-servidor DB_USERNAME=usuario DB_PASSWORD=senha DB_DATABASE=free-db-financeapp-2 node apps/api/dist/database/init-test-database.js
 */

async function initTestDatabase() {
  console.log('🚀 Iniciando inicialização do banco de dados de testes...\n');

  // Verificar variáveis de ambiente obrigatórias
  if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
    console.error('❌ Erro: Variáveis de ambiente obrigatórias não definidas!');
    console.error('   Necessário: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE');
    console.error('\n   Exemplo:');
    console.error('   DB_TYPE=mssql DB_HOST=servidor.database.windows.net DB_USERNAME=usuario DB_PASSWORD=senha DB_DATABASE=free-db-financeapp-2 npm run init:test-db');
    process.exit(1);
  }

  // Criar ConfigService para usar DatabaseConfig
  const configService = new ConfigService({
    DB_TYPE: process.env.DB_TYPE || 'mssql',
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT || '1433',
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,
    NODE_ENV: 'production',
  });

  const databaseConfig = new DatabaseConfig(configService);
  const dbOptions = databaseConfig.createTypeOrmOptions();

  // Todas as entidades (ordem importa para relacionamentos)
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
    Proposal,
    ProposalAditivo,
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
    TaskComment,
  ];

  // Criar DataSource com synchronize: true para criar todas as tabelas
  // Fazer cast para any para evitar problemas de tipos entre TypeOrmModuleOptions e DataSourceOptions
  const dbOptionsAny = dbOptions as any;
  const dataSourceOptions: any = {
    type: dbOptionsAny.type,
    host: dbOptionsAny.host,
    port: dbOptionsAny.port,
    username: dbOptionsAny.username,
    password: dbOptionsAny.password,
    database: dbOptionsAny.database,
    entities: allEntities,
    synchronize: true, // ATENÇÃO: Apenas para inicialização do banco vazio
    logging: false, // Desabilitar logging para evitar queries ao master
    extra: {
      ...(dbOptionsAny.extra || {}),
      // Configurações específicas para Azure SQL Database
      options: {
        ...(dbOptionsAny.extra?.options || {}),
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        // Evitar queries ao master database
        database: dbOptionsAny.database,
      },
    },
    // Desabilitar verificação de múltiplos bancos (evita query ao master)
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
  
  const dataSource = new DataSource(dataSourceOptions);

  try {
    console.log('📡 Conectando ao banco de dados...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_DATABASE}`);
    console.log(`   Username: ${process.env.DB_USERNAME}\n`);
    
    await dataSource.initialize();
    console.log('✅ Conectado com sucesso!\n');

    console.log('📝 Criando todas as tabelas baseadas nas entidades...');
    // O synchronize: true já cria todas as tabelas automaticamente ao inicializar
    // Mas vamos forçar a sincronização
    await dataSource.synchronize();
    console.log('✅ Todas as tabelas criadas com sucesso!\n');

    // Verificar se as tabelas foram criadas
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.getTables();
    
    console.log(`📊 Total de tabelas criadas: ${tables.length}`);
    console.log('\n📋 Tabelas criadas:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.name}`);
    });

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✅ Inicialização do banco de dados concluída com sucesso!');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   1. O synchronize: true foi usado apenas para criar as tabelas');
    console.log('   2. Certifique-se de que synchronize: false no database.config.ts');
    console.log('   3. A API de testes executará as funções ensure* no onModuleInit para adicionar colunas extras');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro ao inicializar banco de dados:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initTestDatabase();
}

export { initTestDatabase };

