@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
  call npm ci --omit=dev
  if errorlevel 1 exit /b 1
)

call powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0configure.ps1"
if errorlevel 1 exit /b 1

echo.
echo Browser and OBS URL:
echo http://127.0.0.1:3000/chat_box
echo.

call npm start
