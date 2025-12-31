# Script para verificar e copiar chave SSH corretamente

Write-Host "=== VERIFICAÇÃO DA CHAVE SSH ===" -ForegroundColor Cyan
Write-Host ""

$keyPath = "$env:USERPROFILE\.ssh\vps_deploy_key"

# Verificar se a chave existe
if (-not (Test-Path $keyPath)) {
    Write-Host "❌ Chave não encontrada em: $keyPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Chave encontrada!" -ForegroundColor Green
Write-Host ""

# Ler a chave privada
$privateKey = Get-Content $keyPath -Raw

# Verificar se começa e termina corretamente
if ($privateKey -notmatch "-----BEGIN OPENSSH PRIVATE KEY-----") {
    Write-Host "❌ ERRO: Chave não começa com '-----BEGIN OPENSSH PRIVATE KEY-----'" -ForegroundColor Red
    exit 1
}

if ($privateKey -notmatch "-----END OPENSSH PRIVATE KEY-----") {
    Write-Host "❌ ERRO: Chave não termina com '-----END OPENSSH PRIVATE KEY-----'" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Formato da chave está correto!" -ForegroundColor Green
Write-Host ""

# Limpar quebras de linha extras e espaços
$cleanKey = $privateKey.Trim()

# Salvar chave limpa em arquivo temporário para copiar
$tempFile = "$env:TEMP\ssh_key_clean.txt"
$cleanKey | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline

Write-Host "=== CHAVE PRIVADA LIMPA (copie TUDO abaixo) ===" -ForegroundColor Yellow
Write-Host ""
Write-Host $cleanKey -ForegroundColor White
Write-Host ""
Write-Host "=== FIM DA CHAVE ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 A chave também foi salva em: $tempFile" -ForegroundColor Cyan
Write-Host "   Você pode abrir esse arquivo e copiar o conteúdo completo" -ForegroundColor Cyan
Write-Host ""

# Mostrar chave pública
Write-Host "=== CHAVE PÚBLICA (para a VPS) ===" -ForegroundColor Green
Write-Host ""
$publicKey = Get-Content "$keyPath.pub"
Write-Host $publicKey -ForegroundColor White
Write-Host ""

Write-Host "=== INSTRUCOES ===" -ForegroundColor Cyan
Write-Host "1. Copie a chave PRIVADA acima e cole no GitHub Secret VPS_SSH_KEY" -ForegroundColor White
Write-Host "2. Copie a chave PUBLICA acima e adicione na VPS" -ForegroundColor White
Write-Host ""

