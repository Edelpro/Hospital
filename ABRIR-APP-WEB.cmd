@echo off
set "APP_DIR=%~dp0APP-WEB-LISTA"
if exist "%~dp0Hcu008.Api.exe" set "APP_DIR=%~dp0"

if not exist "%APP_DIR%\Hcu008.Api.exe" (
  echo No se encontro la aplicacion publicada.
  echo Ejecute primero herramientas\PUBLICAR-APP-WEB.ps1
  pause
  exit /b 1
)

cd /d "%APP_DIR%"
start "HCU 008 WEB" /min Hcu008.Api.exe --urls http://localhost:8080
ping 127.0.0.1 -n 4 >nul
start "" http://localhost:8080
