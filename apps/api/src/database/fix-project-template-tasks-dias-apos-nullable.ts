import { DataSource } from 'typeorm';
import { join } from 'path';

async function fixProjectTemplateTasksDiasAposNullable() {
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
      const tableInfo = await queryRunner.query(`PRAGMA table_info(project_template_tasks)`);
      console.log('Estrutura atual da tabela project_template_tasks:');
      
      const diasAposInicioCol = tableInfo.find((col: any) => col.name === 'dias_apos_inicio_projeto');
      
      if (diasAposInicioCol && diasAposInicioCol.notnull === 1) {
        console.log('⚠️  A coluna dias_apos_inicio_projeto está como NOT NULL, ajustando para nullable...');
        
        // Verificar se contacts_new já existe e dropar se necessário
        const tableNewExists = await queryRunner.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='project_template_tasks_new'`
        );
        if (tableNewExists.length > 0) {
          console.log('⚠️  Tabela project_template_tasks_new já existe, removendo...');
          await queryRunner.query(`DROP TABLE IF EXISTS "project_template_tasks_new"`);
        }

        // Obter todas as colunas da tabela atual
        const allColumns = tableInfo.map((col: any) => ({
          name: col.name,
          type: col.type,
          notnull: col.name === 'dias_apos_inicio_projeto' ? 0 : col.notnull, // Tornar nullable
          pk: col.pk,
          dflt: col.dflt_value,
        }));

        // Criar SQL para nova tabela com todas as colunas
        // Simplificar: remover defaults problemáticos e focar apenas em tornar dias_apos_inicio_projeto nullable
        const columnDefs = allColumns.map((col: any) => {
          let def = `"${col.name}" ${col.type}`;
          if (col.pk) {
            def += ' PRIMARY KEY';
          }
          // Para dias_apos_inicio_projeto, não adicionar NOT NULL
          if (col.name === 'dias_apos_inicio_projeto') {
            // Não adicionar NOT NULL nem DEFAULT
            return def;
          }
          if (col.notnull && !col.pk) {
            def += ' NOT NULL';
          }
          // Tratar defaults simples (números e strings simples, sem funções)
          if (col.dflt !== null && col.dflt !== undefined && col.name !== 'dias_apos_inicio_projeto') {
            // Ignorar defaults com funções como datetime('now')
            if (typeof col.dflt === 'string' && !col.dflt.includes('datetime') && !col.dflt.includes('(')) {
              if (col.dflt.startsWith("'") && col.dflt.endsWith("'")) {
                def += ` DEFAULT ${col.dflt}`;
              } else {
                def += ` DEFAULT '${col.dflt}'`;
              }
            } else if (typeof col.dflt === 'number' || (typeof col.dflt === 'string' && /^\d+$/.test(col.dflt))) {
              def += ` DEFAULT ${col.dflt}`;
            }
          }
          return def;
        }).join(',\n            ');

        console.log('➕ Criando nova tabela com estrutura corrigida...');
        await queryRunner.query(`
          CREATE TABLE "project_template_tasks_new" (
            ${columnDefs}
          )
        `);

        // Copiar dados da tabela antiga para a nova
        console.log('📋 Copiando dados...');
        const columnNames = allColumns.map((col: any) => `"${col.name}"`).join(', ');
        await queryRunner.query(`
          INSERT INTO "project_template_tasks_new" (${columnNames})
          SELECT ${columnNames}
          FROM "project_template_tasks"
        `);

        // Verificar quantos registros foram copiados
        const count = await queryRunner.query(`SELECT COUNT(*) as count FROM "project_template_tasks_new"`);
        console.log(`✅ ${count[0]?.count || 0} registros copiados`);

        // Dropar tabela antiga
        console.log('🗑️  Removendo tabela antiga...');
        await queryRunner.query(`DROP TABLE "project_template_tasks"`);

        // Renomear nova tabela
        console.log('🔄 Renomeando nova tabela...');
        await queryRunner.query(`ALTER TABLE "project_template_tasks_new" RENAME TO "project_template_tasks"`);

        console.log('✅ Coluna dias_apos_inicio_projeto agora permite NULL');
      } else {
        console.log('✅ A coluna dias_apos_inicio_projeto já está como nullable (correto).');
      }

      console.log('✅ Estrutura da tabela project_template_tasks verificada!');
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

fixProjectTemplateTasksDiasAposNullable()
  .then(() => {
    console.log('✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });

