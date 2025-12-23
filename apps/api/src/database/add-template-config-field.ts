import { DataSource } from 'typeorm';
import { join } from 'path';

async function addTemplateConfigField() {
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
      // Verificar se a tabela existe
      const tableExists = await queryRunner.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='proposal_templates'`
      );

      if (tableExists.length === 0) {
        console.log('⚠️  Tabela proposal_templates não existe. Execute primeiro a criação da tabela.');
        return;
      }

      console.log('🔍 Verificando colunas existentes...');
      const tableInfo = await queryRunner.query(`PRAGMA table_info(proposal_templates)`);
      const existingColumns = tableInfo.map((col: any) => col.name);
      console.log('Colunas existentes:', existingColumns);

      // Adicionar campo configuracao_campos se não existir
      if (!existingColumns.includes('configuracao_campos')) {
        console.log('➕ Adicionando coluna configuracao_campos...');
        await queryRunner.query(
          `ALTER TABLE proposal_templates ADD COLUMN configuracao_campos text`
        );
        console.log('✅ Coluna configuracao_campos adicionada com sucesso!');
      } else {
        console.log('⚠️  Coluna configuracao_campos já existe. Pulando...');
      }

      console.log('✅ Migração concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao executar migração:', error);
      throw error;
    } finally {
      await queryRunner.release();
      await dataSource.destroy();
    }
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

addTemplateConfigField();

