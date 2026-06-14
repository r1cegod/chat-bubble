$ErrorActionPreference = "Stop"

$archiveUrl = (
    "https://github.com/r1cegod/chat-bubble/archive/refs/heads/main.zip"
)
$temporaryRoot = Join-Path $env:TEMP (
    "chat-bubble-update-" + [guid]::NewGuid().ToString("N")
)
$archivePath = Join-Path $temporaryRoot "update.zip"
$extractPath = Join-Path $temporaryRoot "extract"

try {
    New-Item -ItemType Directory -Force $temporaryRoot |
        Out-Null

    Write-Host "Downloading update..."
    Invoke-WebRequest -Uri $archiveUrl -OutFile $archivePath

    Expand-Archive -Path $archivePath -DestinationPath $extractPath -Force

    $sourcePath = Join-Path $extractPath (
        "chat-bubble-main\src\server"
    )

    if (-not (Test-Path (Join-Path $sourcePath "index.js"))) {
        throw "Downloaded update does not contain the server folder."
    }

    Write-Host "Installing update..."

    Get-ChildItem $sourcePath -Force | ForEach-Object {
        if ($_.Name -notin @(".env", ".runtime", "node_modules")) {
            Copy-Item $_.FullName $PSScriptRoot -Recurse -Force
        }
    }
}
finally {
    if (Test-Path $temporaryRoot) {
        Remove-Item $temporaryRoot -Recurse -Force
    }
}

Write-Host "Source update complete."
