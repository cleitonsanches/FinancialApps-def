# FinancialApps

Sistema de Gestão Financeira desenvolvido com Next.js e NestJS.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação e Setup

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd FinancialApps-def
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicialize o banco de dados:**
   ```bash
   npm run setup
   ```
   
   Este comando irá:
   - Criar o banco de dados SQLite
   - Criar todas as tabelas necessárias
   - Criar usuários iniciais (admin, user, etc.)

4. **Inicie os servidores:**
   ```bash
   npm run dev
   ```
   
   Ou use o script batch:
   ```bash
   npm start
   ```

## 📍 Portas

- **Frontend (Next.js)**: `http://localhost:3000`
- **Backend (API NestJS)**: `http://localhost:3001`

## 🔐 Credenciais Padrão

Após executar o setup, você pode fazer login com:

**Administrador:**
- Email: `admin@financeapp.com`
- Senha: `admin123`

**Usuário comum:**
- Email: `user@financeapp.com`
- Senha: `user123`

**Outros usuários:**
- `cleiton.sanches@financeapp.com` / `cleiton123`
- `wanessa.nehrer@financeapp.com` / `wanessa123`

## 📁 Estrutura do Projeto

```
FinancialApps-def/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/           # Frontend Next.js
├── package.json       # Scripts do monorepo
└── README.md          # Este arquivo
```

## 🛠️ Scripts Disponíveis

### No diretório raiz:

- `npm run dev` - Inicia ambos os servidores (API + Web)
- `npm run setup` - Inicializa o banco de dados e cria usuários
- `npm run dev:api` - Inicia apenas a API
- `npm run dev:web` - Inicia apenas o frontend
- `npm start` - Usa o script batch para iniciar os servidores

### No diretório apps/api:

- `npm run init:db` - Cria o banco de dados e tabelas
- `npm run seed:admin` - Cria os usuários iniciais

## 🗄️ Banco de Dados

O projeto usa SQLite para desenvolvimento local. O arquivo `database.sqlite` é criado automaticamente na raiz do projeto quando você executa `npm run setup`.

**Importante:** O arquivo do banco de dados não é versionado no Git (está no `.gitignore`). Cada desenvolvedor precisa executar o setup localmente.

## 🔧 Troubleshooting

### Erro: "no such table: users"

Execute o setup do banco de dados:
```bash
npm run setup
```

### Erro: "npm não é reconhecido"

Certifique-se de que o Node.js está instalado e no PATH do sistema.

### Porta 3000 ou 3001 já em uso

O script `start-dev.bat` tenta liberar as portas automaticamente. Se ainda houver problemas, você pode:

1. Parar processos manualmente:
   ```powershell
   # Ver processos nas portas
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   
   # Parar processo (substitua PID pelo número)
   taskkill /F /PID <PID>
   ```

2. Ou usar portas diferentes editando os arquivos de configuração.

## 📝 Notas

- O banco de dados é SQLite local para desenvolvimento
- Para produção, configure um banco de dados apropriado (PostgreSQL, MySQL, etc.)
- As senhas dos usuários são criptografadas com bcrypt

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado.

