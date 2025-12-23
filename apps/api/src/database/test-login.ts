import { DataSource } from 'typeorm';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Company } from './entities/company.entity';

async function testLogin() {
  const databasePath = join(process.cwd(), 'database.sqlite');
  
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [User, Company],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    const userRepository = dataSource.getRepository(User);

    const testEmails = [
      'admin@financeapp.com',
      'user@financeapp.com',
      'cleiton.sanches@financeapp.com',
      'wanessa.nehrer@financeapp.com',
    ];

    const testPasswords = {
      'admin@financeapp.com': 'admin123',
      'user@financeapp.com': 'user123',
      'cleiton.sanches@financeapp.com': 'cleiton123',
      'wanessa.nehrer@financeapp.com': 'wanessa123',
    };

    for (const email of testEmails) {
      console.log(`\n=== Testando ${email} ===`);
      const user = await userRepository.findOne({
        where: { email },
      });

      if (!user) {
        console.log(`❌ Usuário não encontrado`);
        continue;
      }

      console.log(`✅ Usuário encontrado: ${user.name}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password Hash: ${user.passwordHash.substring(0, 20)}...`);

      const password = testPasswords[email];
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log(`   Senha "${password}" é válida: ${isValid ? '✅ SIM' : '❌ NÃO'}`);
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testLogin();
}

export default testLogin;

