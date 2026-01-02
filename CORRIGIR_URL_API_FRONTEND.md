# 🔧 Corrigir URL da API no Frontend

## Problema

O frontend estava tentando conectar em `localhost:3001`, mas:
- A API está rodando na porta **3002**
- A API é acessível via Nginx na porta **8080** através do path `/api/`

## Solução Implementada

Modificado `apps/web/src/services/api.ts` para:
1. **Em produção (no navegador)**: Usar URL relativa `/api` que funciona automaticamente com Nginx
2. **Em desenvolvimento**: Usar variável de ambiente `NEXT_PUBLIC_API_URL` ou fallback para `localhost:3001`

## Como Funciona

- Quando o frontend faz requisição para `/api/auth/login`
- O navegador envia para `http://IP-DA-VPS:8080/api/auth/login`
- O Nginx recebe e faz proxy para `http://localhost:3002/api/auth/login`
- A API NestJS processa a requisição

## Próximos Passos

1. **Fazer build do frontend**:
   ```bash
   cd /var/www/FinancialApps-def/apps/web
   npm run build
   ```

2. **Reiniciar o frontend no PM2**:
   ```bash
   pm2 restart financial-web
   ```

3. **Ou, se necessário, parar e iniciar novamente**:
   ```bash
   pm2 delete financial-web
   cd /var/www/FinancialApps-def/apps/web
   pm2 start npm --name "financial-web" -- start
   pm2 save
   ```

4. **Verificar**:
   ```bash
   pm2 list
   pm2 logs financial-web --lines 20
   ```

5. **Testar no navegador**:
   - Acesse: `http://IP-DA-VPS:8080`
   - Tente fazer login
   - Deve funcionar agora! ✅

## Variável de Ambiente (Opcional)

Se quiser configurar explicitamente, você pode criar `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://IP-DA-VPS:8080/api
```

Mas **não é necessário**, pois a URL relativa `/api` já funciona automaticamente quando acessado via Nginx.

## Nota Técnica

- URL relativa (`/api`) funciona porque o navegador resolve relativo ao `window.location.origin`
- Isso funciona perfeitamente com o proxy do Nginx
- Não precisa saber o IP da VPS em tempo de execução
- Funciona tanto em desenvolvimento quanto em produção

