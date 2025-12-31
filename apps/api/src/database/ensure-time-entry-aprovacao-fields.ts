import { DataSource } from 'typeorm';

export async function ensureTimeEntryAprovacaoFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('time_entries');
    if (!table) {
      console.log('Tabela time_entries não existe ainda');
      return;
    }
    
    // Verificar se aprovado_por existe
    const hasAprovadoPor = table.columns.find(col => col.name === 'aprovado_por');
    if (!hasAprovadoPor) {
      console.log('Adicionando coluna aprovado_por à tabela time_entries...');
      await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN aprovado_por TEXT`);
      console.log('Coluna aprovado_por adicionada com sucesso!');
    } else {
      console.log('Coluna aprovado_por já existe na tabela time_entries');
    }
    
    // Verificar se aprovado_em existe
    const hasAprovadoEm = table.columns.find(col => col.name === 'aprovado_em');
    if (!hasAprovadoEm) {
      console.log('Adicionando coluna aprovado_em à tabela time_entries...');
      await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN aprovado_em DATETIME`);
      console.log('Coluna aprovado_em adicionada com sucesso!');
    } else {
      console.log('Coluna aprovado_em já existe na tabela time_entries');
    }
    
    // Verificar se faturamento_desprezado existe
    const hasFaturamentoDesprezado = table.columns.find(col => col.name === 'faturamento_desprezado');
    if (!hasFaturamentoDesprezado) {
      console.log('Adicionando coluna faturamento_desprezado à tabela time_entries...');
      await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN faturamento_desprezado INTEGER DEFAULT 0`);
      console.log('Coluna faturamento_desprezado adicionada com sucesso!');
    } else {
      console.log('Coluna faturamento_desprezado já existe na tabela time_entries');
    }
  } catch (error) {
    console.error('Erro ao verificar/adicionar colunas na tabela time_entries:', error);
    // Não lançar erro para não impedir o servidor de iniciar
  } finally {
    await queryRunner.release();
  }
}


