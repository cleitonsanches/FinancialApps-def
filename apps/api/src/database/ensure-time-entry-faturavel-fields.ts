import { DataSource } from 'typeorm';

export async function ensureTimeEntryFaturavelFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('time_entries');
    if (!table) {
      console.log('Tabela time_entries não existe ainda');
      return;
    }
    
    // Verificar se is_faturavel existe
    const hasIsFaturavel = table.columns.find(col => col.name === 'is_faturavel');
    if (!hasIsFaturavel) {
      console.log('Adicionando coluna is_faturavel à tabela time_entries...');
      await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN is_faturavel INTEGER DEFAULT 0`);
      console.log('Coluna is_faturavel adicionada com sucesso!');
    } else {
      console.log('Coluna is_faturavel já existe na tabela time_entries');
    }
    
    // Verificar se valor_por_hora existe
    const hasValorPorHora = table.columns.find(col => col.name === 'valor_por_hora');
    if (!hasValorPorHora) {
      console.log('Adicionando coluna valor_por_hora à tabela time_entries...');
      await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN valor_por_hora REAL`);
      console.log('Coluna valor_por_hora adicionada com sucesso!');
    } else {
      console.log('Coluna valor_por_hora já existe na tabela time_entries');
    }
  } catch (error) {
    console.error('Erro ao verificar/adicionar colunas na tabela time_entries:', error);
    // Não lançar erro para não impedir o servidor de iniciar
  } finally {
    await queryRunner.release();
  }
}


