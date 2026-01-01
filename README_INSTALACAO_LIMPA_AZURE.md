# 🚀 Instalação Limpa - Azure SQL Database

## 🎯 Objetivo

Instalação completa do zero, já configurada para Azure SQL Database, sem SQLite.

## 📋 Passo a Passo

### Passo 1: Limpar VPS (Remove tudo que foi criado)

```bash
# Na VPS
cd /tmp  # Ou qualquer diretório fora de /var/www

# Copiar conteúdo de LIMPAR_VPS_COMPLETO.sh
nano limpar.sh
# Colar conteúdo, salvar (Ctrl+O, Enter, Ctrl+X)

chmod +x limpar.sh
bash limpar.sh
```

Isso remove:
- `/var/www/FinancialApps-def`
- `/var/www/FinancialApps-def-NEW`
- `/var/www/FinancialApps-def-FINAL`
- Configurações do PM2

### Passo 2: Instalar do Zero

```bash
# Na VPS
cd /tmp

# Copiar conteúdo de INSTALACAO_LIMPA_AZURE.sh
nano instalar.sh
# Colar conteúdo, salvar

chmod +x instalar.sh
bash instalar.sh
```

## ✅ O Que o Script Faz

1. **Cria diretório limpo**: `/var/www/FinancialApps-def`
2. **Clona repositório Git** do zero
3. **Instala dependências** (incluindo mssql)
4. **Configura .env.local** com Azure SQL Database
5. **Compila aplicação**
6. **Configura Nginx limpo**:
   - Remove symlink financialapps
   - Cria configuração nova na porta 8080
   - Remove conflitos
7. **Inicia Nginx** corretamente
8. **Inicia PM2** com Azure SQL Database
9. **Testa tudo** automaticamente

## 🔧 Configurações

- **Diretório**: `/var/www/FinancialApps-def` (limpo, único)
- **Porta API**: `3002`
- **Porta Nginx**: `8080`
- **Banco**: Azure SQL Database (configurado desde o início)
- **Sem SQLite**: Não usa SQLite em lugar nenhum

## ✅ Garantias

- ✅ **Nginx limpo** - Remove symlinks e configurações antigas
- ✅ **Porta 8080** - Não conflita com docker-proxy na porta 80
- ✅ **Azure SQL Database** - Configurado desde o início
- ✅ **Sem SQLite** - Não usa SQLite
- ✅ **Testes automáticos** - Mostra se funcionou

## 🆘 Se Ainda Não Funcionar

O script mostra:
1. Status do PM2
2. Status do Nginx
3. Teste da API direta
4. Teste via Nginx
5. Verificação de conexão Azure

Envie esses resultados se precisar de ajuda.

## 📝 Nota

Esta instalação é completamente limpa. Não herda problemas de instalações anteriores.

