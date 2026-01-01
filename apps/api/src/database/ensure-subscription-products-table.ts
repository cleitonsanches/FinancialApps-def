import { DataSource } from 'typeorm';

export async function ensureSubscriptionProductsTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('subscription_products');
    
    if (!table) {
      console.log('Criando tabela subscription_products...');
      await queryRunner.query(`
        CREATE TABLE subscription_products (
          id VARCHAR(36) PRIMARY KEY,
          company_id VARCHAR(36) NOT NULL,
          code VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(company_id, code)
        )
      `);
      
      // Criar índice
      await queryRunner.query(`
        CREATE INDEX IX_subscription_products_company_id ON subscription_products(company_id)
      `);
      
      console.log('✅ Tabela subscription_products criada com sucesso!');
    } else {
      console.log('✅ Tabela subscription_products já existe');
    }
  } catch (error: any) {
    console.error('Erro ao criar tabela subscription_products:', error.message);
  } finally {
    await queryRunner.release();
  }
}





