# 🔍 Diagnosticar Erro 400 no Nginx (Porta 8080)

## Status

- ✅ Porta 3002 (direta): Retorna 401 = **Funcionando!**
- ⚠️ Porta 8080 (Nginx): Retorna 400 = **Nginx funcionando, mas há diferença**

## Diferença entre 400 e 401

- **401 Unauthorized** = Credenciais inválidas (esperado)
- **400 Bad Request** = Requisição malformada ou problema na rota

## Teste Detalhado

Execute na VPS:

```bash
# 1. Testar API direta (deve retornar 401)
echo "=== Teste API Direta (porta 3002) ==="
curl -v http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' 2>&1 | grep -E "(HTTP|401|400)"

# 2. Testar via Nginx (porta 8080)
echo "=== Teste via Nginx (porta 8080) ==="
curl -v http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' 2>&1 | grep -E "(HTTP|401|400)"

# 3. Ver resposta completa do Nginx
echo "=== Resposta Completa Nginx ==="
curl http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
```

## Possíveis Causas

### 1. Nginx Está Modificando a Requisição

Verificar configuração do Nginx:

```bash
cat /etc/nginx/sites-enabled/default | grep -A 15 "location /api/"
```

**Deve ter:**
```nginx
location /api/ {
    proxy_pass http://localhost:3002;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2. Problema com Path/Rota

Nginx pode estar enviando `/api/api/auth/login` (duplicado).

Teste:

```bash
# Testar sem /api no proxy_pass
# (Se Nginx já adiciona /api, pode estar duplicando)
```

### 3. Headers Diferentes

Nginx pode estar modificando headers.

## Solução: Verificar Configuração Nginx

```bash
# Ver configuração atual
cat /etc/nginx/sites-enabled/default

# Verificar se proxy_pass está correto
grep -A 10 "location /api/" /etc/nginx/sites-enabled/default
```

## Configuração Nginx Correta

```nginx
location /api/ {
    proxy_pass http://localhost:3002/api/;  # Note: /api/ no final
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**OU** (se aplicação já tem /api no prefixo):

```nginx
location /api/ {
    proxy_pass http://localhost:3002;  # Sem /api/ no final
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Teste Rápido

**400 pode ser aceitável se:**
- A aplicação está respondendo
- Não é 502 (Bad Gateway)
- Apenas formato da requisição diferente

**Mas idealmente deveria retornar 401 como na porta 3002.**

## Próximo Passo

Execute os testes acima e me envie:
1. Resposta completa do curl na porta 8080
2. Configuração do Nginx (location /api/)
3. Comparação entre porta 3002 e 8080

