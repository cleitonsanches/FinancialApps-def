import { DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';

export async function ensureProposalNumeroColumn(dataSource: DataSource): Promise<void> {
  try {
    const queryRunner = dataSource.createQueryRunner();
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('proposals');
    if (!table) {
      console.log('⚠️  Tabela proposals não encontrada. Pulando verificação de coluna numero.');
      await queryRunner.release();
      return;
    }
    
    // Verificar se a coluna já existe
    const hasNumeroColumn = table.columns.some(col => col.name === 'numero');
    
    if (hasNumeroColumn) {
      console.log('✅ Coluna numero já existe na tabela proposals');
      await queryRunner.release();
      return;
    }
    
    // Adicionar a coluna
    console.log('📝 Adicionando coluna numero à tabela proposals...');
    await queryRunner.query('ALTER TABLE proposals ADD COLUMN numero VARCHAR(50)');
    console.log('✅ Coluna numero adicionada com sucesso!');
    
    await queryRunner.release();
  } catch (error: any) {
    console.error('❌ Erro ao verificar/adicionar coluna numero:', error.message);
    // Não bloquear a inicialização do servidor
  }
}

