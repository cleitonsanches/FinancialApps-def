@echo off
REM Script para iniciar os servidores de desenvolvimento
echo ========================================
echo Iniciando servidores de desenvolvimento
echo ========================================
echo.

REM Parar processos nas portas 3000 e 3001 se estiverem em uso
echo Verificando portas...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Parando processo %%a na porta 3000...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Parando processo %%a na porta 3001...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Iniciando servidor da API (porta 3001)...
start "API Server" cmd /k "cd apps\api && npm run dev"

timeout /t 3 /nobreak >nul

echo Iniciando servidor Web (porta 3000)...
start "Web Server" cmd /k "cd apps\web && npm run dev"

echo.
echo ========================================
echo Servidores iniciados!
echo ========================================
echo.
echo API: http://localhost:3001
echo Web: http://localhost:3000
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul


