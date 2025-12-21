@echo off
REM Script para iniciar o salvamento automático
REM Este script inicia o salvamento automático em background

echo Iniciando salvamento automático...
echo O script rodara em background e salvara o projeto a cada 2 minutos
echo.

REM Tentar usar Node.js primeiro (mais confiável)
where node >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Usando Node.js para salvamento automatico...
    start /B node auto-save.js
    echo Salvamento automatico iniciado com Node.js
    echo Verifique o arquivo auto-save.log para ver os logs
) else (
    REM Se Node.js nao estiver disponivel, usar PowerShell
    echo Usando PowerShell para salvamento automatico...
    start /B powershell -ExecutionPolicy Bypass -File auto-save.ps1
    echo Salvamento automatico iniciado com PowerShell
    echo Verifique o arquivo auto-save.log para ver os logs
)

echo.
echo Para parar o salvamento automatico, feche esta janela ou use Ctrl+C
pause

