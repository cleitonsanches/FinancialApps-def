import { DataSource } from 'typeorm';
import { join } from 'path';

async function createProjectTemplateTasksTable() {
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
        `SELECT name FROM sqlite_master WHERE type='table' AND name='project_template_tasks'`
      );

      if (tableExists.length === 0) {
        console.log('➕ Criando tabela project_template_tasks...');
        await queryRunner.query(`
          CREATE TABLE "project_template_tasks" (
            "id" varchar PRIMARY KEY NOT NULL,
            "template_id" varchar NOT NULL,
            "name" varchar(200) NOT NULL,
            "description" text,
            "horas_estimadas" varchar(10),
            "ordem" integer NOT NULL DEFAULT 0,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime
          )
        `);
        
        console.log('✅ Tabela project_template_tasks criada com sucesso!');
      } else {
        console.log('ℹ️  Tabela project_template_tasks já existe');
        
        // Verificar colunas existentes
        const tableInfo = await queryRunner.query(`PRAGMA table_info(project_template_tasks)`);
        const existingColumns = tableInfo.map((col: any) => col.name);
        
        console.log('Colunas existentes:', existingColumns);
        
        // Adicionar colunas básicas se não existirem
        const basicColumns = [
          { name: 'template_id', sql: 'varchar NOT NULL' },
          { name: 'name', sql: 'varchar(200) NOT NULL' },
          { name: 'description', sql: 'text' },
          { name: 'horas_estimadas', sql: 'varchar(10)' },
          { name: 'ordem', sql: 'integer NOT NULL DEFAULT 0' },
          { name: 'created_at', sql: 'datetime' },
          { name: 'updated_at', sql: 'datetime' },
        ];

        for (const column of basicColumns) {
          if (!existingColumns.includes(column.name)) {
            console.log(`➕ Adicionando coluna ${column.name}...`);
            const sqlWithoutDefault = column.sql.replace(/DEFAULT \d+/g, '');
            await queryRunner.query(
              `ALTER TABLE project_template_tasks ADD COLUMN ${column.name} ${sqlWithoutDefault}`
            );
            
            if (column.name === 'ordem' && !existingColumns.includes('ordem')) {
              await queryRunner.query(`
                UPDATE project_template_tasks SET ordem = 0 WHERE ordem IS NULL
              `);
            }
            
            console.log(`✅ Coluna ${column.name} adicionada`);
          }
        }

        console.log('✅ Estrutura da tabela project_template_tasks verificada!');
      }
    } catch (error) {
      console.error('❌ Erro ao criar/atualizar tabela:', error);
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

createProjectTemplateTasksTable()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

