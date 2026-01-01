@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Integration Test Script for WR Trading Pro
:: Tests PostgreSQL, Prisma, MT5 Service, and WebSocket

echo.
echo ========================================
echo 🚀 WR TRADING PRO - INTEGRATION TEST
echo ========================================
echo.

:: Colors (Windows 10+)
if "%CI%"=="" (
    for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
        set "DEL=%%a"
    )
    call :colorEcho 0C "🔴 ERROR"
    call :colorEcho 0A "✅ SUCCESS"
    call :colorEcho 0E "⚠️  WARNING"
    call :colorEcho 0B "ℹ️  INFO"
    call :colorEcho 0D "🧪 TEST"
)

:: Configuration
set "PROJECT_ROOT=%~dp0.."
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "MT5_SERVICE_DIR=%BACKEND_DIR%\mt5_service"
set "SCRIPTS_DIR=%PROJECT_ROOT%\scripts"
set "PRISMA_SCHEMA=%PROJECT_ROOT%\prisma\schema.prisma"
set "ENV_FILE=%BACKEND_DIR%\.env"
set "ENV_EXAMPLE=%BACKEND_DIR%\.env.example"

:: Test results
set "ALL_TESTS_PASSED=1"
set "TEST_COUNT=0"
set "PASS_COUNT=0"
set "FAIL_COUNT=0"

:: Functions
:colorEcho
echo off
<nul set /p ".=%DEL%" > "%~2"
findstr /v /a:%1 /R "^$" "%~2" nul
del "%~2" > nul 2>&1
goto :eof

:printHeader
echo.
echo ========================================
echo %~1
echo ========================================
echo.
goto :eof

:printSuccess
call :colorEcho 0A "✅ %~1"
goto :eof

:printError
call :colorEcho 0C "❌ %~1"
goto :eof

:printWarning
call :colorEcho 0E "⚠️  %~1"
goto :eof

:printInfo
call :colorEcho 0B "ℹ️  %~1"
goto :eof

:printTest
call :colorEcho 0D "🧪 %~1"
goto :eof

:incrementTest
set /a TEST_COUNT+=1
goto :eof

:recordResult
if "%~1"=="PASS" (
    set /a PASS_COUNT+=1
    call :printSuccess "%~2"
) else (
    set /a FAIL_COUNT+=1
    call :printError "%~2"
    set "ALL_TESTS_PASSED=0"
)
goto :eof

:: Main execution
call :printHeader "🚀 INICIANDO TESTES DE INTEGRAÇÃO"
call :printInfo "Diretório: %PROJECT_ROOT%"
call :printInfo "Data/Hora: %date% %time%"

:: Check Python
call :printHeader "🐍 VERIFICANDO PYTHON"
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python -c "import sys; print(f'Python {sys.version}')" 2>nul
    call :recordResult "PASS" "Python instalado"
) else (
    call :recordResult "FAIL" "Python não encontrado"
    goto :summary
)

:: Check Node.js
call :printHeader "📦 VERIFICANDO NODE.JS"
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
    call :printInfo "Node.js !NODE_VERSION!"
    call :recordResult "PASS" "Node.js instalado"
) else (
    call :recordResult "FAIL" "Node.js não encontrado"
    goto :summary
)

:: Check PostgreSQL
call :printHeader "🐘 VERIFICANDO POSTGRESQL"
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% equ 0 (
    call :recordResult "PASS" "PostgreSQL rodando"
) else (
    call :recordResult "WARNING" "PostgreSQL não está rodando"
    call :printInfo "Inicie PostgreSQL com: pg_ctl start"
)

:: Check .env file
call :printHeader "📁 VERIFICANDO ARQUIVO .ENV"
if exist "%ENV_FILE%" (
    call :recordResult "PASS" "Arquivo .env encontrado"
    call :printInfo "Local: %ENV_FILE%"
) else (
    if exist "%ENV_EXAMPLE%" (
        call :printWarning "Arquivo .env não encontrado"
        call :printInfo "Copiando .env.example para .env"
        copy "%ENV_EXAMPLE%" "%ENV_FILE%" >nul 2>&1
        if %errorlevel% equ 0 (
            call :recordResult "PASS" ".env criado a partir de .env.example"
        ) else (
            call :recordResult "FAIL" "Falha ao criar .env"
        )
    ) else (
        call :recordResult "FAIL" "Nem .env nem .env.example encontrados"
    )
)

:: Install Python dependencies
call :printHeader "📦 INSTALANDO DEPENDÊNCIAS PYTHON"
cd /d "%BACKEND_DIR%"
if exist "requirements.txt" (
    call :printInfo "Instalando dependências do backend..."
    pip install -r requirements.txt >nul 2>&1
    if %errorlevel% equ 0 (
        call :recordResult "PASS" "Dependências Python instaladas"
    ) else (
        call :recordResult "FAIL" "Falha ao instalar dependências Python"
    )
) else (
    call :recordResult "FAIL" "requirements.txt não encontrado"
)

:: Install Node.js dependencies
call :printHeader "📦 INSTALANDO DEPENDÊNCIAS NODE.JS"
cd /d "%PROJECT_ROOT%"
if exist "package.json" (
    call :printInfo "Instalando dependências do frontend..."
    npm install --silent >nul 2>&1
    if %errorlevel% equ 0 (
        call :recordResult "PASS" "Dependências Node.js instaladas"
    ) else (
        call :recordResult "FAIL" "Falha ao instalar dependências Node.js"
    )
) else (
    call :recordResult "FAIL" "package.json não encontrado"
)

