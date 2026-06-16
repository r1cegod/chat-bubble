@echo off
setlocal EnableExtensions
title Chat Bubble Widget Release
cd /d "%~dp0"

set "REPOSITORY=r1cegod/chat-bubble"
set "DEFAULT_BRANCH=main"
set "ACTIONS_URL=https://github.com/%REPOSITORY%/actions/workflows/release.yml"
set "RELEASES_URL=https://github.com/%REPOSITORY%/releases"
set "VERSION_BUMPED="
set "RELEASE_COMMITTED="

echo.
echo ========================================
echo      CHAT BUBBLE WIDGET RELEASE
echo ========================================
echo.
echo This button releases the StreamElements widget handoff.
echo.
echo The user path is:
echo   1. connect YouTube to StreamElements with full permission
echo   2. make a StreamElements overlay/layout at 1400 x 3000
echo   3. add Static/Custom - Custom Widget
echo   4. Settings - Open Editor - copy/paste widget files
echo   5. copy the StreamElements overlay link into OBS Browser Source
echo.
echo SE.Live is optional OBS convenience. StreamElements cloud owns hosting.
echo.
echo This button:
echo   1. requires a synchronized main branch
echo   2. checks the widget JavaScript and JSON
echo   3. builds the StreamElements widget ZIP locally
echo   4. bumps and commits the release version plus widget handoff files
echo   5. pushes main and the matching version tag
echo   6. waits for the GitHub release-safety workflow
echo.
echo Changes outside the widget/release handoff files are left untouched.
if /i "%~1"=="check" echo CHECK MODE: no version, commit, tag, or release will be created.
echo.

call :require_command git.exe Git
if errorlevel 1 goto :failed

call :require_command node.exe Node.js
if errorlevel 1 goto :failed

call :require_command npm.cmd npm
if errorlevel 1 goto :failed

call :require_command powershell.exe PowerShell
if errorlevel 1 goto :failed

call :require_command gh.exe GitHub CLI
if errorlevel 1 goto :failed

gh.exe auth status >nul 2>nul
if errorlevel 1 (
  echo GitHub CLI is not logged in.
  echo Run: gh auth login
  goto :failed
)

gh.exe auth setup-git
if errorlevel 1 (
  echo GitHub CLI could not configure Git authentication.
  goto :failed
)

git.exe remote set-url --push origin "https://github.com/%REPOSITORY%.git"
if errorlevel 1 (
  echo Could not configure the authenticated GitHub push URL.
  goto :failed
)

gh.exe secret list --repo "%REPOSITORY%" | findstr /b /c:"VIRUSTOTAL_API_KEY" >nul
if errorlevel 1 (
  echo GitHub secret VIRUSTOTAL_API_KEY is missing.
  echo Run: gh secret set VIRUSTOTAL_API_KEY --repo %REPOSITORY%
  goto :failed
)

for /f "delims=" %%B in ('git.exe branch --show-current') do set "BRANCH=%%B"
if /i not "%BRANCH%"=="%DEFAULT_BRANCH%" (
  echo Releases must start from %DEFAULT_BRANCH%.
  echo Current branch: %BRANCH%
  goto :failed
)

echo Cleaning Windows metadata from Git internals...
for /f "delims=" %%F in ('dir /b /s .git\desktop.ini 2^>nul') do (
  del /f /q "%%F" >nul 2>nul
)

echo [1/6] Synchronizing %DEFAULT_BRANCH%...
git.exe fetch origin "%DEFAULT_BRANCH%"
if errorlevel 1 goto :failed

for /f "delims=" %%H in ('git.exe rev-parse HEAD') do set "LOCAL_HEAD=%%H"
for /f "delims=" %%H in ('git.exe rev-parse origin/%DEFAULT_BRANCH%') do set "REMOTE_HEAD=%%H"

if not "%LOCAL_HEAD%"=="%REMOTE_HEAD%" (
  echo Local %DEFAULT_BRANCH% is not synchronized with origin/%DEFAULT_BRANCH%.
  echo Pull or push the existing commits before releasing.
  goto :failed
)

echo.
echo Widget/release files included:
git.exe status --short -- "RELEASE CHAT.bat" src/widget "src/server/QUICK START.txt" src/server/make-release.ps1 "src/server/RELEASE NOTES.md" "src/server/DEV NOTES.md" src/server/package.json src/server/package-lock.json
echo.

echo.
echo [2/6] Running widget checks...
node.exe --check src/widget/widget.js
if errorlevel 1 goto :failed

node.exe -e "JSON.parse(require('fs').readFileSync('src/widget/widgetfield.json','utf8')); JSON.parse(require('fs').readFileSync('src/widget/widgetdata.json','utf8'));"
if errorlevel 1 goto :failed

for /f "delims=" %%F in ('dir /b /s src\widget\desktop*.ini 2^>nul') do (
  echo Remove Windows metadata before release:
  echo %%F
  goto :failed
)

echo.
echo [3/6] Building StreamElements widget package...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File src/server/make-release.ps1
if errorlevel 1 goto :failed

