import { DataSource } from 'typeorm';

export async function ensureProposalServiceFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    const table = await queryRunner.getTable('proposals');
    if (!table) {
      console.error('Tabela proposals não encontrada');
      return;
    }

    const columnsToAdd = [
      // Análise de Dados
      { name: 'data_inicio_analise', type: 'DATE' },
      { name: 'data_programada_homologacao', type: 'DATE' },
      { name: 'data_programada_producao', type: 'DATE' },
      
      // Assinaturas
      { name: 'tipo_produto_assinado', type: 'VARCHAR(100)' },
      { name: 'quantidade_usuarios', type: 'INTEGER' },
      { name: 'valor_unitario_usuario', type: 'DECIMAL(15,2)' },
      { name: 'data_inicio_assinatura', type: 'DATE' },
      { name: 'vencimento_assinatura', type: 'DATE' },
      
      // Manutenções
      { name: 'descricao_manutencao', type: 'TEXT' },
      { name: 'valor_mensal_manutencao', type: 'DECIMAL(15,2)' },
      { name: 'data_inicio_manutencao', type: 'DATE' },
      { name: 'vencimento_manutencao', type: 'DATE' },
      
      // Contrato Fixo
      { name: 'valor_mensal_fixo', type: 'DECIMAL(15,2)' },
      { name: 'data_fim_contrato', type: 'DATE' },
      
      // Campos genéricos
      { name: 'tem_manutencao_vinculada', type: 'BOOLEAN DEFAULT 0' },
      { name: 'proposta_manutencao_id', type: 'VARCHAR(36)' },
    ];

    for (const col of columnsToAdd) {
      const hasColumn = table.columns.find(c => c.name === col.name);
      
      if (!hasColumn) {
        try {
          await queryRunner.query(`
            ALTER TABLE proposals ADD COLUMN ${col.name} ${col.type}
          `);
          console.log(`✅ Coluna ${col.name} adicionada`);
        } catch (error: any) {
          if (!error.message.includes('duplicate column')) {
            console.error(`Erro ao adicionar ${col.name}:`, error.message);
          }
        }
      }
    }
    
    console.log('✅ Verificação de campos de serviços concluída!');
  } catch (error: any) {
    console.error('Erro ao verificar campos de serviços:', error.message);
  } finally {
    await queryRunner.release();
  }
}






