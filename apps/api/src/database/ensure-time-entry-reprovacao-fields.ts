import { DataSource } from 'typeorm';

export async function ensureTimeEntryReprovacaoFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('time_entries');
    if (!table) {
      console.log('Tabela time_entries não existe ainda');
      return;
    }
    
    // Verificar se reprovado_por existe
    const hasReprovadoPor = table.columns.find(col => col.name === 'reprovado_por');
    if (!hasReprovadoPor) {
      console.log('Adicionando coluna reprovado_por à tabela time_entries...');
      await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN reprovado_por TEXT`);
      console.log('Coluna reprovado_por adicionada com sucesso!');
    } else {
      console.log('Coluna reprovado_por já existe na tabela time_entries');
    }
    
    // Verificar se reprovado_em existe
    const hasReprovadoEm = table.columns.find(col => col.name === 'reprovado_em');
    if (!hasReprovadoEm) {
      console.log('Adicionando coluna reprovado_em à tabela time_entries...');
      await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN reprovado_em DATETIME`);
      console.log('Coluna reprovado_em adicionada com sucesso!');
    } else {
      console.log('Coluna reprovado_em já existe na tabela time_entries');
    }
  } catch (error) {
    console.error('Erro ao verificar/adicionar colunas na tabela time_entries:', error);
    // Não lançar erro para não impedir o servidor de iniciar
  } finally {
    await queryRunner.release();
  }
}





