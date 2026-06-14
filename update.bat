@echo off
setlocal
cd /d "%~dp0"

git pull --ff-only
if errorlevel 1 exit /b 1

call npm ci --omit=dev
if errorlevel 1 exit /b 1

echo Update complete.
