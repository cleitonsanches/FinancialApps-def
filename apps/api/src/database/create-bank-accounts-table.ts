import { DataSource } from 'typeorm';
import { join } from 'path';

async function createBankAccountsTable() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: join(__dirname, '../../dev.db'),
    entities: [],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Conectado ao banco de dados');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Verificar se a tabela já existe
      const tableExists = await queryRunner.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='bank_accounts'`
      );

      if (tableExists.length === 0) {
        console.log('➕ Criando tabela bank_accounts...');
        await queryRunner.query(`
          CREATE TABLE "bank_accounts" (
            "id" varchar PRIMARY KEY NOT NULL,
            "company_id" varchar NOT NULL,
            "bank_name" varchar(200) NOT NULL,
            "agency" varchar(20),
            "account_number" varchar(50) NOT NULL,
            "account_type" varchar(20),
            "balance" decimal(15,2) NOT NULL DEFAULT 0,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
          )
        `);
        console.log('✅ Tabela bank_accounts criada');
      } else {
        console.log('ℹ️  Tabela bank_accounts já existe');
      }

      console.log('✅ Estrutura da tabela bank_accounts verificada!');
    } catch (error) {
      console.error('❌ Erro ao criar tabela:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

createBankAccountsTable()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

