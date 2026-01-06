import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config/database.config';
import { User } from './entities/user.entity';

/**
 * Script para verificar se usuários existem no banco
 * 
 * Uso:
 *   DB_TYPE=mssql DB_HOST=seu-servidor DB_USERNAME=usuario DB_PASSWORD=senha DB_DATABASE=free-db-financeapp npm run check:users
 * 
 * Ou após build:
 *   DB_TYPE=mssql DB_HOST=seu-servidor DB_USERNAME=usuario DB_PASSWORD=senha DB_DATABASE=free-db-financeapp node apps/api/dist/database/check-users.js
 */

async function checkUsers() {
  console.log('🔍 Verificando usuários no banco de dados...\n');

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

  const dbOptionsAny = dbOptions as any;
  const dataSourceOptions: any = {
    type: dbOptionsAny.type,
    host: dbOptionsAny.host,
    port: dbOptionsAny.port,
    username: dbOptionsAny.username,
    password: dbOptionsAny.password,
    database: dbOptionsAny.database,
    entities: [User],
    synchronize: false,
    logging: false,
    extra: {
      ...(dbOptionsAny.extra || {}),
      options: {
        ...(dbOptionsAny.extra?.options || {}),
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
      },
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

    const userRepository = dataSource.getRepository(User);
    
    // Buscar todos os usuários
    console.log('📋 Buscando usuários no banco...');
    const users = await userRepository.find({
      select: ['id', 'name', 'email', 'companyId'],
    });

    console.log(`\n📊 Total de usuários encontrados: ${users.length}\n`);

    if (users.length > 0) {
      console.log('👥 Usuários encontrados:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      });
      
      // Verificar usuários específicos
      console.log('\n🔍 Verificando usuários específicos:');
      const testEmails = [
        'admin@financeapp.com',
        'cleiton.sanches@financeapp.com',
        'user@financeapp.com',
        'wanessa.nehrer@financeapp.com'
      ];
      
      for (const email of testEmails) {
        const user = await userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'companyId'],
        });
        
        if (user) {
          console.log(`   ✅ ${email} - ENCONTRADO (${user.name})`);
        } else {
          console.log(`   ❌ ${email} - NÃO ENCONTRADO`);
        }
      }
    } else {
      console.log('⚠️  NENHUM usuário encontrado no banco!');
      console.log('   Isso explica o erro de autenticação.');
    }

    await dataSource.destroy();

    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro ao verificar usuários:');
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
  checkUsers();
}

export { checkUsers };

