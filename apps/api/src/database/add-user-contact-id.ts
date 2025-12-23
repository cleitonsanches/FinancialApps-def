import { DataSource } from 'typeorm';
import { join } from 'path';

async function addUserContactId() {
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
      // Verificar colunas existentes
      const tableInfo = await queryRunner.query(`PRAGMA table_info(users)`);
      const existingColumns = tableInfo.map((col: any) => col.name);
      
      console.log('Colunas existentes:', existingColumns);

      if (!existingColumns.includes('contact_id')) {
        console.log('➕ Adicionando coluna contact_id...');
        await queryRunner.query(
          `ALTER TABLE users ADD COLUMN contact_id varchar`
        );
        console.log('✅ Coluna contact_id adicionada');
      } else {
        console.log('ℹ️  Coluna contact_id já existe');
      }

      console.log('✅ Estrutura da tabela users verificada!');
    } catch (error) {
      console.error('❌ Erro ao adicionar coluna:', error);
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

addUserContactId()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

