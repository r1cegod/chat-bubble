@echo off
setlocal
cd /d "%~dp0"

if not exist "src\server\.env" (
  echo Missing src\server\.env
  echo Copy src\server\.env.example to src\server\.env and fill in the values.
  exit /b 1
)

if not exist "node_modules" (
  call npm ci --omit=dev
  if errorlevel 1 exit /b 1
)

call npm start
