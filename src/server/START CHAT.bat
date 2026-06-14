@echo off
setlocal
title Chat Bubble
cd /d "%~dp0"

echo.
echo ========================================
echo          CHAT BUBBLE STARTER
echo ========================================
echo.

powershell.exe -NoProfile -Command "try { $health = Invoke-RestMethod 'http://127.0.0.1:3000/health' -TimeoutSec 1; if ($health.status -eq 'healthy') { exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 (
  echo Chat Bubble is already running.
  echo Close the existing Chat Bubble window before changing streams.
  echo.
  echo http://127.0.0.1:3000/chat_box
  echo http://127.0.0.1:3000/chat_box| clip
  start "" "http://127.0.0.1:3000/chat_box"
  pause
  exit /b 0
)

set "NEED_DEPENDENCIES="

where node.exe >nul 2>nul
if errorlevel 1 set "NEED_DEPENDENCIES=1"

if not exist "node_modules" set "NEED_DEPENDENCIES=1"

if defined NEED_DEPENDENCIES (
  echo [1/3] Preparing this computer...
  call "%~dp0install-dependencies.bat"
  if errorlevel 1 goto :failed
) else (
  echo [1/3] Computer is ready.
)

set "PATH=%ProgramFiles%\nodejs;%PATH%"

echo.
echo [2/3] Stream setup
call powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0configure.ps1"
if errorlevel 1 goto :failed

echo.
echo [3/3] Starting chat...
echo.
echo Use this URL in OBS Browser Source:
echo http://127.0.0.1:3000/chat_box
echo.
echo The URL was copied to your clipboard.
echo Keep this window open while streaming.
echo Press Ctrl+C here to stop the chat.
echo.

echo http://127.0.0.1:3000/chat_box| clip
start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:3000/chat_box'"

node.exe --env-file=.env index.js
exit /b %errorlevel%

:failed
echo.
echo Setup could not finish.
echo Read QUICK START.txt, then try again.
pause
exit /b 1
