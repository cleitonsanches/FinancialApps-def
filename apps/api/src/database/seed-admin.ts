import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { join } from 'path';
import { User } from './entities/user.entity';
import { Company } from './entities/company.entity';

async function seedAdmin() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: join(__dirname, '../../dev.db'),
    entities: [User, Company],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Conectado ao banco de dados');

    const userRepository = dataSource.getRepository(User);

    // Verificar se o admin já existe
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@financial.com' },
    });

    if (existingAdmin) {
      console.log('⚠️  Usuário admin já existe. Atualizando senha...');
      
      // Gerar hash da senha
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      // Atualizar senha
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.name = 'Administrador';
      existingAdmin.isAdmin = true;
      
      await userRepository.save(existingAdmin);
      console.log('✅ Senha do admin atualizada com sucesso!');
    } else {
      console.log('➕ Criando usuário admin...');
      
      // Gerar hash da senha
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const admin = userRepository.create({
        name: 'Administrador',
        email: 'admin@financial.com',
        passwordHash: passwordHash,
        isAdmin: true,
        companyId: null,
      });

      await userRepository.save(admin);
      console.log('✅ Usuário admin criado com sucesso!');
    }

    console.log('\n📋 Credenciais:');
    console.log('   Email: admin@financial.com');
    console.log('   Senha: admin123');
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seedAdmin();

