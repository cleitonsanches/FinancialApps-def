import { DataSource } from 'typeorm';
import { join } from 'path';

async function addUserFields() {
  const databasePath = join(process.cwd(), 'database.sqlite');

  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: true,
  });

  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('Banco de dados conectado!');

    const queryRunner = dataSource.createQueryRunner();

    // Verificar se as colunas já existem
    const table = await queryRunner.getTable('users');
    const hasContactId = table?.findColumnByName('contact_id');
    const hasIsAdmin = table?.findColumnByName('is_admin');
    const hasIsActive = table?.findColumnByName('is_active');

    if (!hasContactId) {
      console.log('Adicionando coluna contact_id...');
      await queryRunner.query(`
        ALTER TABLE users ADD COLUMN contact_id VARCHAR(36);
      `);
      console.log('Coluna contact_id adicionada!');
    } else {
      console.log('Coluna contact_id já existe.');
    }

    if (!hasIsAdmin) {
      console.log('Adicionando coluna is_admin...');
      await queryRunner.query(`
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;
      `);
      console.log('Coluna is_admin adicionada!');
    } else {
      console.log('Coluna is_admin já existe.');
    }

    if (!hasIsActive) {
      console.log('Adicionando coluna is_active...');
      await queryRunner.query(`
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;
      `);
      console.log('Coluna is_active adicionada!');
    } else {
      console.log('Coluna is_active já existe.');
    }

    await queryRunner.release();
    console.log('\n✅ Migration concluída com sucesso!\n');

  } catch (error) {
    console.error('Erro ao executar migration:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Conexão fechada.');
  }
}

if (require.main === module) {
  addUserFields();
}

