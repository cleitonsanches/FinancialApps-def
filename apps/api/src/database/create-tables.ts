import { DataSource } from 'typeorm';
import { join } from 'path';

async function createTables() {
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
      // Criar tabela clients se não existir
      const clientsExists = await queryRunner.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='clients'`
      );

      if (clientsExists.length === 0) {
        console.log('➕ Criando tabela clients...');
        await queryRunner.query(`
          CREATE TABLE "clients" (
            "id" varchar PRIMARY KEY NOT NULL,
            "company_id" varchar NOT NULL,
            "razao_social" varchar NOT NULL,
            "cnpj_cpf" varchar,
            "contact_email" varchar,
            "phone" varchar,
            "address" varchar,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
          )
        `);
        console.log('✅ Tabela clients criada');
      } else {
        console.log('⚠️  Tabela clients já existe');
      }

      // Criar tabela contacts se não existir
      const contactsExists = await queryRunner.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='contacts'`
      );

      if (contactsExists.length === 0) {
        console.log('➕ Criando tabela contacts...');
        await queryRunner.query(`
          CREATE TABLE "contacts" (
            "id" varchar PRIMARY KEY NOT NULL,
            "company_id" varchar NOT NULL,
            "client_id" varchar,
            "name" varchar NOT NULL,
            "phone" varchar,
            "email" varchar,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
          )
        `);
        console.log('✅ Tabela contacts criada');
      } else {
        console.log('⚠️  Tabela contacts já existe');
        
        // Verificar se tem company_id
        const tableInfo = await queryRunner.query(`PRAGMA table_info(contacts)`);
        const hasCompanyId = tableInfo.some((col: any) => col.name === 'company_id');
        
        if (!hasCompanyId) {
          console.log('➕ Adicionando coluna company_id à tabela contacts...');
          await queryRunner.query(
            `ALTER TABLE contacts ADD COLUMN company_id varchar NOT NULL DEFAULT ''`
          );
          
          // Atualizar registros existentes com a primeira empresa
          const companies = await queryRunner.query(`SELECT id FROM companies LIMIT 1`);
          if (companies.length > 0) {
            await queryRunner.query(
              `UPDATE contacts SET company_id = ? WHERE company_id = ''`,
              [companies[0].id]
            );
          }
          console.log('✅ Coluna company_id adicionada');
        }
      }

      console.log('✅ Todas as tabelas estão prontas!');
    } catch (error) {
      console.error('❌ Erro ao criar tabelas:', error);
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

createTables();

