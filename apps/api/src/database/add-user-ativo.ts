import { DataSource } from 'typeorm';
import { join } from 'path';

async function addUserAtivo() {
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

      if (!existingColumns.includes('ativo')) {
        console.log('➕ Adicionando coluna ativo...');
        await queryRunner.query(
          `ALTER TABLE users ADD COLUMN ativo integer DEFAULT 1`
        );
        console.log('✅ Coluna ativo adicionada');
      } else {
        console.log('ℹ️  Coluna ativo já existe');
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

addUserAtivo()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

