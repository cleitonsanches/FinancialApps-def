const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

db.serialize(() => {
  // Verificar se a coluna já existe
  db.get("PRAGMA table_info(proposals)", (err, rows) => {
    if (err) {
      console.error('Erro ao verificar estrutura da tabela:', err);
      db.close();
      return;
    }

    db.all("PRAGMA table_info(proposals)", (err, columns) => {
      if (err) {
        console.error('Erro ao obter colunas:', err);
        db.close();
        return;
      }

      const hasObservacoes = columns.some(col => col.name === 'observacoes');

      if (hasObservacoes) {
        console.log('A coluna "observacoes" já existe na tabela proposals');
        db.close();
        return;
      }

      // Adicionar coluna observacoes
      db.run(
        "ALTER TABLE proposals ADD COLUMN observacoes TEXT",
        (err) => {
          if (err) {
            console.error('Erro ao adicionar coluna observacoes:', err);
          } else {
            console.log('Coluna "observacoes" adicionada com sucesso!');
          }
          db.close();
        }
      );
    });
  });
});

