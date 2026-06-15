@echo off
setlocal EnableExtensions
title Chat Bubble Release
cd /d "%~dp0"

set "REPOSITORY=r1cegod/chat-bubble"
set "DEFAULT_BRANCH=main"
set "ACTIONS_URL=https://github.com/%REPOSITORY%/actions/workflows/release.yml"
set "RELEASES_URL=https://github.com/%REPOSITORY%/releases"

echo.
echo ========================================
echo          CHAT BUBBLE RELEASE
echo ========================================
echo.
echo This button:
echo   1. requires a synchronized main branch
echo   2. includes every change under src/server automatically
echo   3. bumps and commits the server version
echo   4. creates and pushes the matching version tag
echo   5. waits for the GitHub release-safety workflow
echo.
echo Changes outside src/server are left untouched.
echo The slower behavior check runs after publication.
if /i "%~1"=="check" echo CHECK MODE: no version, commit, tag, or release will be created.
echo.

call :require_command git.exe Git
if errorlevel 1 goto :failed

call :require_command node.exe Node.js
if errorlevel 1 goto :failed

call :require_command npm.cmd npm
if errorlevel 1 goto :failed

call :require_command gh.exe GitHub CLI
if errorlevel 1 goto :failed

gh.exe auth status >nul 2>nul
if errorlevel 1 (
  echo GitHub CLI is not logged in.
  echo Run: gh auth login
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

echo [1/5] Synchronizing %DEFAULT_BRANCH%...
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
echo Server files included in this release:
git.exe status --short -- src/server
echo.

echo.
echo [2/5] Running fast local checks...
call npm.cmd run check
if errorlevel 1 goto :failed

call npm.cmd --prefix src/server run check
if errorlevel 1 goto :failed

if /i "%~1"=="check" (
  echo.
  echo ========================================
  echo          RELEASE CHECK PASSED
  echo ========================================
  echo.
  echo GitHub login, VirusTotal secret, branch synchronization,
  echo and fast source checks are ready.
  exit /b 0
)

echo.
set "BUMP=patch"
set /p "BUMP=Version bump [patch/minor/major/x.y.z] (default patch): "
if "%BUMP%"=="" set "BUMP=patch"

echo.
echo [3/5] Bumping version...
call npm.cmd --prefix src/server version "%BUMP%" --no-git-tag-version
if errorlevel 1 goto :failed

for /f "delims=" %%V in (
  'node.exe -p "require('./src/server/package.json').version"'
) do set "VERSION=%%V"
set "TAG=v%VERSION%"

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

git.exe add -A -- src/server
git.exe commit --only -m "Release %TAG%" -- src/server
if errorlevel 1 goto :failed

echo.
echo [4/5] Pushing commit and release tag...
git.exe push origin "%DEFAULT_BRANCH%"
if errorlevel 1 goto :failed

git.exe tag -a "%TAG%" -m "Chat Bubble %TAG%"
if errorlevel 1 goto :failed

git.exe push origin "%TAG%"
if errorlevel 1 goto :failed

echo.
echo [5/5] Waiting for GitHub release safety...
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
echo VirusTotal and release safety passed.
echo The slower Release behavior workflow is now running separately.
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
echo.
echo Release stopped.
echo No release is safe to assume until Release safety is green.
echo.
pause
exit /b 1
