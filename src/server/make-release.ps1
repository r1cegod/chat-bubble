$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$widgetRoot = Join-Path $repoRoot "src\widget"
$releaseRoot = Join-Path $PSScriptRoot "release"
$stagingPath = Join-Path $releaseRoot "ChatBubble"
$archivePath = Join-Path $releaseRoot "ChatBubble.zip"
$checksumPath = Join-Path $releaseRoot "ChatBubble.zip.sha256"

if (Test-Path $releaseRoot) {
    Remove-Item $releaseRoot -Recurse -Force
}

New-Item -ItemType Directory -Force $stagingPath |
    Out-Null

Copy-Item (
    Join-Path $PSScriptRoot "QUICK START.txt"
) $stagingPath

Copy-Item (
    Join-Path $PSScriptRoot "RELEASE NOTES.md"
) $stagingPath

foreach ($fileName in @(
    "widget.html",
    "widget.css",
    "widget.js",
    "widgetfield.json",
    "widgetdata.json"
)) {
    Copy-Item (
        Join-Path $widgetRoot $fileName
    ) $stagingPath
}

Copy-Item (
    Join-Path $widgetRoot "mediasrc"
) (
    Join-Path $stagingPath "mediasrc"
) -Recurse -Force

Get-ChildItem $stagingPath -Filter "desktop.ini" -Recurse -Force |
    Remove-Item -Force

Compress-Archive -Path $stagingPath -DestinationPath $archivePath -Force

Write-Host "Created $archivePath"

$archiveHash = (Get-FileHash $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -Encoding ASCII $checksumPath "$archiveHash  ChatBubble.zip"

Write-Host "Created $checksumPath"
