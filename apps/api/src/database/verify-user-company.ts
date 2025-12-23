import { DataSource } from 'typeorm';
import { join } from 'path';
import { Company } from './entities/company.entity';
import { User } from './entities/user.entity';

async function verifyUserCompany() {
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

    // Buscar empresa
    const company = await companyRepository.findOne({
      where: { cnpj: '60.298.793/0001-07' },
    });

    if (!company) {
      console.log('❌ Empresa não encontrada!');
      return;
    }

    console.log('\n📋 Empresa:');
    console.log(`   ID: ${company.id}`);
    console.log(`   Razão Social: ${company.razaoSocial}`);
    console.log(`   CNPJ: ${company.cnpj}`);

    // Buscar usuário admin
    const admin = await userRepository.findOne({
      where: { email: 'admin@financial.com' },
    });

    if (!admin) {
      console.log('\n❌ Usuário admin não encontrado!');
      return;
    }

    console.log('\n👤 Usuário Admin:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Nome: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Company ID: ${admin.companyId || 'NÃO VINCULADO'}`);

    if (admin.companyId === company.id) {
      console.log('\n✅ Usuário admin está vinculado à empresa!');
    } else if (admin.companyId) {
      console.log('\n⚠️  Usuário admin está vinculado a outra empresa!');
      console.log(`   Company ID do usuário: ${admin.companyId}`);
      console.log(`   Company ID esperado: ${company.id}`);
      console.log('\n🔄 Corrigindo vínculo...');
      admin.companyId = company.id;
      await userRepository.save(admin);
      console.log('✅ Vínculo corrigido!');
    } else {
      console.log('\n⚠️  Usuário admin NÃO está vinculado à empresa!');
      console.log('\n🔄 Vinculando usuário admin à empresa...');
      admin.companyId = company.id;
      await userRepository.save(admin);
      console.log('✅ Usuário admin vinculado à empresa!');
    }

    console.log('\n📋 Status final:');
    console.log(`   Usuário: ${admin.email}`);
    console.log(`   Empresa: ${company.razaoSocial}`);
    console.log(`   Vínculo: ${admin.companyId === company.id ? '✅ OK' : '❌ ERRO'}`);
  } catch (error) {
    console.error('❌ Erro ao verificar vínculo:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

verifyUserCompany();

