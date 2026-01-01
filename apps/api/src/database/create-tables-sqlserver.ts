import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

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

async function createTablesSQLServer() {
  console.log('🚀 Iniciando criação de tabelas no SQL Server (Azure)...\n');

  // Carregar variáveis de ambiente do .env.local
  // O script pode ser executado de apps/api, então precisamos subir para a raiz do projeto
  const projectRoot = join(__dirname, '../../../../');
  const envLocalPath = join(projectRoot, '.env.local');
  const envPath = join(projectRoot, '.env');
  
  // Tenta primeiro .env.local, depois .env
  dotenv.config({ path: envLocalPath });
  
  // Se .env.local não existe ou não carregou DB_TYPE, tenta .env
  if (!process.env.DB_TYPE) {
    dotenv.config({ path: envPath });
  }

  // Verificar se está usando SQL Server
  const dbType = process.env.DB_TYPE || 'sqlite';
  if (dbType !== 'mssql') {
    console.error('❌ Este script é apenas para SQL Server (mssql)!');
    console.error(`⚠️  DB_TYPE atual: ${dbType}`);
    console.error('💡 Configure DB_TYPE=mssql no .env.local');
    process.exit(1);
  }

  // Validar variáveis de ambiente necessárias
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('💡 Configure todas as variáveis no .env.local');
    process.exit(1);
  }

  console.log('📋 Configuração do banco:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_DATABASE}`);
  console.log(`   Username: ${process.env.DB_USERNAME}`);
  console.log('');

  // Lista de todas as entidades na ordem correta (respeitando dependências)
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
    ProjectTemplatePhase,
    ProjectTemplateTask,
    Proposal, // Deve vir antes de ProposalAditivo
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
  ];

  console.log(`📦 Carregadas ${allEntities.length} entidades\n`);

  // Criar DataSource para SQL Server
  const dataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '1433'),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    entities: allEntities,
    synchronize: true, // Cria/atualiza tabelas baseado nas entidades
    logging: true, // Mostra queries SQL executadas
    extra: {
      encrypt: true, // Necessário para Azure SQL Database
      trustServerCertificate: false, // Valida certificado SSL
    },
  });

  try {
    console.log('🔌 Conectando ao SQL Server...');
    await dataSource.initialize();
    console.log('✅ Conectado ao SQL Server com sucesso!\n');

    console.log('📊 Criando/atualizando tabelas no banco de dados...');
    console.log('⚠️  Usando synchronize: true - isso criará todas as tabelas baseado nas entidades\n');

    // O synchronize: true já cria as tabelas ao inicializar
    // Mas podemos forçar a sincronização explícita
    await dataSource.synchronize();

    console.log('\n✅ Tabelas criadas/atualizadas com sucesso!\n');

    // Listar tabelas criadas
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log(`📋 Total de ${tables.length} tabelas no banco:`);
    tables.forEach((table: any, index: number) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
    });

    await queryRunner.release();
    await dataSource.destroy();
    
    console.log('\n✅ Processo concluído com sucesso!');
    console.log('📦 Próximo passo: Importar os dados dos arquivos CSV');
  } catch (error: any) {
    console.error('\n❌ Erro ao criar tabelas:', error.message);
    
    if (error.message?.includes('connect')) {
      console.error('\n💡 Dicas:');
      console.error('   - Verifique se o firewall do Azure permite conexões do seu IP');
      console.error('   - Confirme se as credenciais no .env.local estão corretas');
      console.error('   - Teste a conexão no SSMS primeiro');
    }
    
    if (error.message?.includes('database') || error.message?.includes('not found')) {
      console.error('\n💡 Dicas:');
      console.error('   - Verifique se o nome do banco está correto');
      console.error('   - Confirme se o banco foi criado no Azure');
    }
    
    console.error('\nDetalhes do erro:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTablesSQLServer()
    .then(() => {
      console.log('\n✅ Script finalizado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro fatal:', error);
      process.exit(1);
    });
}

export default createTablesSQLServer;

