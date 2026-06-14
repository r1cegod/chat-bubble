@echo off
setlocal
title Chat Bubble Updater
cd /d "%~dp0"

echo.
echo ========================================
echo          CHAT BUBBLE UPDATER
echo ========================================
echo.
echo Close CHAT BUBBLE before updating.
echo.

call powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0update.ps1"
if errorlevel 1 goto :failed

call "%~dp0install-dependencies.bat"
if errorlevel 1 goto :failed

echo.
echo Update complete.
echo You can now open START CHAT.bat.
pause
exit /b 0

:failed
echo.
echo Update failed. Your API key was not deleted.
echo Check your internet connection and try again.
pause
exit /b 1
