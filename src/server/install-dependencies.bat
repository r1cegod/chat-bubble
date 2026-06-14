@echo off
setlocal
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 (
  where winget.exe >nul 2>nul
  if errorlevel 1 (
    echo Windows Package Manager is required to install Node.js.
    echo Install App Installer from Microsoft Store, then run this file again.
    exit /b 1
  )

  echo Installing Node.js LTS...
  winget install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements
  if errorlevel 1 exit /b 1
)

set "PATH=%ProgramFiles%\nodejs;%PATH%"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js installed, but node.exe was not found.
  echo Restart Windows or reopen this folder, then run this file again.
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found.
  exit /b 1
)

echo Installing runtime dependencies...
call npm.cmd ci --omit=dev
if errorlevel 1 exit /b 1

echo Dependencies ready.
