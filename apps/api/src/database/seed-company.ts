import { DataSource } from 'typeorm';
import { join } from 'path';
import { Company } from './entities/company.entity';
import { User } from './entities/user.entity';

async function seedCompany() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: join(__dirname, '../../dev.db'),
    entities: [Company, User],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Conectado ao banco de dados');

    const companyRepository = dataSource.getRepository(Company);
    const userRepository = dataSource.getRepository(User);

    // Verificar se a empresa já existe
    let company = await companyRepository.findOne({
      where: { cnpj: '60.298.793/0001-07' },
    });

    if (company) {
      console.log('⚠️  Empresa já existe. Atualizando...');
      company.razaoSocial = 'Precision Dados e Soluções';
      company.cnpj = '60.298.793/0001-07';
      await companyRepository.save(company);
      console.log('✅ Empresa atualizada com sucesso!');
    } else {
      console.log('➕ Criando empresa...');
      company = companyRepository.create({
        razaoSocial: 'Precision Dados e Soluções',
        cnpj: '60.298.793/0001-07',
      });

      company = await companyRepository.save(company);
      console.log('✅ Empresa criada com sucesso!');
    }

    // Vincular o usuário admin à empresa
    const admin = await userRepository.findOne({
      where: { email: 'admin@financial.com' },
    });

    if (admin) {
      console.log('🔗 Vinculando usuário admin à empresa...');
      admin.companyId = company.id;
      await userRepository.save(admin);
      console.log('✅ Usuário admin vinculado à empresa!');
    } else {
      console.log('⚠️  Usuário admin não encontrado. Execute primeiro: npm run db:seed-admin');
    }

    console.log('\n📋 Empresa cadastrada:');
    console.log(`   ID: ${company.id}`);
    console.log(`   Razão Social: ${company.razaoSocial}`);
    console.log(`   CNPJ: ${company.cnpj}`);
  } catch (error) {
    console.error('❌ Erro ao cadastrar empresa:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seedCompany();

