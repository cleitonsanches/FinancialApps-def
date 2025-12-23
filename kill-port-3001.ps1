# Script PowerShell para liberar a porta 3001
Write-Host "Procurando processos usando a porta 3001..." -ForegroundColor Yellow

$processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Encontrado processo $pid ($($process.ProcessName)) usando a porta 3001" -ForegroundColor Red
            Stop-Process -Id $pid -Force
            Write-Host "Processo $pid finalizado" -ForegroundColor Green
        }
    }
    Write-Host "Porta 3001 liberada!" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo encontrado usando a porta 3001" -ForegroundColor Green
}


