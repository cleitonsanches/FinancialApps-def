import { DataSource } from 'typeorm';
import { join } from 'path';

async function migrateClientsTable() {
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
        `SELECT name FROM sqlite_master WHERE type='table' AND name='clients'`
      );

      if (tableExists.length === 0) {
        console.log('➕ Criando tabela clients com estrutura completa...');
        await queryRunner.query(`
          CREATE TABLE "clients" (
            "id" varchar PRIMARY KEY NOT NULL,
            "company_id" varchar NOT NULL,
            "tipo_pessoa" varchar(1) NOT NULL,
            "razao_social" varchar(200),
            "nome_fantasia" varchar(200),
            "nome_completo" varchar(200),
            "cpf_cnpj" varchar(20) NOT NULL,
            "email_principal" varchar(200),
            "telefone_principal" varchar(30),
            "site" varchar(200),
            "logradouro" varchar(200),
            "numero" varchar(20),
            "complemento" varchar(100),
            "bairro" varchar(100),
            "cidade" varchar(100),
            "uf" varchar(2),
            "cep" varchar(15),
            "pais" varchar(100),
            "status" varchar(20) NOT NULL DEFAULT 'ATIVO',
            "data_cadastro" datetime NOT NULL DEFAULT (datetime('now')),
            "data_atualizacao" datetime
          )
        `);
        
        // Criar índice único para cpf_cnpj
        await queryRunner.query(`
          CREATE UNIQUE INDEX "IX_clients_cpf_cnpj" ON "clients" ("cpf_cnpj")
        `);
        
        console.log('✅ Tabela clients criada com estrutura completa');
        return;
      }

      console.log('🔄 Tabela clients existe. Verificando e ajustando estrutura...');

      // Verificar colunas existentes
      const tableInfo = await queryRunner.query(`PRAGMA table_info(clients)`);
      const existingColumns = tableInfo.map((col: any) => col.name);

      // Lista de colunas necessárias
      const columnsToAdd = [
        { name: 'tipo_pessoa', sql: 'varchar(1) NOT NULL DEFAULT "J"' },
        { name: 'nome_fantasia', sql: 'varchar(200)' },
        { name: 'nome_completo', sql: 'varchar(200)' },
        { name: 'site', sql: 'varchar(200)' },
        { name: 'logradouro', sql: 'varchar(200)' },
        { name: 'numero', sql: 'varchar(20)' },
        { name: 'complemento', sql: 'varchar(100)' },
        { name: 'bairro', sql: 'varchar(100)' },
        { name: 'cidade', sql: 'varchar(100)' },
        { name: 'uf', sql: 'varchar(2)' },
        { name: 'cep', sql: 'varchar(15)' },
        { name: 'pais', sql: 'varchar(100)' },
        { name: 'status', sql: 'varchar(20) NOT NULL DEFAULT "ATIVO"' },
      ];

      // Renomear colunas existentes se necessário
      if (existingColumns.includes('cnpj_cpf') && !existingColumns.includes('cpf_cnpj')) {
        console.log('🔄 Renomeando cnpj_cpf para cpf_cnpj...');
        await queryRunner.query(`ALTER TABLE clients ADD COLUMN cpf_cnpj varchar(20)`);
        await queryRunner.query(`UPDATE clients SET cpf_cnpj = cnpj_cpf WHERE cpf_cnpj IS NULL`);
        // Não podemos remover a coluna antiga no SQLite, mas podemos ignorá-la
        console.log('✅ Coluna renomeada (mantendo antiga para compatibilidade)');
      }

      if (existingColumns.includes('contact_email') && !existingColumns.includes('email_principal')) {
        console.log('🔄 Renomeando contact_email para email_principal...');
        await queryRunner.query(`ALTER TABLE clients ADD COLUMN email_principal varchar(200)`);
        await queryRunner.query(`UPDATE clients SET email_principal = contact_email WHERE email_principal IS NULL`);
        console.log('✅ Coluna renomeada');
      }

      if (existingColumns.includes('phone') && !existingColumns.includes('telefone_principal')) {
        console.log('🔄 Renomeando phone para telefone_principal...');
        await queryRunner.query(`ALTER TABLE clients ADD COLUMN telefone_principal varchar(30)`);
        await queryRunner.query(`UPDATE clients SET telefone_principal = phone WHERE telefone_principal IS NULL`);
        console.log('✅ Coluna renomeada');
      }

      // Atualizar lista de colunas após adicionar novas
      let currentColumns = existingColumns;

      if (existingColumns.includes('address') && !existingColumns.includes('logradouro')) {
        // Migrar address para logradouro (se houver dados)
        console.log('🔄 Migrando address para logradouro...');
        await queryRunner.query(`ALTER TABLE clients ADD COLUMN logradouro varchar(200)`);
        await queryRunner.query(`UPDATE clients SET logradouro = address WHERE logradouro IS NULL AND address IS NOT NULL`);
        currentColumns.push('logradouro');
        console.log('✅ Dados migrados');
      }

      // Adicionar novas colunas
      for (const column of columnsToAdd) {
        if (!currentColumns.includes(column.name)) {
          console.log(`➕ Adicionando coluna ${column.name}...`);
          await queryRunner.query(
            `ALTER TABLE clients ADD COLUMN ${column.name} ${column.sql}`
          );
          currentColumns.push(column.name);
          console.log(`✅ Coluna ${column.name} adicionada`);
        } else {
          console.log(`⚠️  Coluna ${column.name} já existe`);
        }
      }

      // Verificar se o índice único existe
      const indexes = await queryRunner.query(
        `SELECT name FROM sqlite_master WHERE type='index' AND name='IX_clients_cpf_cnpj'`
      );

      if (indexes.length === 0) {
        // Primeiro, garantir que não há valores NULL ou vazios
        await queryRunner.query(`
          UPDATE clients 
          SET cpf_cnpj = 'TEMP_' || id 
          WHERE cpf_cnpj IS NULL OR cpf_cnpj = ''
        `);

        // Verificar se há duplicatas em cpf_cnpj
        const duplicates = await queryRunner.query(`
          SELECT cpf_cnpj, COUNT(*) as count 
          FROM clients 
          WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != ''
          GROUP BY cpf_cnpj 
          HAVING COUNT(*) > 1
        `);

        if (duplicates.length > 0) {
          console.log(`⚠️  Encontradas ${duplicates.length} duplicatas em cpf_cnpj. Limpando...`);
          // Para cada duplicata, manter apenas o primeiro e limpar os outros
          for (const dup of duplicates) {
            const records = await queryRunner.query(
              `SELECT id FROM clients WHERE cpf_cnpj = ? ORDER BY data_cadastro ASC LIMIT 1`,
              [dup.cpf_cnpj]
            );
            if (records.length > 0) {
              const keepId = records[0].id;
              // Atualizar os outros para ter um valor único
              await queryRunner.query(
                `UPDATE clients SET cpf_cnpj = cpf_cnpj || '_' || id WHERE cpf_cnpj = ? AND id != ?`,
                [dup.cpf_cnpj, keepId]
              );
            }
          }
          console.log('✅ Duplicatas tratadas');
        }

        console.log('➕ Criando índice único para cpf_cnpj...');
        try {
          await queryRunner.query(`
            CREATE UNIQUE INDEX "IX_clients_cpf_cnpj" ON "clients" ("cpf_cnpj")
          `);
          console.log('✅ Índice único criado');
        } catch (error: any) {
          if (error.code === 'SQLITE_CONSTRAINT') {
            console.log('⚠️  Não foi possível criar índice único devido a duplicatas. Limpando dados...');
            // Limpar todos os cpf_cnpj duplicados
            await queryRunner.query(`
              UPDATE clients 
              SET cpf_cnpj = 'TEMP_' || id 
              WHERE cpf_cnpj IN (
                SELECT cpf_cnpj FROM clients 
                GROUP BY cpf_cnpj 
                HAVING COUNT(*) > 1
              )
            `);
            // Tentar criar novamente
            await queryRunner.query(`
              CREATE UNIQUE INDEX "IX_clients_cpf_cnpj" ON "clients" ("cpf_cnpj")
            `);
            console.log('✅ Índice único criado após limpeza');
          } else {
            throw error;
          }
        }
      } else {
        console.log('⚠️  Índice único já existe');
      }

      console.log('✅ Estrutura da tabela clients atualizada!');
    } catch (error) {
      console.error('❌ Erro ao migrar tabela:', error);
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

migrateClientsTable();

