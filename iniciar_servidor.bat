@echo off
setlocal
title Servidor Local - Projeto RH
echo ==============================================
echo       Servidor da Intranet - Projeto RH
echo ==============================================
echo.

REM Pega o IP local usando PowerShell para mostrar qual link enviar para o RH
for /f "delims=" %%A in ('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi','Ethernet*' -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress"') do set LOCAL_IP=%%A

if "%LOCAL_IP%"=="" (
    set LOCAL_IP=IP_DA_SUA_MAQUINA
)

echo [LINK PARA ENVIAR AO RH]: http://%LOCAL_IP%:8000
echo.
echo Mantenha esta janela preta aberta enquanto o RH estiver usando o sistema.
echo Pressione CTRL+C se quiser desligar o servidor.
echo ----------------------------------------------
echo.

:: Tenta iniciar com Python (muito comum de ja estar instalado)
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Iniciando servidor usando Python...
    start http://localhost:8000
    python -m http.server 8000 --bind 0.0.0.0
    pause
    exit
)

:: Tenta iniciar com Node.js (npx) caso o Python nao esteja instalado
call npx --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Iniciando servidor usando Node.js...
    start http://localhost:8000
    call npx http-server -p 8000 -a 0.0.0.0 -c-1
    pause
    exit
)

echo [ERRO] Nenhuma ferramenta de servidor detectada!
echo Para que este script funcione e seu computador vire um servidor,
echo voce precisa instalar o Python ou o Node.js.
echo.
echo Baixe o Python aqui (marque "Add Python to PATH" na instalacao):
echo https://www.python.org/downloads/
pause
