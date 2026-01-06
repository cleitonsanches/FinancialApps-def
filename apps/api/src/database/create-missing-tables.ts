import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config/database.config';
// Importar entidades relacionadas também (TypeORM precisa delas para metadados)
import { ProjectTask } from './entities/project.entity';
import { User } from './entities/user.entity';
import { TaskComment } from './entities/task-comment.entity';
import { AccountPayable } from './entities/account-payable.entity';
import { AccountPayableHistory } from './entities/account-payable-history.entity';

/**
 * Script para criar apenas as tabelas faltantes (task_comments e account_payable_history)
 * 
 * Uso:
 *   DB_TYPE=mssql DB_HOST=seu-servidor DB_USERNAME=usuario DB_PASSWORD=senha DB_DATABASE=free-db-financeapp-2 npm run create:missing-tables
 * 
 * Ou após build:
 *   DB_TYPE=mssql DB_HOST=seu-servidor DB_USERNAME=usuario DB_PASSWORD=senha DB_DATABASE=free-db-financeapp-2 node apps/api/dist/database/create-missing-tables.js
 */

async function createMissingTables() {
  console.log('🚀 Criando tabelas faltantes...\n');

  // Verificar variáveis de ambiente obrigatórias
  if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
    console.error('❌ Erro: Variáveis de ambiente obrigatórias não definidas!');
    console.error('   Necessário: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE');
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

  // Entidades necessárias (incluindo relacionadas para TypeORM construir metadados)
  const entities = [
    User,           // Relacionado com TaskComment
    ProjectTask,    // Relacionado com TaskComment
    AccountPayable,  // Relacionado com AccountPayableHistory
    TaskComment,    // Tabela que queremos criar
    AccountPayableHistory, // Tabela que queremos criar
  ];

  // Criar DataSource
  const dbOptionsAny = dbOptions as any;
  const dataSourceOptions: any = {
    type: dbOptionsAny.type,
    host: dbOptionsAny.host,
    port: dbOptionsAny.port,
    username: dbOptionsAny.username,
    password: dbOptionsAny.password,
    database: dbOptionsAny.database,
    entities: entities,
    synchronize: true, // Criar apenas essas duas tabelas
    logging: false,
    extra: {
      ...(dbOptionsAny.extra || {}),
      options: {
        ...(dbOptionsAny.extra?.options || {}),
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        database: dbOptionsAny.database,
      },
    },
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

    console.log('📝 Criando tabelas faltantes...');
    await dataSource.synchronize();
    console.log('✅ Tabelas criadas!\n');

    // Verificar se as tabelas foram criadas
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.getTables();
    const tableNames = tables.map(t => t.name);
    
    const targetTables = ['task_comments', 'account_payable_history'];
    const foundTables = targetTables.filter(name => tableNames.includes(name));
    
    console.log('📊 Tabelas encontradas:');
    foundTables.forEach(name => {
      console.log(`   ✅ ${name}`);
    });
    
    const missingTables = targetTables.filter(name => !tableNames.includes(name));
    if (missingTables.length > 0) {
      console.log('\n⚠️  Tabelas ainda faltando:');
      missingTables.forEach(name => {
        console.log(`   ❌ ${name}`);
      });
    } else {
      console.log('\n✅ Todas as tabelas foram criadas com sucesso!');
    }

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✅ Concluído!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro ao criar tabelas:');
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
  createMissingTables();
}

export { createMissingTables };

