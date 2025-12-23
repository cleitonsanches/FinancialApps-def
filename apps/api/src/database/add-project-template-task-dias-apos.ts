import { DataSource } from 'typeorm';
import { join } from 'path';

async function addProjectTemplateTaskDiasApos() {
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
      const tableInfo = await queryRunner.query(`PRAGMA table_info(project_template_tasks)`);
      const existingColumns = tableInfo.map((col: any) => col.name);
      
      console.log('Colunas existentes:', existingColumns);

      if (!existingColumns.includes('dias_apos_tarefa_anterior')) {
        console.log('➕ Adicionando coluna dias_apos_tarefa_anterior...');
        await queryRunner.query(
          `ALTER TABLE project_template_tasks ADD COLUMN dias_apos_tarefa_anterior integer`
        );
        console.log('✅ Coluna dias_apos_tarefa_anterior adicionada');
      } else {
        console.log('ℹ️  Coluna dias_apos_tarefa_anterior já existe');
      }

      console.log('✅ Estrutura da tabela project_template_tasks verificada!');
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

addProjectTemplateTaskDiasApos()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