:: Run Prisma migrations
call :printHeader "🗄️  EXECUTANDO MIGRAÇÕES PRISMA"
cd /d "%PROJECT_ROOT%"
if exist "prisma\schema.prisma" (
    call :printInfo "Gerando cliente Prisma..."
    npx prisma generate >nul 2>&1
    if %errorlevel% equ 0 (
        call :recordResult "PASS" "Cliente Prisma gerado"
    ) else (
        call :recordResult "FAIL" "Falha ao gerar cliente Prisma"
    )
    
    call :printInfo "Executando migrations..."
    npx prisma migrate dev --name init >nul 2>&1
    if %errorlevel% equ 0 (
        call :recordResult "PASS" "Migrations Prisma executadas"
    ) else (
        call :recordResult "WARNING" "Falha nas migrations Prisma (pode ser normal se já existirem)"
    )
) else (
    call :recordResult "FAIL" "schema.prisma não encontrado"
)

:: Start MT5 service in background
call :printHeader "🔌 INICIANDO SERVIÇO MT5"
cd /d "%MT5_SERVICE_DIR%"
call :printInfo "Iniciando serviço MT5 em background..."
start "MT5 Service" /B python main.py > mt5_service.log 2>&1
set "MT5_PID=%errorlevel%"

:: Wait for service to start
call :printInfo "Aguardando 5 segundos para inicialização..."
timeout /t 5 /nobreak >nul

:: Check if service is running
tasklist /FI "WINDOWTITLE eq MT5 Service" 2>nul | find /I "python" >nul
if %errorlevel% equ 0 (
    call :recordResult "PASS" "Serviço MT5 iniciado (PID: %MT5_PID%)"
    call :printInfo "Logs: %MT5_SERVICE_DIR%\mt5_service.log"
) else (
    call :recordResult "FAIL" "Serviço MT5 não iniciou"
    type mt5_service.log 2>nul | findstr /B /C:"ERROR" /C:"Traceback"
    goto :cleanup
)

:: Run MT5 connection test
call :printHeader "🧪 TESTANDO CONEXÃO MT5"
cd /d "%MT5_SERVICE_DIR%"
call :printTest "Executando test_connection.py..."
python test_connection.py
if %errorlevel% equ 0 (
    call :recordResult "PASS" "Teste de conexão MT5 passou"
) else (
    call :recordResult "FAIL" "Teste de conexão MT5 falhou"
)

:: Run WebSocket test
call :printHeader "🧪 TESTANDO WEBSOCKET"
cd /d "%MT5_SERVICE_DIR%"
call :printTest "Executando test_websocket.py..."
python test_websocket.py
if %errorlevel% equ 0 (
    call :recordResult "PASS" "Teste WebSocket passou"
) else (
    call :recordResult "FAIL" "Teste WebSocket falhou"
)

:: Test frontend build
call :printHeader "🌐 TESTANDO BUILD FRONTEND"
cd /d "%PROJECT_ROOT%"
call :printTest "Verificando build do Next.js..."
npx next build >nul 2>&1
if %errorlevel% equ 0 (
    call :recordResult "PASS" "Build do Next.js bem-sucedido"
) else (
    call :recordResult "WARNING" "Build do Next.js falhou (pode ser normal em desenvolvimento)"
)

:cleanup
:: Stop MT5 service
call :printHeader "🛑 FINALIZANDO SERVIÇOS"
if "%MT5_PID%" neq "" (
    call :printInfo "Parando serviço MT5..."
    taskkill /FI "WINDOWTITLE eq MT5 Service" /F >nul 2>&1
    if %errorlevel% equ 0 (
        call :printSuccess "Serviço MT5 parado"
    ) else (
        call :printWarning "Não foi possível parar serviço MT5"
    )
)

:summary
:: Print summary
call :printHeader "📊 RESUMO DOS TESTES"
call :printInfo "Total de testes: %TEST_COUNT%"
call :printInfo "Testes passados: %PASS_COUNT%"
call :printInfo "Testes falhados: %FAIL_COUNT%"

if %ALL_TESTS_PASSED% equ 1 (
    echo.
    call :colorEcho 0A "========================================"
    call :colorEcho 0A "🎉 TODOS OS TESTES PASSARAM!"
    call :colorEcho 0A "========================================"
    echo.
    call :printInfo "✅ Sistema pronto para uso!"
    call :printInfo "Para iniciar o frontend: npm run dev"
    call :printInfo "Para iniciar o backend: python -m mt5_service.main"
    exit /b 0
) else (
    echo.
    call :colorEcho 0C "========================================"
    call :colorEcho 0C "❌ ALGUNS TESTES FALHARAM!"
    call :colorEcho 0C "========================================"
    echo.
    call :printWarning "Verifique os logs acima para detalhes"
    call :printInfo "Problemas comuns:"
    call :printInfo "  1. Terminal MT5 não está aberto"
    call :printInfo "  2. PostgreSQL não está rodando"
    call :printInfo "  3. Credenciais incorretas no .env"
    exit /b 1
)

:: Cleanup temp files
if exist "%MT5_SERVICE_DIR%\mt5_service.log" (
    del "%MT5_SERVICE_DIR%\mt5_service.log" >nul 2>&1
)

endlocal
