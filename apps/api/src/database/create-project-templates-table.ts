import { DataSource } from 'typeorm';
import { join } from 'path';

async function createProjectTemplatesTable() {
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
        `SELECT name FROM sqlite_master WHERE type='table' AND name='project_templates'`
      );

      if (tableExists.length === 0) {
        console.log('➕ Criando tabela project_templates...');
        await queryRunner.query(`
          CREATE TABLE "project_templates" (
            "id" varchar PRIMARY KEY NOT NULL,
            "company_id" varchar NOT NULL,
            "name" varchar(200) NOT NULL,
            "service_type" varchar(50) NOT NULL,
            "description" text,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime
          )
        `);
        
        console.log('✅ Tabela project_templates criada com sucesso!');
      } else {
        console.log('ℹ️  Tabela project_templates já existe');
        
        // Verificar colunas existentes
        const tableInfo = await queryRunner.query(`PRAGMA table_info(project_templates)`);
        const existingColumns = tableInfo.map((col: any) => col.name);
        
        console.log('Colunas existentes:', existingColumns);
        
        // Adicionar colunas básicas se não existirem
        const basicColumns = [
          { name: 'company_id', sql: 'varchar NOT NULL' },
          { name: 'name', sql: 'varchar(200) NOT NULL' },
          { name: 'service_type', sql: 'varchar(50) NOT NULL' },
          { name: 'description', sql: 'text' },
          { name: 'created_at', sql: 'datetime' },
          { name: 'updated_at', sql: 'datetime' },
        ];

        for (const column of basicColumns) {
          if (!existingColumns.includes(column.name)) {
            console.log(`➕ Adicionando coluna ${column.name}...`);
            const sqlWithoutDefault = column.sql.replace(/DEFAULT \(datetime\('now'\)\)/g, '');
            await queryRunner.query(
              `ALTER TABLE project_templates ADD COLUMN ${column.name} ${sqlWithoutDefault}`
            );
            
            if (column.name === 'created_at') {
              await queryRunner.query(`
                UPDATE project_templates SET created_at = datetime('now') WHERE created_at IS NULL
              `);
            }
            
            console.log(`✅ Coluna ${column.name} adicionada`);
          }
        }

        console.log('✅ Estrutura da tabela project_templates verificada!');
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

createProjectTemplatesTable()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

