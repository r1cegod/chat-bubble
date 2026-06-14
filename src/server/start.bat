@echo off
setlocal
cd /d "%~dp0"

set "NEED_DEPENDENCIES="

where node.exe >nul 2>nul
if errorlevel 1 set "NEED_DEPENDENCIES=1"

if not exist "node_modules" set "NEED_DEPENDENCIES=1"

if defined NEED_DEPENDENCIES (
  call "%~dp0install-dependencies.bat"
  if errorlevel 1 exit /b 1
)

set "PATH=%ProgramFiles%\nodejs;%PATH%"

call powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0configure.ps1"
if errorlevel 1 exit /b 1

echo.
echo Browser and OBS URL:
echo http://127.0.0.1:3000/chat_box
echo.

node.exe --env-file=.env index.js
