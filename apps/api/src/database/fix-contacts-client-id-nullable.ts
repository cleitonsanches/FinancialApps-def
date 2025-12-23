import { DataSource } from 'typeorm';
import { join } from 'path';

async function fixContactsClientIdNullable() {
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
      // Verificar estrutura atual da tabela
      const tableInfo = await queryRunner.query(`PRAGMA table_info(contacts)`);
      console.log('Estrutura atual da tabela contacts:', tableInfo);

      // SQLite não suporta ALTER COLUMN diretamente, então precisamos:
      // 1. Criar nova tabela com a estrutura correta
      // 2. Copiar dados
      // 3. Dropar tabela antiga
      // 4. Renomear nova tabela

      // Verificar se client_id já é nullable (verificando se há constraint NOT NULL)
      const clientIdColumn = tableInfo.find((col: any) => col.name === 'client_id');
      
      if (clientIdColumn && clientIdColumn.notnull === 1) {
        console.log('➕ Ajustando coluna client_id para permitir NULL...');
        
        // Verificar se contacts_new já existe e dropar se necessário
        const contactsNewExists = await queryRunner.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='contacts_new'`
        );
        if (contactsNewExists.length > 0) {
          console.log('⚠️  Tabela contacts_new já existe, removendo...');
          await queryRunner.query(`DROP TABLE IF EXISTS "contacts_new"`);
        }
        
        // Criar nova tabela com client_id nullable
        await queryRunner.query(`
          CREATE TABLE "contacts_new" (
            "id" varchar PRIMARY KEY NOT NULL,
            "company_id" varchar NOT NULL,
            "client_id" varchar,
            "name" varchar NOT NULL,
            "phone" varchar,
            "email" varchar,
            "created_at" datetime,
            "updated_at" datetime
          )
        `);

        // Copiar dados da tabela antiga para a nova, tratando NULLs
        await queryRunner.query(`
          INSERT INTO "contacts_new" 
          SELECT 
            id,
            company_id,
            client_id,
            name,
            phone,
            email,
            COALESCE(created_at, datetime('now')) as created_at,
            COALESCE(updated_at, datetime('now')) as updated_at
          FROM "contacts"
        `);

        // Dropar tabela antiga
        await queryRunner.query(`DROP TABLE "contacts"`);

        // Renomear nova tabela
        await queryRunner.query(`ALTER TABLE "contacts_new" RENAME TO "contacts"`);

        console.log('✅ Coluna client_id agora permite NULL');
      } else {
        console.log('ℹ️  Coluna client_id já permite NULL ou não existe');
      }

      console.log('✅ Estrutura da tabela contacts verificada!');
    } catch (error) {
      console.error('❌ Erro ao ajustar coluna:', error);
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

fixContactsClientIdNullable()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

