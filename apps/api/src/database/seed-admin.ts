import { DataSource } from 'typeorm';
import { join } from 'path';
import * as bcrypt from 'bcrypt';

// Importar entidades
import { User } from './entities/user.entity';
import { Company } from './entities/company.entity';
import { Client } from './entities/client.entity';
import { Contact } from './entities/contact.entity';

async function seedAdmin() {
  const databasePath = join(process.cwd(), 'database.sqlite');
  
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [User, Company, Client, Contact],
    synchronize: false,
    logging: true,
  });

  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('Banco de dados conectado!');

    const userRepository = dataSource.getRepository(User);
    const companyRepository = dataSource.getRepository(Company);

    // Verificar se já existe empresa padrão
    let company = await companyRepository.findOne({
      where: { cnpj: '00.000.000/0001-00' },
    });

    if (!company) {
      console.log('Criando empresa padrão...');
      company = companyRepository.create({
        id: '952cc139-6685-48a9-8596-cdffff550bc2',
        razaoSocial: 'Empresa Padrão',
        cnpj: '00.000.000/0001-00',
      });
      company = await companyRepository.save(company);
      console.log('Empresa criada com sucesso!');
    } else {
      console.log('Empresa padrão já existe.');
    }

    // Verificar se já existe usuário admin
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@financeapp.com' },
    });

    if (existingAdmin) {
      console.log('Usuário admin já existe. Atualizando senha...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.companyId = company.id;
      await userRepository.save(existingAdmin);
      console.log('Senha do admin atualizada!');
    } else {
      console.log('Criando usuário admin...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      const admin = userRepository.create({
        id: '007f405a-0fec-47bd-b267-e1f928485969',
        name: 'Administrador',
        email: 'admin@financeapp.com',
        passwordHash,
        companyId: company.id,
      });
      await userRepository.save(admin);
      console.log('Usuário admin criado com sucesso!');
    }

    // Criar outros usuários de exemplo
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
        console.log(`Criando usuário ${userData.name}...`);
        const passwordHash = await bcrypt.hash(userData.password, 10);
        const user = userRepository.create({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          passwordHash,
          companyId: company.id,
        });
        await userRepository.save(user);
        console.log(`Usuário ${userData.name} criado!`);
      } else {
        console.log(`Usuário ${userData.name} já existe.`);
      }
    }

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📋 Credenciais:');
    console.log('   Email: admin@financeapp.com');
    console.log('   Senha: admin123');
    console.log('\n   Email: user@financeapp.com');
    console.log('   Senha: user123');

    await dataSource.destroy();
  } catch (error) {
    console.error('Erro ao fazer seed:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAdmin();
}

export default seedAdmin;

