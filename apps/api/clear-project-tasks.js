const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o arquivo database.sqlite
let dbPath = path.join(process.cwd(), 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(process.cwd(), 'apps', 'api', 'database.sqlite');
}
if (!fs.existsSync(dbPath)) {
  console.error('Arquivo database.sqlite não encontrado');
  process.exit(1);
}

console.log('Usando banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados');
});

// Contar tarefas antes de deletar
db.get('SELECT COUNT(*) as count FROM project_tasks', (err, row) => {
  if (err) {
    console.error('Erro ao contar tarefas:', err.message);
    db.close();
    process.exit(1);
  }
  
  const countBefore = row.count;
  console.log(`\n📊 Tarefas encontradas: ${countBefore}`);
  
  if (countBefore === 0) {
    console.log('✅ Nenhuma tarefa para deletar.');
    db.close();
    return;
  }
  
  // Confirmar antes de deletar
  console.log(`\n⚠️  ATENÇÃO: Você está prestes a deletar ${countBefore} tarefa(s)!`);
  console.log('Este script irá limpar TODAS as tarefas da tabela project_tasks.');
  console.log('Pressione Ctrl+C para cancelar ou aguarde 3 segundos para continuar...\n');
  
  setTimeout(() => {
    // Deletar todas as tarefas
    db.run('DELETE FROM project_tasks', (err) => {
      if (err) {
        console.error('❌ Erro ao deletar tarefas:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log(`✅ ${countBefore} tarefa(s) deletada(s) com sucesso!`);
      
      // Verificar se realmente foram deletadas
      db.get('SELECT COUNT(*) as count FROM project_tasks', (err2, row2) => {
        if (err2) {
          console.error('Erro ao verificar:', err2.message);
        } else {
          console.log(`📊 Tarefas restantes: ${row2.count}`);
        }
        
        db.close((err3) => {
          if (err3) {
            console.error('Erro ao fechar banco:', err3.message);
          } else {
            console.log('\n✅ Script concluído!');
          }
        });
      });
    });
  }, 3000);
});


