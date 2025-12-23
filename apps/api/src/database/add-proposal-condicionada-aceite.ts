import { DataSource } from 'typeorm';
import { join } from 'path';

async function addProposalCondicionadaAceite() {
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
      // Verificar se a coluna já existe
      const tableInfo = await queryRunner.query(`PRAGMA table_info(proposals)`);
      const existingColumns = tableInfo.map((col: any) => col.name);
      
      console.log('Colunas existentes:', existingColumns);

      if (!existingColumns.includes('data_condicionada_aceite')) {
        console.log('➕ Adicionando coluna data_condicionada_aceite...');
        await queryRunner.query(`
          ALTER TABLE proposals ADD COLUMN data_condicionada_aceite date
        `);
        console.log('✅ Coluna data_condicionada_aceite adicionada com sucesso!');
      } else {
        console.log('ℹ️  Coluna data_condicionada_aceite já existe');
      }
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

addProposalCondicionadaAceite()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

