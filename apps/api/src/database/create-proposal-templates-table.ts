import { DataSource } from 'typeorm';
import { join } from 'path';

async function createProposalTemplatesTable() {
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
        `SELECT name FROM sqlite_master WHERE type='table' AND name='proposal_templates'`
      );

      if (tableExists.length === 0) {
        console.log('➕ Criando tabela proposal_templates...');
        await queryRunner.query(`
          CREATE TABLE "proposal_templates" (
            "id" varchar PRIMARY KEY NOT NULL,
            "company_id" varchar NOT NULL,
            "nome" varchar(200) NOT NULL,
            "tipo_servico" varchar(50) NOT NULL,
            "descricao" text,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime
          )
        `);
        
        console.log('✅ Tabela proposal_templates criada com sucesso!');
        console.log('\n📋 Estrutura básica criada. Campos específicos serão adicionados conforme necessário.');
      } else {
        console.log('⚠️  Tabela proposal_templates já existe. Verificando estrutura...');
        
        // Verificar colunas existentes
        const tableInfo = await queryRunner.query(`PRAGMA table_info(proposal_templates)`);
        const existingColumns = tableInfo.map((col: any) => col.name);
        
        console.log('Colunas existentes:', existingColumns);
        
        // Adicionar colunas básicas se não existirem
        const basicColumns = [
          { name: 'company_id', sql: 'varchar NOT NULL' },
          { name: 'nome', sql: 'varchar(200) NOT NULL' },
          { name: 'tipo_servico', sql: 'varchar(50) NOT NULL' },
          { name: 'descricao', sql: 'text' },
          { name: 'created_at', sql: 'datetime' },
          { name: 'updated_at', sql: 'datetime' },
        ];

        for (const column of basicColumns) {
          if (!existingColumns.includes(column.name)) {
            console.log(`➕ Adicionando coluna ${column.name}...`);
            const sqlWithoutDefault = column.sql.replace(/DEFAULT \(datetime\('now'\)\)/g, '');
            await queryRunner.query(
              `ALTER TABLE proposal_templates ADD COLUMN ${column.name} ${sqlWithoutDefault}`
            );
            
            if (column.name === 'created_at') {
              await queryRunner.query(`
                UPDATE proposal_templates SET created_at = datetime('now') WHERE created_at IS NULL
              `);
            }
            
            console.log(`✅ Coluna ${column.name} adicionada`);
          }
        }

        console.log('✅ Estrutura da tabela proposal_templates verificada!');
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

createProposalTemplatesTable();

