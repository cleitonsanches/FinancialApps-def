# Configurar PM2 para Iniciar Automaticamente

## Verificar Status Atual

Execute na VPS para verificar se o PM2 está configurado para iniciar automaticamente:

```bash
# Verificar se o PM2 startup está configurado
pm2 startup

# Ver se as aplicações estão salvas
pm2 list
pm2 save
```

## Configurar Inicialização Automática

Se o PM2 não estiver configurado para iniciar automaticamente:

```bash
# 1. Gerar script de startup (copie o comando que aparecer)
pm2 startup

# 2. Salvar a configuração atual do PM2
pm2 save

# 3. Verificar se está funcionando (reiniciar o servidor para testar)
sudo reboot
```

## Verificar Após Reinicialização

Após reiniciar o servidor, verifique se as aplicações iniciaram:

```bash
# Ver status das aplicações
pm2 status

# Ver logs
pm2 logs --lines 50
```

## Garantir que PM2 Inicie Sempre

O PM2 com `autorestart: true` no `ecosystem.config.js` garante que:
- ✅ Se a aplicação cair, reinicia automaticamente
- ✅ Se você fizer `pm2 restart`, reinicia corretamente
- ✅ Com `pm2 startup`, reinicia após reboot do servidor

## Comandos Úteis

```bash
# Ver todas as aplicações
pm2 list

# Ver logs em tempo real
pm2 logs

# Reiniciar todas as aplicações
pm2 restart all

# Parar todas as aplicações
pm2 stop all

# Iniciar todas as aplicações
pm2 start all

# Ver informações detalhadas
pm2 info financial-api
pm2 info financial-web
```

