import { DataSource } from 'typeorm';
import { join } from 'path';

async function deleteAllProposals() {
  const databasePath = join(process.cwd(), 'database.sqlite');
  
  console.log('Caminho do banco de dados:', databasePath);
  
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [],
    synchronize: false,
    logging: true,
  });

  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('Banco de dados conectado com sucesso!');
    
    const queryRunner = dataSource.createQueryRunner();
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('proposals');
    
    if (!table) {
      console.error('Tabela proposals não encontrada!');
      await dataSource.destroy();
      process.exit(1);
    }
    
    // Contar registros antes de deletar
    const countResult = await queryRunner.query('SELECT COUNT(*) as count FROM proposals');
    const count = countResult[0]?.count || 0;
    console.log(`Encontradas ${count} negociações no banco de dados.`);
    
    if (count === 0) {
      console.log('Nenhuma negociação para deletar.');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }
    
    // Deletar todas as negociações
    console.log('Deletando todas as negociações...');
    await queryRunner.query('DELETE FROM proposals');
    
    // Verificar se foi deletado
    const countAfter = await queryRunner.query('SELECT COUNT(*) as count FROM proposals');
    const remaining = countAfter[0]?.count || 0;
    
    console.log(`✅ ${count} negociações deletadas com sucesso!`);
    console.log(`Negociações restantes: ${remaining}`);
    
    await queryRunner.release();
    await dataSource.destroy();
    console.log('\n✅ Limpeza concluída com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao deletar negociações:', error.message);
    console.error('Detalhes:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  deleteAllProposals();
}

export default deleteAllProposals;

