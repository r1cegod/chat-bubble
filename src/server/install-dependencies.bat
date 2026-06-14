@echo off
setlocal
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 (
  where winget.exe >nul 2>nul
  if errorlevel 1 (
    echo This Windows installation is missing App Installer.
    echo Open Microsoft Store, install "App Installer", then try again.
    exit /b 1
  )

  echo Installing Node.js. Windows may ask for permission.
  winget install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements
  if errorlevel 1 exit /b 1
)

set "PATH=%ProgramFiles%\nodejs;%PATH%"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js was installed but Windows has not refreshed yet.
  echo Restart Windows, then open START CHAT.bat again.
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found.
  exit /b 1
)

echo Installing Chat Bubble files...
call npm.cmd ci --omit=dev
if errorlevel 1 exit /b 1

echo Computer setup complete.
