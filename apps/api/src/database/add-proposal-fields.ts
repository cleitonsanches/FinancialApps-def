import { DataSource } from 'typeorm';
import { join } from 'path';

async function addProposalFields() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: join(__dirname, '../../dev.db'),
    entities: [],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Conectado ao banco de dados');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Verificar se a tabela existe
      const tableExists = await queryRunner.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='proposals'`
      );

      if (tableExists.length === 0) {
        console.log('⚠️  Tabela proposals não existe. Execute primeiro a criação da tabela.');
        return;
      }

      console.log('🔍 Verificando colunas existentes...');
      const tableInfo = await queryRunner.query(`PRAGMA table_info(proposals)`);
      const existingColumns = tableInfo.map((col: any) => col.name);
      console.log('Colunas existentes:', existingColumns);

      // Lista de novos campos a adicionar
      const newFields = [
        { name: 'descricao_projeto', sql: 'text' },
        { name: 'valor_proposto', sql: 'decimal(15,2)' },
        { name: 'tipo_contratacao', sql: 'varchar(50)' },
        { name: 'tipo_faturamento', sql: 'varchar(50)' },
        { name: 'horas_estimadas', sql: 'varchar(10)' },
        { name: 'data_inicio', sql: 'date' },
        { name: 'data_conclusao', sql: 'date' },
        { name: 'inicio_faturamento', sql: 'date' },
        { name: 'fim_faturamento', sql: 'date' },
        { name: 'data_vencimento', sql: 'date' },
        { name: 'condicao_pagamento', sql: 'varchar(20)' },
        { name: 'sistema_origem', sql: 'varchar(200)' },
        { name: 'sistema_destino', sql: 'varchar(200)' },
        { name: 'produto', sql: 'varchar(100)' },
        { name: 'manutencoes', sql: 'text' },
      ];

      // Adicionar apenas campos que não existem
      for (const field of newFields) {
        if (!existingColumns.includes(field.name)) {
          console.log(`➕ Adicionando coluna ${field.name}...`);
          await queryRunner.query(
            `ALTER TABLE proposals ADD COLUMN ${field.name} ${field.sql}`
          );
          console.log(`✅ Coluna ${field.name} adicionada com sucesso!`);
        } else {
          console.log(`⚠️  Coluna ${field.name} já existe. Pulando...`);
        }
      }

      console.log('✅ Migração concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao executar migração:', error);
      throw error;
    } finally {
      await queryRunner.release();
      await dataSource.destroy();
    }
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

addProposalFields();

