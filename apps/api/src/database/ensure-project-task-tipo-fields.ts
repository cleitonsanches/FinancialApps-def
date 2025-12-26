import { DataSource } from 'typeorm';

export async function ensureProjectTaskTipoFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar e adicionar coluna tipo
    const tipoColumn = await queryRunner.query(`
      SELECT name FROM pragma_table_info('project_tasks') WHERE name = 'tipo'
    `);
    if (tipoColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE project_tasks ADD COLUMN tipo VARCHAR(20) DEFAULT 'ATIVIDADE'
      `);
      console.log('✓ Coluna tipo adicionada à tabela project_tasks');
    }

    // Verificar e adicionar coluna hora_inicio
    const horaInicioColumn = await queryRunner.query(`
      SELECT name FROM pragma_table_info('project_tasks') WHERE name = 'hora_inicio'
    `);
    if (horaInicioColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE project_tasks ADD COLUMN hora_inicio VARCHAR(10) NULL
      `);
      console.log('✓ Coluna hora_inicio adicionada à tabela project_tasks');
    }

    // Verificar e adicionar coluna hora_fim
    const horaFimColumn = await queryRunner.query(`
      SELECT name FROM pragma_table_info('project_tasks') WHERE name = 'hora_fim'
    `);
    if (horaFimColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE project_tasks ADD COLUMN hora_fim VARCHAR(10) NULL
      `);
      console.log('✓ Coluna hora_fim adicionada à tabela project_tasks');
    }

    // Verificar e adicionar coluna sem_prazo_definido
    const semPrazoColumn = await queryRunner.query(`
      SELECT name FROM pragma_table_info('project_tasks') WHERE name = 'sem_prazo_definido'
    `);
    if (semPrazoColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE project_tasks ADD COLUMN sem_prazo_definido BOOLEAN DEFAULT 0
      `);
      console.log('✓ Coluna sem_prazo_definido adicionada à tabela project_tasks');
    }

    // Verificar e adicionar coluna dia_inteiro
    const diaInteiroColumn = await queryRunner.query(`
      SELECT name FROM pragma_table_info('project_tasks') WHERE name = 'dia_inteiro'
    `);
    if (diaInteiroColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE project_tasks ADD COLUMN dia_inteiro BOOLEAN DEFAULT 0
      `);
      console.log('✓ Coluna dia_inteiro adicionada à tabela project_tasks');
    }
  } catch (error) {
    console.error('Erro ao garantir campos de tipo em project_tasks:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

