# Script de salvamento automático a cada 2 minutos
# Este script faz commit automático de todas as alterações no Git

$repoPath = $PSScriptRoot
$intervalMinutes = 2
$logFile = Join-Path $repoPath "auto-save.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

function Auto-Save {
    Set-Location $repoPath
    
    # Verificar se é um repositório Git
    if (-not (Test-Path ".git")) {
        Write-Log "Inicializando repositório Git..."
        git init
        git config user.name "Auto Save"
        git config user.email "autosave@local"
    }
    
    # Verificar se há mudanças
    $status = git status --porcelain
    if ($status) {
        Write-Log "Salvando alterações..."
        
        # Adicionar todos os arquivos
        git add -A
        
        # Fazer commit com timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "Auto-save: $timestamp"
        
        try {
            git commit -m $commitMessage
            Write-Log "✓ Alterações salvas com sucesso"
        } catch {
            Write-Log "✗ Erro ao salvar: $_"
        }
    } else {
        Write-Log "Nenhuma alteração para salvar"
    }
}

Write-Log "=== Iniciando salvamento automático (a cada $intervalMinutes minutos) ==="
Write-Log "Pressione Ctrl+C para parar"

# Loop infinito
while ($true) {
    Auto-Save
    Start-Sleep -Seconds ($intervalMinutes * 60)
}