if /i "%~1"=="check" (
  echo.
  echo Checking work-time totals...
  node.exe tools/create-release-note.mjs "0.0.0" --check
  if errorlevel 1 goto :failed

  echo.
  echo ========================================
  echo        WIDGET RELEASE CHECK PASSED
  echo ========================================
  echo.
  echo GitHub login, VirusTotal secret, branch synchronization,
  echo widget syntax, widget JSON, and local package build are ready.
  exit /b 0
)

echo.
set "BUMP=patch"
set /p "BUMP=Version bump [patch/minor/major/x.y.z] (default patch): "
if "%BUMP%"=="" set "BUMP=patch"

echo.
set "RELEASE_GUIDE="
set /p "RELEASE_GUIDE=Guide (default: StreamElements custom widget setup): "
if not defined RELEASE_GUIDE set "RELEASE_GUIDE=Create a 1400 x 3000 StreamElements overlay, add Static/Custom - Custom Widget, open the editor, paste the widget files, save, copy the overlay link, and add it to OBS as a 1400 x 3000 Browser Source."
set "RELEASE_GUIDE=%RELEASE_GUIDE%"

echo.
echo [4/6] Bumping release version...
for /f "delims=" %%V in (
  'node.exe -p "require('./src/server/package.json').version"'
) do set "OLD_VERSION=%%V"

call npm.cmd --prefix src/server version "%BUMP%" --no-git-tag-version
if errorlevel 1 goto :failed
set "VERSION_BUMPED=1"

for /f "delims=" %%V in (
  'node.exe -p "require('./src/server/package.json').version"'
) do set "VERSION=%%V"
set "TAG=v%VERSION%"

echo.
echo Creating release notes and work-time totals...
set "RELEASE_GUIDE=%RELEASE_GUIDE%"
node.exe tools/create-release-note.mjs "%VERSION%"
if errorlevel 1 goto :failed

echo.
set "COMMIT_MESSAGE="
set /p "COMMIT_MESSAGE=Commit name (default Release %TAG%): "
if not defined COMMIT_MESSAGE set "COMMIT_MESSAGE=Release %TAG%"

git.exe rev-parse "%TAG%" >nul 2>nul
if not errorlevel 1 (
  echo Tag %TAG% already exists locally.
  goto :failed
)

git.exe ls-remote --exit-code --tags origin "refs/tags/%TAG%" >nul 2>nul
if not errorlevel 1 (
  echo Tag %TAG% already exists on GitHub.
  goto :failed
)

git.exe add -- "RELEASE CHAT.bat" src/widget "src/server/QUICK START.txt" src/server/make-release.ps1 "src/server/RELEASE NOTES.md" "src/server/DEV NOTES.md" src/server/package.json src/server/package-lock.json
if errorlevel 1 goto :failed

git.exe commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 goto :failed
set "RELEASE_COMMITTED=1"

echo.
echo [5/6] Pushing commit and release tag...
git.exe push origin "%DEFAULT_BRANCH%"
if errorlevel 1 goto :failed

git.exe tag -a "%TAG%" -m "Chat Bubble %TAG%"
if errorlevel 1 goto :failed

git.exe push origin "%TAG%"
if errorlevel 1 goto :failed

echo.
echo [6/6] Waiting for GitHub release safety...
set "RUN_ID="
set /a "WAIT_ATTEMPT=0"

:wait_for_run
set /a "WAIT_ATTEMPT+=1"
for /f "delims=" %%R in (
  'gh.exe run list --repo "%REPOSITORY%" --workflow release.yml --branch "%TAG%" --limit 1 --json databaseId --jq ".[0].databaseId" 2^>nul'
) do set "RUN_ID=%%R"

if defined RUN_ID goto :watch_run
if %WAIT_ATTEMPT% GEQ 20 goto :run_not_found

timeout /t 3 /nobreak >nul
goto :wait_for_run

:watch_run
echo GitHub Actions run: %RUN_ID%
gh.exe run watch "%RUN_ID%" --repo "%REPOSITORY%" --exit-status
if errorlevel 1 (
  echo.
  echo Release safety failed. GitHub did not publish %TAG%.
  gh.exe run view "%RUN_ID%" --repo "%REPOSITORY%" --web
  goto :failed
)

echo.
echo ========================================
echo        RELEASE %TAG% PUBLISHED
echo ========================================
echo.
echo StreamElements widget ZIP and safety report are published.
echo.
start "" "%RELEASES_URL%/tag/%TAG%"
exit /b 0

:run_not_found
echo.
echo The tag was pushed, but the workflow run was not found yet.
echo Check the Actions page:
echo %ACTIONS_URL%
start "" "%ACTIONS_URL%"
exit /b 0

:require_command
where %~1 >nul 2>nul
if errorlevel 1 (
  echo Missing required tool: %~2
  exit /b 1
)
exit /b 0

:failed
if defined VERSION_BUMPED if not defined RELEASE_COMMITTED (
  echo.
  echo Restoring package version %OLD_VERSION%...
  call npm.cmd --prefix src/server version "%OLD_VERSION%" --no-git-tag-version >nul
)
echo.
echo Release stopped.
echo No release is safe to assume until Release safety is green.
echo.
pause
exit /b 1
