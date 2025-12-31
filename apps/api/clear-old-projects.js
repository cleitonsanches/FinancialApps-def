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

// Obter data de hoje no formato YYYY-MM-DD
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

console.log(`\n📅 Data de hoje: ${todayStr}\n`);

// Buscar todos os projetos
db.all('SELECT id, name, created_at FROM projects ORDER BY created_at', (err, projects) => {
  if (err) {
    console.error('Erro ao buscar projetos:', err.message);
    db.close();
    process.exit(1);
  }

  if (!projects || projects.length === 0) {
    console.log('✅ Nenhum projeto encontrado no banco.');
    db.close();
    return;
  }

  console.log(`📊 Total de projetos encontrados: ${projects.length}\n`);

  // Separar projetos criados hoje e não criados hoje
  const projectsToday = [];
  const projectsOld = [];

  projects.forEach((project) => {
    const createdAt = project.created_at;
    let projectDate = null;

    if (createdAt) {
      // Se for string, extrair apenas a data (YYYY-MM-DD)
      if (typeof createdAt === 'string') {
        projectDate = createdAt.split('T')[0];
      } else {
        // Se for timestamp ou outro formato
        const date = new Date(createdAt);
        projectDate = date.toISOString().split('T')[0];
      }
    }

    const projectInfo = {
      id: project.id,
      name: project.name || 'Sem nome',
      createdAt: createdAt,
      date: projectDate,
    };

    if (projectDate === todayStr) {
      projectsToday.push(projectInfo);
    } else {
      projectsOld.push(projectInfo);
    }
  });

  // Exibir resultados
  console.log('✅ Projetos criados HOJE (serão MANTIDOS):');
  if (projectsToday.length === 0) {
    console.log('   Nenhum projeto criado hoje.\n');
  } else {
    projectsToday.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.name} (ID: ${p.id.substring(0, 8)}...) - Criado em: ${p.date || p.createdAt}`);
    });
    console.log('');
  }

  console.log('❌ Projetos NÃO criados hoje (serão DELETADOS):');
  if (projectsOld.length === 0) {
    console.log('   Nenhum projeto antigo encontrado.\n');
    console.log('✅ Nenhuma ação necessária!');
    db.close();
    return;
  } else {
    projectsOld.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.name} (ID: ${p.id.substring(0, 8)}...) - Criado em: ${p.date || p.createdAt}`);
    });
    console.log('');
  }

  // Confirmar antes de deletar
  console.log(`⚠️  ATENÇÃO: Você está prestes a deletar ${projectsOld.length} projeto(s) antigo(s)!`);
  console.log('Pressione Ctrl+C para cancelar ou aguarde 3 segundos para continuar...\n');

  setTimeout(() => {
    // Deletar projetos antigos
    let deletedCount = 0;
    let errorCount = 0;

    const deleteNext = (index) => {
      if (index >= projectsOld.length) {
        // Todas as deleções concluídas
        console.log(`\n✅ ${deletedCount} projeto(s) deletado(s) com sucesso!`);
        if (errorCount > 0) {
          console.log(`⚠️  ${errorCount} erro(s) durante a deleção.`);
        }

        // Verificar projetos restantes
        db.get('SELECT COUNT(*) as count FROM projects', (err2, row2) => {
          if (err2) {
            console.error('Erro ao verificar:', err2.message);
          } else {
            console.log(`📊 Projetos restantes: ${row2.count}`);
          }

          db.close((err3) => {
            if (err3) {
              console.error('Erro ao fechar banco:', err3.message);
            } else {
              console.log('\n✅ Script concluído!');
            }
          });
        });
        return;
      }

      const project = projectsOld[index];
      
      // Primeiro, deletar as tarefas do projeto (devido à constraint de foreign key)
      db.run('DELETE FROM project_tasks WHERE project_id = ?', [project.id], (errTasks) => {
        if (errTasks) {
          console.error(`   ⚠️  Erro ao deletar tarefas do projeto ${project.name}:`, errTasks.message);
        }

        // Depois, deletar o projeto
        db.run('DELETE FROM projects WHERE id = ?', [project.id], (err) => {
          if (err) {
            console.error(`   ❌ Erro ao deletar projeto ${project.name}:`, err.message);
            errorCount++;
          } else {
            console.log(`   ✅ Projeto "${project.name}" deletado com sucesso`);
            deletedCount++;
          }

          // Continuar com o próximo projeto
          deleteNext(index + 1);
        });
      });
    };

    // Iniciar deleção
    deleteNext(0);
  }, 3000);
});



