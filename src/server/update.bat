@echo off
setlocal
cd /d "%~dp0"

call powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0update.ps1"
if errorlevel 1 exit /b 1

call "%~dp0install-dependencies.bat"
if errorlevel 1 exit /b 1

echo Update complete.
