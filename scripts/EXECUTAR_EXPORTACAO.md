# Como Executar o Script de Exportação

## ⚠️ Problema: "Não é um comando reconhecido"

Isso geralmente acontece por:
1. Política de execução do PowerShell bloqueando scripts
2. Caminho incorreto do script
3. Sintaxe incorreta do comando

---

## ✅ Soluções

### **Opção 1: Executar com caminho completo (Recomendado)**

```powershell
# Certifique-se de estar na raiz do projeto
cd C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def

# Execute com caminho completo
powershell -ExecutionPolicy Bypass -File .\scripts\export-data.ps1
```

### **Opção 2: Mudar política de execução (Temporária)**

```powershell
# Permitir execução temporariamente para esta sessão
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Agora execute o script
.\scripts\export-data.ps1
```

### **Opção 3: Executar diretamente com PowerShell**

```powershell
# Abra PowerShell como Administrador e execute:
cd C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def
powershell -File scripts\export-data.ps1
```

### **Opção 4: Executar conteúdo do script diretamente**

Se nada funcionar, você pode copiar e colar o conteúdo do script no PowerShell, mas é mais trabalhoso.

---

## 🔍 Verificar se o Script Existe

Antes de executar, verifique:

```powershell
# Verificar se o arquivo existe
Test-Path .\scripts\export-data.ps1

# Se retornar True, o arquivo existe
# Se retornar False, verifique o caminho
```

---

## 📝 Passo a Passo Completo

```powershell
# 1. Abra PowerShell
# 2. Navegue para o diretório do projeto
cd C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def

# 3. Verifique se está no lugar certo
Get-Location
# Deve mostrar: C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def

# 4. Verifique se o script existe
Test-Path .\scripts\export-data.ps1
# Deve retornar: True

# 5. Execute o script (escolha uma das opções acima)
powershell -ExecutionPolicy Bypass -File .\scripts\export-data.ps1
```

---

## 🚨 Erro Específico?

Se você vir uma mensagem específica, me diga qual é para eu ajudar melhor!

Possíveis mensagens:
- "A execução de scripts está desabilitada neste sistema"
- "Cannot be loaded because running scripts is disabled"
- "No such file or directory"
- "Não é reconhecido como um cmdlet"




