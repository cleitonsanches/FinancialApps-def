# Script PowerShell para enviar o script de exportação para a VPS
# Execute: .\enviar-script-vps.ps1

$vpsIP = Read-Host "Digite o IP da VPS (ou pressione Enter para usar padrão)"
if ([string]::IsNullOrWhiteSpace($vpsIP)) {
    $vpsIP = "seu-vps-ip"  # Altere para o IP real da sua VPS
}

$scriptPath = "scripts\export-sqlite-vps.sh"
$vpsPath = "/var/www/FinancialApps-def/scripts/"

Write-Host "📤 Enviando script para VPS..." -ForegroundColor Yellow
Write-Host "   IP: $vpsIP" -ForegroundColor Cyan
Write-Host "   Arquivo: $scriptPath" -ForegroundColor Cyan
Write-Host "   Destino: $vpsPath" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Arquivo não encontrado: $scriptPath" -ForegroundColor Red
    exit 1
}

try {
    # Usar scp para enviar o arquivo
    scp $scriptPath "root@${vpsIP}:${vpsPath}"
    Write-Host "✅ Script enviado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos na VPS:" -ForegroundColor Yellow
    Write-Host "   1. Conecte na VPS: ssh root@$vpsIP" -ForegroundColor Cyan
    Write-Host "   2. cd /var/www/FinancialApps-def" -ForegroundColor Cyan
    Write-Host "   3. chmod +x scripts/export-sqlite-vps.sh" -ForegroundColor Cyan
    Write-Host "   4. bash scripts/export-sqlite-vps.sh" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erro ao enviar arquivo: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Dica: Certifique-se de que:" -ForegroundColor Yellow
    Write-Host "   - Você tem acesso SSH à VPS" -ForegroundColor Cyan
    Write-Host "   - A chave SSH está configurada" -ForegroundColor Cyan
    Write-Host "   - O usuário tem permissão para escrever em $vpsPath" -ForegroundColor Cyan
}

