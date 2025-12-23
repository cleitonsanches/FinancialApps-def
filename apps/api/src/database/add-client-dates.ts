import { DataSource } from 'typeorm';
import { join } from 'path';

async function addClientDates() {
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
      // Verificar se as colunas já existem
      const tableInfo = await queryRunner.query(`PRAGMA table_info(clients)`);
      const existingColumns = tableInfo.map((col: any) => col.name);

      // Adicionar data_cadastro se não existir
      if (!existingColumns.includes('data_cadastro')) {
        console.log('➕ Adicionando coluna data_cadastro...');
        // SQLite não permite DEFAULT não constante, então adicionamos sem DEFAULT
        await queryRunner.query(`
          ALTER TABLE clients ADD COLUMN data_cadastro datetime
        `);
        // Atualizar registros existentes com a data atual
        await queryRunner.query(`
          UPDATE clients SET data_cadastro = datetime('now') WHERE data_cadastro IS NULL
        `);
        console.log('✅ Coluna data_cadastro adicionada');
      } else {
        console.log('⚠️  Coluna data_cadastro já existe');
      }

      // Adicionar data_atualizacao se não existir
      if (!existingColumns.includes('data_atualizacao')) {
        console.log('➕ Adicionando coluna data_atualizacao...');
        await queryRunner.query(`
          ALTER TABLE clients ADD COLUMN data_atualizacao datetime
        `);
        console.log('✅ Coluna data_atualizacao adicionada');
      } else {
        console.log('⚠️  Coluna data_atualizacao já existe');
      }

      console.log('✅ Estrutura da tabela clients atualizada!');
    } catch (error) {
      console.error('❌ Erro ao adicionar colunas:', error);
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

addClientDates();

