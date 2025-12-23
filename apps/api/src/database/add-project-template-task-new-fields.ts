import { DataSource } from 'typeorm';
import { join } from 'path';

async function addProjectTemplateTaskNewFields() {
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

      const columnsToAdd = [
        { name: 'tarefa_anterior_id', sql: 'varchar' },
        { name: 'responsavel_id', sql: 'varchar' },
        { name: 'executor_id', sql: 'varchar' },
        { name: 'executor_tipo', sql: 'varchar(20)' },
      ];

      for (const column of columnsToAdd) {
        if (!existingColumns.includes(column.name)) {
          console.log(`➕ Adicionando coluna ${column.name}...`);
          await queryRunner.query(
            `ALTER TABLE project_template_tasks ADD COLUMN ${column.name} ${column.sql}`
          );
          console.log(`✅ Coluna ${column.name} adicionada`);
        } else {
          console.log(`ℹ️  Coluna ${column.name} já existe`);
        }
      }

      console.log('✅ Estrutura da tabela project_template_tasks verificada!');
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

addProjectTemplateTaskNewFields()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

