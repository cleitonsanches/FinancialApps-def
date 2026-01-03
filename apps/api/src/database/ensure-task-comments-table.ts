import { DataSource } from 'typeorm';

export async function ensureTaskCommentsTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // Verificar se a tabela existe
    const table = await queryRunner.getTable('task_comments');
    if (table) {
      console.log('✅ Tabela task_comments já existe');
      await queryRunner.release();
      return;
    }

    console.log('📝 Criando tabela task_comments...');

    const dbType = dataSource.options.type;

    if (dbType === 'sqlite') {
      await queryRunner.query(`
        CREATE TABLE task_comments (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          texto TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      await queryRunner.query(`
        CREATE INDEX IX_task_comments_task_id ON task_comments(task_id)
      `);

      await queryRunner.query(`
        CREATE INDEX IX_task_comments_user_id ON task_comments(user_id)
      `);
    } else if (dbType === 'mssql') {
      await queryRunner.query(`
        CREATE TABLE task_comments (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          task_id UNIQUEIDENTIFIER NOT NULL,
          user_id UNIQUEIDENTIFIER NOT NULL,
          texto NVARCHAR(MAX) NOT NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      await queryRunner.query(`
        CREATE INDEX IX_task_comments_task_id ON task_comments(task_id)
      `);

      await queryRunner.query(`
        CREATE INDEX IX_task_comments_user_id ON task_comments(user_id)
      `);
    }

    console.log('✅ Tabela task_comments criada com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao criar tabela task_comments:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

