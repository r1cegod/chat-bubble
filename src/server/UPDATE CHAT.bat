@echo off
setlocal
title Chat Bubble Update
cd /d "%~dp0"

echo.
echo ========================================
echo           CHAT BUBBLE UPDATE
echo ========================================
echo.
echo This button does not download or replace files.
echo It only opens the official GitHub release page.
echo.
echo To update:
echo.
echo 1. Download ChatBubble.zip from the release page.
echo 2. Extract it as a new folder.
echo 3. Open the old "ChatBubble Files" folder.
echo 4. Copy the .env file into the new "ChatBubble Files" folder.
echo 5. Start the new copy, then delete the old folder.
echo.
echo The .env file contains your saved API key.
echo Never send it to anyone.
echo.
echo Opening:
echo https://github.com/r1cegod/chat-bubble/releases/latest
echo.

start "" "https://github.com/r1cegod/chat-bubble/releases/latest"
pause
exit /b 0
