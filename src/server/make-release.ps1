$ErrorActionPreference = "Stop"

$releaseRoot = Join-Path $PSScriptRoot "release"
$stagingPath = Join-Path $releaseRoot "ChatBubble"
$appPath = Join-Path $stagingPath "ChatBubble Files"
$archivePath = Join-Path $releaseRoot "ChatBubble.zip"

if (Test-Path $releaseRoot) {
    Remove-Item $releaseRoot -Recurse -Force
}

New-Item -ItemType Directory -Force $appPath |
    Out-Null

Get-ChildItem $PSScriptRoot -Force | ForEach-Object {
    if ($_.Name -notin @(
        ".env",
        "node_modules",
        "release",
        "make-release.ps1",
        "QUICK START.txt"
    )) {
        Copy-Item $_.FullName $appPath -Recurse -Force
    }
}

Get-ChildItem $appPath -Filter "desktop.ini" -Recurse -Force |
    Remove-Item -Force

Copy-Item (
    Join-Path $PSScriptRoot "QUICK START.txt"
) $stagingPath

@(
    "@echo off"
    "call `"%~dp0ChatBubble Files\START CHAT.bat`""
) | Set-Content -Encoding ASCII (
    Join-Path $stagingPath "START CHAT.bat"
)

@(
    "@echo off"
    "call `"%~dp0ChatBubble Files\UPDATE CHAT.bat`""
) | Set-Content -Encoding ASCII (
    Join-Path $stagingPath "UPDATE CHAT.bat"
)

Compress-Archive -Path $stagingPath -DestinationPath $archivePath -Force

Write-Host "Created $archivePath"
