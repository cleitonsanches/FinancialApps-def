import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config/database.config';
import { User } from './entities/user.entity';
import { Company } from './entities/company.entity';

/**
 * Script para criar usuários iniciais no banco MSSQL (Azure SQL)
 * 
 * Uso:
 *   DB_TYPE=mssql DB_HOST=seu-servidor DB_USERNAME=usuario DB_PASSWORD=senha DB_DATABASE=free-db-financeapp npm run seed:admin:mssql
 * 
 * Ou após build:
 *   DB_TYPE=mssql DB_HOST=seu-servidor DB_USERNAME=usuario DB_PASSWORD=senha DB_DATABASE=free-db-financeapp node apps/api/dist/database/seed-admin-mssql.js
 */

async function seedAdminMssql() {
  console.log('🚀 Criando usuários iniciais no banco MSSQL...\n');

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
    entities: [User, Company],
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
    const companyRepository = dataSource.getRepository(Company);

    // Verificar se já existe empresa padrão
    let company = await companyRepository.findOne({
      where: { cnpj: '00.000.000/0001-00' },
    });

    if (!company) {
      console.log('📦 Criando empresa padrão...');
      company = companyRepository.create({
        id: '00000000-0000-0000-0000-000000000001',
        razaoSocial: 'FinanceApp',
        cnpj: '00.000.000/0001-00',
      });
      company = await companyRepository.save(company);
      console.log('✅ Empresa criada!\n');
    } else {
      console.log('✅ Empresa já existe\n');
    }

    // Criar usuário admin
    const adminEmail = 'admin@financeapp.com';
    let admin = await userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!admin) {
      console.log('👤 Criando usuário admin...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      admin = userRepository.create({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Administrador',
        email: adminEmail,
        passwordHash,
        companyId: company.id,
      });
      admin = await userRepository.save(admin);
      console.log('✅ Admin criado!\n');
    } else {
      console.log('✅ Admin já existe\n');
    }

    // Criar outros usuários
    const usersToCreate = [
      {
        id: '0a2d2260-e681-4969-865c-4616fa9ca51a',
        name: 'Usuário',
        email: 'user@financeapp.com',
        password: 'user123',
      },
      {
        id: '97da25e4-7792-4e58-bf2c-60bfe415f177',
        name: 'Cleiton Sanches',
        email: 'cleiton.sanches@financeapp.com',
        password: 'cleiton123',
      },
      {
        id: '33695dd2-7430-47f3-944b-d1e15e38a588',
        name: 'Wanessa Nehrer',
        email: 'wanessa.nehrer@financeapp.com',
        password: 'wanessa123',
      },
    ];

    for (const userData of usersToCreate) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        console.log(`👤 Criando usuário ${userData.name}...`);
        const passwordHash = await bcrypt.hash(userData.password, 10);
        const user = userRepository.create({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          passwordHash,
          companyId: company.id,
        });
        await userRepository.save(user);
        console.log(`✅ ${userData.name} criado!`);
      } else {
        console.log(`✅ ${userData.name} já existe`);
      }
    }

    await dataSource.destroy();

    console.log('\n✅ Usuários criados com sucesso!');
    console.log('\n📋 Credenciais para login:');
    console.log('   Email: admin@financeapp.com');
    console.log('   Senha: admin123');
    console.log('\n   Email: user@financeapp.com');
    console.log('   Senha: user123');
    console.log('\n   Email: cleiton.sanches@financeapp.com');
    console.log('   Senha: cleiton123');
    console.log('\n   Email: wanessa.nehrer@financeapp.com');
    console.log('   Senha: wanessa123');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro ao criar usuários:');
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
  seedAdminMssql();
}

export { seedAdminMssql };

