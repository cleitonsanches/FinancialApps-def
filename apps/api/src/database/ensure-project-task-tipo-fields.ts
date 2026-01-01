import { DataSource } from 'typeorm';

export async function ensureProjectTaskTipoFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe primeiro
    const table = await queryRunner.getTable('project_tasks');
    if (!table) {
      console.log('⚠️ Tabela project_tasks não encontrada. Pulando verificação de colunas.');
      await queryRunner.release();
      return;
    }
    
    const existingColumns = table.columns.map(col => col.name);
    
    const dbType = dataSource.options.type;
    
    // Verificar e adicionar coluna tipo
    if (!existingColumns.includes('tipo')) {
      try {
        await queryRunner.query(`
          ALTER TABLE project_tasks ADD tipo VARCHAR(20) DEFAULT 'ATIVIDADE'
        `);
        console.log('✓ Coluna tipo adicionada à tabela project_tasks');
      } catch (error: any) {
        if (!error.message.includes('duplicate column') && !error.message.includes('already exists') && !error.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna tipo:', error.message);
        }
      }
    }

    // Verificar e adicionar coluna hora_inicio
    if (!existingColumns.includes('hora_inicio')) {
      try {
        await queryRunner.query(`
          ALTER TABLE project_tasks ADD hora_inicio VARCHAR(10) NULL
        `);
        console.log('✓ Coluna hora_inicio adicionada à tabela project_tasks');
      } catch (error: any) {
        if (!error.message.includes('duplicate column') && !error.message.includes('already exists') && !error.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna hora_inicio:', error.message);
        }
      }
    }

    // Verificar e adicionar coluna hora_fim
    if (!existingColumns.includes('hora_fim')) {
      try {
        await queryRunner.query(`
          ALTER TABLE project_tasks ADD hora_fim VARCHAR(10) NULL
        `);
        console.log('✓ Coluna hora_fim adicionada à tabela project_tasks');
      } catch (error: any) {
        if (!error.message.includes('duplicate column') && !error.message.includes('already exists') && !error.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna hora_fim:', error.message);
        }
      }
    }

    // Verificar e adicionar coluna sem_prazo_definido
    if (!existingColumns.includes('sem_prazo_definido')) {
      try {
        // SQL Server usa BIT ao invés de BOOLEAN
        const columnType = dbType === 'mssql' ? 'BIT DEFAULT 0' : 'BOOLEAN DEFAULT 0';
        await queryRunner.query(`
          ALTER TABLE project_tasks ADD sem_prazo_definido ${columnType}
        `);
        console.log('✓ Coluna sem_prazo_definido adicionada à tabela project_tasks');
      } catch (error: any) {
        if (!error.message.includes('duplicate column') && !error.message.includes('already exists') && !error.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna sem_prazo_definido:', error.message);
        }
      }
    }

    // Verificar e adicionar coluna dia_inteiro
    if (!existingColumns.includes('dia_inteiro')) {
      try {
        // SQL Server usa BIT ao invés de BOOLEAN
        const columnType = dbType === 'mssql' ? 'BIT DEFAULT 0' : 'BOOLEAN DEFAULT 0';
        await queryRunner.query(`
          ALTER TABLE project_tasks ADD dia_inteiro ${columnType}
        `);
        console.log('✓ Coluna dia_inteiro adicionada à tabela project_tasks');
      } catch (error: any) {
        if (!error.message.includes('duplicate column') && !error.message.includes('already exists') && !error.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna dia_inteiro:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao garantir campos de tipo em project_tasks:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}



