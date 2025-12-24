import { DataSource } from 'typeorm';

export async function ensureInvoiceFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a coluna data_recebimento existe
    const table = await queryRunner.getTable('invoices');
    const hasDataRecebimento = table?.columns.find(col => col.name === 'data_recebimento');
    const hasNumeroNF = table?.columns.find(col => col.name === 'numero_nf');
    
    if (!hasDataRecebimento) {
      console.log('Adicionando coluna data_recebimento à tabela invoices...');
      await queryRunner.query(`ALTER TABLE invoices ADD COLUMN data_recebimento DATE`);
      console.log('Coluna data_recebimento adicionada com sucesso!');
    } else {
      console.log('Coluna data_recebimento já existe na tabela invoices');
    }
    
    if (!hasNumeroNF) {
      console.log('Adicionando coluna numero_nf à tabela invoices...');
      await queryRunner.query(`ALTER TABLE invoices ADD COLUMN numero_nf VARCHAR(50)`);
      console.log('Coluna numero_nf adicionada com sucesso!');
    } else {
      console.log('Coluna numero_nf já existe na tabela invoices');
    }
  } catch (error) {
    console.error('Erro ao verificar/adicionar colunas na tabela invoices:', error);
    // Não lançar erro para não impedir o servidor de iniciar
  } finally {
    await queryRunner.release();
  }
}

