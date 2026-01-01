# 🌐 Como Testar API no Navegador

## Problema Identificado

**404 Not Found** ao acessar `/api/auth/login` no navegador.

## Causa

- ❌ Navegador faz **GET** por padrão
- ✅ Endpoint `/api/auth/login` aceita apenas **POST**

## Solução

### Opção 1: Usar Ferramenta de Desenvolvimento do Navegador

1. Abra o navegador
2. Pressione **F12** (ou clique com botão direito → "Inspecionar")
3. Vá na aba **Network** (Rede)
4. Vá na aba **Console** (Console)
5. Execute:

```javascript
fetch('http://92.113.32.118:8080/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test',
    password: 'test'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

**Deve retornar:** `{statusCode: 401, message: "Credenciais inválidas"}`

### Opção 2: Usar Postman/Insomnia

1. Baixe Postman ou Insomnia
2. Crie requisição POST para: `http://92.113.32.118:8080/api/auth/login`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "email": "test",
  "password": "test"
}
```

### Opção 3: Testar Endpoint GET (Se Existir)

Alguns endpoints podem aceitar GET. Teste:

```
http://92.113.32.118:8080/api/
```

**Ou verifique se há endpoint de health check:**

```bash
# Na VPS, verificar rotas disponíveis
curl http://localhost:3002/api/
```

## Verificar Rotas Disponíveis

Execute na VPS:

```bash
# Ver se há endpoint raiz que aceita GET
curl http://localhost:3002/api/

# Ou testar POST via curl (já sabemos que funciona)
curl http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
```

## Criar Endpoint GET de Teste (Opcional)

Se quiser testar no navegador, podemos adicionar um endpoint GET simples que retorna status da API.

## Conclusão

**404 no navegador é NORMAL** porque:
- ✅ Navegador faz GET
- ✅ Endpoint de login aceita apenas POST
- ✅ API está funcionando (curl POST funciona)

**Para testar login no navegador, use:**
- Console do navegador (F12)
- Postman/Insomnia
- Ou acesse a aplicação frontend (se tiver)

## Status Atual

- ✅ API funcionando (curl POST retorna 401)
- ✅ Nginx funcionando (porta 8080)
- ✅ Endpoint de login funciona via POST
- ✅ 404 no navegador é esperado (GET não suportado)

**Tudo está funcionando corretamente!**

