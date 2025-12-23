import { DataSource } from 'typeorm';
import { join } from 'path';

async function fixContactsTable() {
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
      // Verificar estrutura atual da tabela
      const tableInfo = await queryRunner.query(`PRAGMA table_info(contacts)`);
      const existingColumns = tableInfo.map((col: any) => col.name);

      console.log('Colunas existentes:', existingColumns);

      // Adicionar created_at se não existir
      if (!existingColumns.includes('created_at')) {
        console.log('➕ Adicionando coluna created_at...');
        await queryRunner.query(`
          ALTER TABLE contacts ADD COLUMN created_at datetime
        `);
        await queryRunner.query(`
          UPDATE contacts SET created_at = datetime('now') WHERE created_at IS NULL
        `);
        console.log('✅ Coluna created_at adicionada');
      } else {
        console.log('⚠️  Coluna created_at já existe');
      }

      // Adicionar updated_at se não existir
      if (!existingColumns.includes('updated_at')) {
        console.log('➕ Adicionando coluna updated_at...');
        await queryRunner.query(`
          ALTER TABLE contacts ADD COLUMN updated_at datetime
        `);
        console.log('✅ Coluna updated_at adicionada');
      } else {
        console.log('⚠️  Coluna updated_at já existe');
      }

      // Verificar se company_id existe
      if (!existingColumns.includes('company_id')) {
        console.log('➕ Adicionando coluna company_id...');
        await queryRunner.query(`
          ALTER TABLE contacts ADD COLUMN company_id varchar
        `);
        
        // Atualizar registros existentes com a primeira empresa
        const companies = await queryRunner.query(`SELECT id FROM companies LIMIT 1`);
        if (companies.length > 0) {
          await queryRunner.query(
            `UPDATE contacts SET company_id = ? WHERE company_id IS NULL OR company_id = ''`,
            [companies[0].id]
          );
        }
        console.log('✅ Coluna company_id adicionada');
      } else {
        console.log('⚠️  Coluna company_id já existe');
      }

      console.log('✅ Estrutura da tabela contacts atualizada!');
    } catch (error) {
      console.error('❌ Erro ao atualizar tabela:', error);
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

fixContactsTable();

