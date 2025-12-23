import { DataSource } from 'typeorm';
import { join } from 'path';

async function createProposalsTable() {
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
        `SELECT name FROM sqlite_master WHERE type='table' AND name='proposals'`
      );

      if (tableExists.length === 0) {
        console.log('➕ Criando tabela proposals...');
        await queryRunner.query(`
          CREATE TABLE "proposals" (
            "id" varchar PRIMARY KEY NOT NULL,
            "company_id" varchar NOT NULL,
            "client_id" varchar NOT NULL,
            "user_id" varchar NOT NULL,
            "numero_proposta" varchar(50) NOT NULL,
            "titulo" varchar(200),
            "valor_total" decimal(15,2),
            "data_proposta" datetime NOT NULL DEFAULT (datetime('now')),
            "data_validade" datetime,
            "status" varchar(30) NOT NULL DEFAULT 'RASCUNHO',
            "template_proposta_id" varchar
          )
        `);
        
        // Criar índice único para numero_proposta
        await queryRunner.query(`
          CREATE UNIQUE INDEX "IX_proposals_numero_proposta" ON "proposals" ("numero_proposta")
        `);
        
        console.log('✅ Tabela proposals criada com sucesso!');
      } else {
        console.log('⚠️  Tabela proposals já existe. Verificando estrutura...');
        
        // Verificar colunas existentes
        const tableInfo = await queryRunner.query(`PRAGMA table_info(proposals)`);
        const existingColumns = tableInfo.map((col: any) => col.name);
        
        console.log('Colunas existentes:', existingColumns);
        
        // Lista de colunas necessárias
        const columnsToAdd = [
          { name: 'company_id', sql: 'varchar NOT NULL' },
          { name: 'client_id', sql: 'varchar NOT NULL' },
          { name: 'user_id', sql: 'varchar NOT NULL' },
          { name: 'numero_proposta', sql: 'varchar(50) NOT NULL' },
          { name: 'titulo', sql: 'varchar(200)' },
          { name: 'valor_total', sql: 'decimal(15,2)' },
          { name: 'data_proposta', sql: 'datetime NOT NULL DEFAULT (datetime(\'now\'))' },
          { name: 'data_validade', sql: 'datetime' },
          { name: 'status', sql: 'varchar(30) NOT NULL DEFAULT \'RASCUNHO\'' },
          { name: 'template_proposta_id', sql: 'varchar' },
        ];

        // Adicionar colunas faltantes
        for (const column of columnsToAdd) {
          if (!existingColumns.includes(column.name)) {
            console.log(`➕ Adicionando coluna ${column.name}...`);
            try {
              // Para SQLite, não podemos adicionar DEFAULT não constante, então adicionamos sem DEFAULT
              const sqlWithoutDefault = column.sql.replace(/DEFAULT \(datetime\('now'\)\)/g, '');
              await queryRunner.query(
                `ALTER TABLE proposals ADD COLUMN ${column.name} ${sqlWithoutDefault}`
              );
              
              // Se for data_proposta, atualizar registros existentes
              if (column.name === 'data_proposta') {
                await queryRunner.query(`
                  UPDATE proposals SET data_proposta = datetime('now') WHERE data_proposta IS NULL
                `);
              }
              
              console.log(`✅ Coluna ${column.name} adicionada`);
            } catch (error: any) {
              if (error.code === 'SQLITE_ERROR' && error.message.includes('duplicate column')) {
                console.log(`⚠️  Coluna ${column.name} já existe`);
              } else {
                throw error;
              }
            }
          } else {
            console.log(`⚠️  Coluna ${column.name} já existe`);
          }
        }

        // Verificar se o índice único existe
        const indexes = await queryRunner.query(
          `SELECT name FROM sqlite_master WHERE type='index' AND name='IX_proposals_numero_proposta'`
        );

        if (indexes.length === 0) {
          console.log('➕ Criando índice único para numero_proposta...');
          // Verificar se há duplicatas antes de criar o índice
          const duplicates = await queryRunner.query(`
            SELECT numero_proposta, COUNT(*) as count 
            FROM proposals 
            WHERE numero_proposta IS NOT NULL AND numero_proposta != ''
            GROUP BY numero_proposta 
            HAVING COUNT(*) > 1
          `);

          if (duplicates.length > 0) {
            console.log(`⚠️  Encontradas ${duplicates.length} duplicatas em numero_proposta. Corrigindo...`);
            for (const dup of duplicates) {
              const records = await queryRunner.query(
                `SELECT id FROM proposals WHERE numero_proposta = ? ORDER BY data_proposta ASC LIMIT 1`,
                [dup.numero_proposta]
              );
              if (records.length > 0) {
                const keepId = records[0].id;
                await queryRunner.query(
                  `UPDATE proposals SET numero_proposta = numero_proposta || '_' || id WHERE numero_proposta = ? AND id != ?`,
                  [dup.numero_proposta, keepId]
                );
              }
            }
          }

          await queryRunner.query(`
            CREATE UNIQUE INDEX "IX_proposals_numero_proposta" ON "proposals" ("numero_proposta")
          `);
          console.log('✅ Índice único criado');
        } else {
          console.log('⚠️  Índice único já existe');
        }

        console.log('✅ Estrutura da tabela proposals verificada!');
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

createProposalsTable();

