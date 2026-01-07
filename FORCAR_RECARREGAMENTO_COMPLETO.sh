#!/bin/sh

# Script para forçar recarregamento completo e corrigir tudo
# Execute: sh FORCAR_RECARREGAMENTO_COMPLETO.sh

echo "=========================================="
echo "FORÇAR RECARREGAMENTO COMPLETO"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Parando e deletando TODAS as instâncias PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2
echo "✅ PM2 completamente parado"
echo ""

echo "PASSO 2: Verificando e carregando credenciais..."
if [ -f "$HOME/.env-pm2" ]; then
    # Converter se necessário
    if grep -q "^export " "$HOME/.env-pm2"; then
        echo "⚠️  Convertendo formato do arquivo..."
        cp "$HOME/.env-pm2" "$HOME/.env-pm2.backup"
        grep -v "^#" "$HOME/.env-pm2" | sed 's/^export //' | grep -v "^$" > "$HOME/.env-pm2.tmp"
        echo "# Variáveis de Ambiente para PM2" > "$HOME/.env-pm2"
        echo "# Convertido automaticamente em $(date)" >> "$HOME/.env-pm2"
        cat "$HOME/.env-pm2.tmp" >> "$HOME/.env-pm2"
        rm "$HOME/.env-pm2.tmp"
    fi
    
    # Criar link no diretório atual
    ln -sf "$HOME/.env-pm2" ".env.pm2" 2>/dev/null || cp "$HOME/.env-pm2" ".env.pm2"
    
    # Carregar credenciais no shell atual
    if [ -f "$HOME/.env-pm2.sh" ]; then
        source "$HOME/.env-pm2.sh"
    fi
    
    # Verificar se tem credenciais válidas
    if grep -q "DB_HOST" "$HOME/.env-pm2" && ! grep -q "seu-servidor" "$HOME/.env-pm2"; then
        echo "✅ Credenciais válidas encontradas"
        # Mostrar DB_HOST (sem senha) para confirmação
        DB_HOST=$(grep "^DB_HOST=" "$HOME/.env-pm2" | cut -d'=' -f2)
        echo "   DB_HOST: $DB_HOST"
    else
        echo "❌ Credenciais inválidas ou com placeholder!"
        exit 1
    fi
else
    echo "❌ Arquivo .env-pm2 não encontrado!"
    exit 1
fi
echo ""

echo "PASSO 3: Verificando se server.js existe..."
if [ ! -f "apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "❌ server.js não encontrado! Fazendo rebuild..."
    echo ""
    
    echo "   Limpando builds..."
    rm -rf apps/web/.next
    rm -rf apps/api/dist
    echo ""
    
    echo "   Build da API..."
    npm run build:api
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build da API!"
        exit 1
    fi
    echo ""
    
    echo "   Build do Web..."
    cd apps/web
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build do Web!"
        exit 1
    fi
    cd ../..
    echo ""
    
    if [ ! -f "apps/web/.next/standalone/apps/web/server.js" ]; then
        echo "❌ server.js AINDA não encontrado após rebuild!"
        exit 1
    fi
fi
echo "✅ server.js encontrado"
echo ""

echo "PASSO 4: Testando carregamento de credenciais pelo Node.js..."
node -e "
const path = require('path');
const fs = require('fs');
const os = require('os');

let envPath = path.join(process.cwd(), '.env.pm2');
if (!fs.existsSync(envPath)) {
  envPath = path.join(os.homedir(), '.env-pm2');
}

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('✅ Arquivo carregado:', envPath);
  console.log('DB_HOST:', process.env.DB_HOST || '❌ Não definido');
  console.log('DB_DATABASE_PROD:', process.env.DB_DATABASE_PROD || '❌ Não definido');
  console.log('DB_DATABASE_TEST:', process.env.DB_DATABASE_TEST || '❌ Não definido');
  
  if (process.env.DB_HOST && process.env.DB_HOST !== 'seu-servidor.database.windows.net') {
    console.log('✅ Credenciais válidas');
  } else {
    console.log('❌ Credenciais são placeholders!');
    process.exit(1);
  }
} else {
  console.log('❌ Arquivo não encontrado!');
  process.exit(1);
}
"
if [ $? -ne 0 ]; then
    echo "❌ Erro ao carregar credenciais!"
    exit 1
fi
echo ""

echo "PASSO 5: Recarregando PM2 com novas configurações..."
# Forçar PM2 a recarregar tudo
pm2 kill 2>/dev/null || true
sleep 2

# Iniciar PM2 novamente
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    exit 1
fi

# Salvar configuração
pm2 save

# Recarregar para garantir que as variáveis de ambiente sejam aplicadas
pm2 reload all
sleep 5

echo "✅ PM2 reiniciado"
echo ""

echo "PASSO 6: Verificando status..."
pm2 status
echo ""

echo "PASSO 7: Verificando logs de erro (últimas 3 linhas)..."
echo ""
echo "API Prod:"
pm2 logs financial-api-prod --lines 3 --nostream 2>/dev/null | tail -3 | grep -v "financia |" || echo "   Sem logs"
echo ""
echo "Web Prod:"
pm2 logs financial-web-prod --lines 3 --nostream 2>/dev/null | tail -3 | grep -v "financia |" || echo "   Sem logs"
echo ""
echo "API Test:"
pm2 logs financial-api-test --lines 3 --nostream 2>/dev/null | tail -3 | grep -v "financia |" || echo "   Sem logs"
echo ""
echo "Web Test:"
pm2 logs financial-web-test --lines 3 --nostream 2>/dev/null | tail -3 | grep -v "financia |" || echo "   Sem logs"
echo ""

echo "PASSO 8: Verificando se as credenciais estão sendo usadas..."
echo ""
echo "Verificando variáveis de ambiente do PM2..."
pm2 env 0 | grep DB_HOST || echo "   Não encontrado no processo 0"
pm2 env 2 | grep DB_HOST || echo "   Não encontrado no processo 2"
echo ""

echo "PASSO 9: Testando endpoints..."
echo ""
echo "Testando /api/health..."
API_PROD=$(curl -s http://localhost:8080/api/health 2>/dev/null)
if echo "$API_PROD" | grep -q '"port":"3001"'; then
    echo "✅ API Prod OK"
else
    echo "❌ API Prod ERRADA"
fi
echo ""

echo "Testando /test/api/health..."
API_TEST=$(curl -s http://localhost:8080/test/api/health 2>/dev/null)
if echo "$API_TEST" | grep -q '"port":"3002"'; then
    echo "✅ API Test OK"
else
    echo "❌ API Test ERRADA"
fi
echo ""

echo "Testando / (produção)..."
WEB_PROD=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null)
if [ "$WEB_PROD" = "200" ]; then
    echo "✅ Web Prod OK (HTTP $WEB_PROD)"
else
    echo "❌ Web Prod ERRADO (HTTP $WEB_PROD)"
fi
echo ""

echo "Testando /test (testes)..."
WEB_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/test/ 2>/dev/null)
if [ "$WEB_TEST" = "200" ]; then
    echo "✅ Web Test OK (HTTP $WEB_TEST)"
else
    echo "❌ Web Test ERRADO (HTTP $WEB_TEST)"
fi
echo ""

echo "=========================================="
echo "RECARREGAMENTO COMPLETO!"
echo "=========================================="
echo ""
echo "Se ainda houver problemas:"
echo "  1. Verificar credenciais: cat ~/.env-pm2"
echo "  2. Ver logs completos: pm2 logs --lines 100"
echo "  3. Verificar se PM2 carregou credenciais: pm2 env 0"
echo ""

