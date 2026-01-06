import { DataSource } from 'typeorm';
import { Proposal } from './entities/proposal.entity';

export async function ensureProposalStatusDatesColumns(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar colunas existentes
    const table = await queryRunner.getTable('proposals');
    if (!table) {
      console.log('⚠️ Tabela proposals não encontrada');
      return;
    }

    const existingColumns = table.columns.map(col => col.name);
    console.log('📋 Colunas existentes na tabela proposals:', existingColumns.join(', '));

    // Lista de colunas de data de status que precisam ser adicionadas
    const columnsToAdd = [
      { name: 'data_envio', type: 'DATE' },
      { name: 'data_re_envio', type: 'DATE' },
      { name: 'data_revisao', type: 'DATE' },
      { name: 'data_fechamento', type: 'DATE' },
      { name: 'data_declinio', type: 'DATE' },
      { name: 'data_cancelamento', type: 'DATE' },
    ];

    const columnsToAddFiltered = columnsToAdd.filter(col => !existingColumns.includes(col.name));

    if (columnsToAddFiltered.length === 0) {
      console.log('✅ Todas as colunas de data de status já existem!');
      return;
    }

    console.log(`\n📝 Adicionando ${columnsToAddFiltered.length} coluna(s) de data de status...`);

    // Adicionar colunas uma por uma
    for (const col of columnsToAddFiltered) {
      try {
        await queryRunner.query(`ALTER TABLE proposals ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Coluna ${col.name} adicionada com sucesso`);
      } catch (error: any) {
        console.error(`❌ Erro ao adicionar coluna ${col.name}:`, error.message);
      }
    }

    console.log('✅ Verificação de colunas de data de status concluída!');
  } catch (error: any) {
    console.error('❌ Erro ao verificar/adicionar colunas de data de status:', error.message);
  } finally {
    await queryRunner.release();
  }
}






