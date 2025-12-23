import { DataSource } from 'typeorm';
import { join } from 'path';

async function createProposalTemplateFieldsTable() {
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
        `SELECT name FROM sqlite_master WHERE type='table' AND name='proposal_template_fields'`
      );

      if (tableExists.length === 0) {
        console.log('➕ Criando tabela proposal_template_fields...');
        await queryRunner.query(`
          CREATE TABLE "proposal_template_fields" (
            "id" varchar PRIMARY KEY NOT NULL,
            "template_id" varchar NOT NULL,
            "nome" varchar(200) NOT NULL,
            "chave" varchar(100) NOT NULL,
            "tipo" varchar(50) NOT NULL,
            "obrigatorio" boolean NOT NULL DEFAULT 0,
            "ordem" integer NOT NULL DEFAULT 0,
            "placeholder" varchar(200),
            "descricao" text,
            "valor_padrao" text,
            "opcoes" text,
            "validacoes" text,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime
          )
        `);
        
        console.log('✅ Tabela proposal_template_fields criada com sucesso!');
      } else {
        console.log('⚠️  Tabela proposal_template_fields já existe.');
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

createProposalTemplateFieldsTable();

