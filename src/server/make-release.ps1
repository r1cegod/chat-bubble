$ErrorActionPreference = "Stop"

$releaseRoot = Join-Path $PSScriptRoot "release"
$stagingPath = Join-Path $releaseRoot "ChatBubble"
$archivePath = Join-Path $releaseRoot "ChatBubble.zip"

if (Test-Path $releaseRoot) {
    Remove-Item $releaseRoot -Recurse -Force
}

New-Item -ItemType Directory -Force $stagingPath |
    Out-Null

Get-ChildItem $PSScriptRoot -Force | ForEach-Object {
    if ($_.Name -notin @(
        ".env",
        "node_modules",
        "release"
    )) {
        Copy-Item $_.FullName $stagingPath -Recurse -Force
    }
}

Compress-Archive -Path $stagingPath -DestinationPath $archivePath -Force

Write-Host "Created $archivePath"
