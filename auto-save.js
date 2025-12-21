// Script de salvamento automático usando Node.js
// Executa commit automático a cada 2 minutos

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_PATH = __dirname;
const INTERVAL_MINUTES = 2;
const LOG_FILE = path.join(REPO_PATH, 'auto-save.log');

function writeLog(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function autoSave() {
  try {
    process.chdir(REPO_PATH);

    // Verificar se é um repositório Git
    if (!fs.existsSync(path.join(REPO_PATH, '.git'))) {
      writeLog('Inicializando repositório Git...');
      execSync('git init', { stdio: 'inherit' });
      try {
        execSync('git config user.name "Auto Save"', { stdio: 'inherit' });
        execSync('git config user.email "autosave@local"', { stdio: 'inherit' });
      } catch (e) {
        // Ignorar erro se já estiver configurado
      }
    }

    // Verificar se há mudanças
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      
      if (status.trim()) {
        writeLog('Salvando alterações...');
        
        // Adicionar todos os arquivos
        execSync('git add -A', { stdio: 'inherit' });
        
        // Fazer commit com timestamp
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const commitMessage = `Auto-save: ${timestamp}`;
        
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        writeLog('✓ Alterações salvas com sucesso');
      } else {
        writeLog('Nenhuma alteração para salvar');
      }
    } catch (error) {
      if (error.status === 1 && error.stdout && error.stdout.includes('not a git repository')) {
        writeLog('Erro: Não é um repositório Git válido');
      } else if (error.status === 1 && error.stdout && error.stdout.includes('nothing to commit')) {
        writeLog('Nenhuma alteração para salvar');
      } else {
        writeLog(`✗ Erro ao salvar: ${error.message}`);
      }
    }
  } catch (error) {
    writeLog(`✗ Erro geral: ${error.message}`);
  }
}

writeLog(`=== Iniciando salvamento automático (a cada ${INTERVAL_MINUTES} minutos) ===`);
writeLog('Pressione Ctrl+C para parar');

// Executar imediatamente
autoSave();

// Executar a cada 2 minutos
setInterval(() => {
  autoSave();
}, INTERVAL_MINUTES * 60 * 1000);

