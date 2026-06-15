@echo off
setlocal
title Chat Bubble
cd /d "%~dp0"

echo.
echo ========================================
echo          CHAT BUBBLE STARTER
echo ========================================
echo.

curl.exe --silent --fail --max-time 1 http://127.0.0.1:3000/health >nul 2>nul
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

where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js is required but is not installed.
  echo.
  echo Opening the official Node.js download page:
  echo https://nodejs.org/en/download
  echo.
  echo Install the LTS version, then open START CHAT.bat again.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)

echo.
echo [1/2] Stream setup
node.exe configure.js
if errorlevel 1 goto :failed

echo.
echo [2/2] Starting chat...
echo.
echo Use this URL in OBS Browser Source:
echo http://127.0.0.1:3000/chat_box
echo.
echo The URL was copied to your clipboard.
echo Keep this window open while streaming.
echo Press Ctrl+C here to stop the chat.
echo Open the copied URL in a browser to preview it.
echo.

echo http://127.0.0.1:3000/chat_box| clip
node.exe --env-file=.env index.js
exit /b %errorlevel%

:failed
echo.
echo Setup could not finish.
echo Read QUICK START.txt, then try again.
pause
exit /b 1
