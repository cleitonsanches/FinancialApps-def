@echo off
REM Script para liberar a porta 3001
echo Procurando processos usando a porta 3001...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Encontrado processo %%a usando a porta 3001
    taskkill /F /PID %%a
    echo Processo %%a finalizado
)

echo Porta 3001 liberada!
pause


