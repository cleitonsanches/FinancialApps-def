import { DataSource } from 'typeorm';
import { join } from 'path';

async function createChartOfAccountsTable() {
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
        `SELECT name FROM sqlite_master WHERE type='table' AND name='chart_of_accounts'`
      );

      if (tableExists.length === 0) {
        console.log('➕ Criando tabela chart_of_accounts...');
        await queryRunner.query(`
          CREATE TABLE "chart_of_accounts" (
            "id" varchar PRIMARY KEY NOT NULL,
            "company_id" varchar NOT NULL,
            "code" varchar(50) NOT NULL,
            "name" varchar(200) NOT NULL,
            "type" varchar(20) NOT NULL,
            "center_cost" varchar(100),
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
          )
        `);
        console.log('✅ Tabela chart_of_accounts criada');
      } else {
        console.log('ℹ️  Tabela chart_of_accounts já existe');
      }

      console.log('✅ Estrutura da tabela chart_of_accounts verificada!');
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

createChartOfAccountsTable()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

