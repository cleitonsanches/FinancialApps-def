# Script PowerShell para exportar dados de referência do banco local
# Execute no PowerShell: .\scripts\export-data.ps1

Write-Host "🚀 Iniciando exportação de dados..." -ForegroundColor Cyan

# Mudar para o diretório raiz do projeto
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Caminho do banco de dados local
$dbPath = Join-Path $projectRoot "apps" "api" "database.sqlite"
$exportDir = Join-Path $projectRoot "export"

# Verificar se o banco existe
if (-not (Test-Path $dbPath)) {
    Write-Host "❌ Banco de dados não encontrado em: $dbPath" -ForegroundColor Red
    Write-Host "⚠️  Tente executar de: C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def" -ForegroundColor Yellow
    exit 1
}

# Criar pasta de exportação
if (-not (Test-Path $exportDir)) {
    New-Item -ItemType Directory -Path $exportDir -Force | Out-Null
    Write-Host "✅ Pasta de exportação criada: $exportDir" -ForegroundColor Green
}

Write-Host "📂 Banco de dados: $dbPath" -ForegroundColor Cyan
Write-Host "📁 Pasta de exportação: $exportDir" -ForegroundColor Cyan
Write-Host ""

# Verificar se sqlite3 está disponível
try {
    $sqliteVersion = sqlite3 --version 2>&1
    Write-Host "✅ SQLite encontrado: $sqliteVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ SQLite3 não encontrado!" -ForegroundColor Red
    Write-Host "💡 Instale SQLite3 ou use o SQLite que vem com o Node.js" -ForegroundColor Yellow
    Write-Host "   Download: https://www.sqlite.org/download.html" -ForegroundColor Yellow
    exit 1
}

# Função para exportar tabela
function Export-Table {
    param(
        [string]$TableName,
        [string]$FileName
    )
    
    $csvPath = Join-Path $exportDir $FileName
    
    Write-Host "📤 Exportando $TableName..." -ForegroundColor Yellow
    
    # Verificar se a tabela existe e tem dados
    $countQuery = "SELECT COUNT(*) FROM $TableName;"
    $count = sqlite3 $dbPath $countQuery 2>&1
    
    if ($LASTEXITCODE -ne 0 -or $count -eq $null) {
        Write-Host "   ⚠️  Tabela $TableName não existe ou está vazia (ignorando...)" -ForegroundColor Yellow
        return $false
    }
    
    $countInt = [int]$count
    if ($countInt -eq 0) {
        Write-Host "   ⚠️  Tabela $TableName está vazia (ignorando...)" -ForegroundColor Yellow
        return $false
    }
    
    # Exportar com headers
    $query = ".mode csv`n.headers on`n.output `"$csvPath`"`nSELECT * FROM $TableName;"
    $query | sqlite3 $dbPath
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $csvPath)) {
        $fileSize = (Get-Item $csvPath).Length
        Write-Host "   ✅ Exportado: $FileName ($countInt registros, $([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "   ❌ Erro ao exportar $TableName" -ForegroundColor Red
        return $false
    }
}

# Tabelas a exportar (em ordem de dependências)
$tables = @(
    @{ Name = "service_types"; File = "service_types.csv"; Required = $false },
    @{ Name = "chart_of_accounts"; File = "chart_of_accounts.csv"; Required = $true },
    @{ Name = "bank_accounts"; File = "bank_accounts.csv"; Required = $true },
    @{ Name = "clients"; File = "clients.csv"; Required = $true },
    @{ Name = "contacts"; File = "contacts.csv"; Required = $false },
    @{ Name = "proposal_templates"; File = "proposal_templates.csv"; Required = $false },
    @{ Name = "project_templates"; File = "project_templates.csv"; Required = $false },
    @{ Name = "project_template_phases"; File = "project_template_phases.csv"; Required = $false },
    @{ Name = "project_template_tasks"; File = "project_template_tasks.csv"; Required = $false },
    @{ Name = "subscription_products"; File = "subscription_products.csv"; Required = $false }
)

$exportedCount = 0
$failedCount = 0

foreach ($table in $tables) {
    $exported = Export-Table -TableName $table.Name -FileName $table.File
    
    if ($exported) {
        $exportedCount++
    } else {
        $failedCount++
        if ($table.Required) {
            Write-Host "   ⚠️  ATENÇÃO: Tabela $($table.Name) é importante mas não foi exportada!" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Resumo da Exportação" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Exportadas: $exportedCount tabelas" -ForegroundColor Green
Write-Host "⚠️  Ignoradas: $failedCount tabelas" -ForegroundColor Yellow
Write-Host "📁 Local: $exportDir" -ForegroundColor Cyan
Write-Host ""

# Criar arquivo de metadados
$metadataPath = Join-Path $exportDir "export-info.txt"
$metadata = @"
Exportação de Dados - FinancialApps
Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Banco de origem: $dbPath

Tabelas exportadas:
$($tables | ForEach-Object { "  - $($_.File)" } | Out-String)

INSTRUÇÕES:
1. Verifique se todos os arquivos CSV foram criados
2. Copie a pasta 'export' para a VPS
3. Na VPS, execute: ./scripts/import-data.sh
4. ATENÇÃO: Ajuste o company_id antes de importar (veja ajustar-company-id.sh)
"@

$metadata | Out-File -FilePath $metadataPath -Encoding UTF8
Write-Host "📄 Arquivo de informações criado: export-info.txt" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Exportação concluída!" -ForegroundColor Green
Write-Host "📦 Próximo passo: Copie a pasta 'export' para a VPS" -ForegroundColor Yellow

