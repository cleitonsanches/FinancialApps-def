import { DataSource } from 'typeorm';
import { join } from 'path';

async function fixProjectTemplateTasksNullable() {
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
      console.log('Estrutura atual da tabela:');
      tableInfo.forEach((col: any) => {
        console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
      });

      // SQLite não permite alterar diretamente a constraint NOT NULL
      // Mas podemos verificar se há dados e se necessário, criar uma nova tabela
      const hasData = await queryRunner.query(`SELECT COUNT(*) as count FROM project_template_tasks`);
      const count = hasData[0]?.count || 0;
      
      console.log(`\n📊 Tarefas existentes: ${count}`);

      // Verificar se a coluna dias_apos_inicio_projeto tem NOT NULL
      const diasAposCol = tableInfo.find((col: any) => col.name === 'dias_apos_inicio_projeto');
      if (diasAposCol && diasAposCol.notnull) {
        console.log('\n⚠️  A coluna dias_apos_inicio_projeto está como NOT NULL, mas deveria ser nullable.');
        console.log('ℹ️  SQLite não permite alterar diretamente NOT NULL. A coluna foi criada como nullable nas migrações.');
        console.log('ℹ️  Se o erro persistir, pode ser necessário recriar a tabela ou ajustar os dados.');
        
        // Verificar se há valores null na coluna
        const nullValues = await queryRunner.query(`
          SELECT COUNT(*) as count 
          FROM project_template_tasks 
          WHERE dias_apos_inicio_projeto IS NULL
        `);
        console.log(`\n📊 Tarefas com dias_apos_inicio_projeto NULL: ${nullValues[0]?.count || 0}`);
      } else {
        console.log('\n✅ A coluna dias_apos_inicio_projeto está como nullable (correto).');
      }

      // Verificar outras colunas que devem ser nullable
      const nullableColumns = ['dias_apos_tarefa_anterior', 'duracao_prevista_dias', 'data_inicio', 'data_conclusao'];
      for (const colName of nullableColumns) {
        const col = tableInfo.find((c: any) => c.name === colName);
        if (col && col.notnull) {
          console.log(`\n⚠️  A coluna ${colName} está como NOT NULL, mas deveria ser nullable.`);
        } else if (col) {
          console.log(`✅ A coluna ${colName} está como nullable (correto).`);
        }
      }

      console.log('\n✅ Verificação concluída!');
      console.log('\n💡 Nota: Se a coluna foi criada com NOT NULL anteriormente, pode ser necessário:');
      console.log('   1. Deletar a coluna e recriá-la como nullable, OU');
      console.log('   2. Garantir que sempre enviamos um valor (mesmo que 0) para tarefas subsequentes');
      
    } catch (error) {
      console.error('❌ Erro ao verificar estrutura:', error);
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

fixProjectTemplateTasksNullable()
  .then(() => {
    console.log('✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  });

