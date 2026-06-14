param(
    [string]$ReleaseApiUrl = (
        "https://api.github.com/repos/r1cegod/chat-bubble/releases/latest"
    )
)

$ErrorActionPreference = "Stop"

$temporaryRoot = Join-Path $env:TEMP (
    "chat-bubble-update-" + [guid]::NewGuid().ToString("N")
)
$archivePath = Join-Path $temporaryRoot "update.zip"
$checksumPath = Join-Path $temporaryRoot "update.sha256"
$extractPath = Join-Path $temporaryRoot "extract"

try {
    New-Item -ItemType Directory -Force $temporaryRoot |
        Out-Null

    Write-Host "Checking the latest published release..."
    $headers = @{
        "Accept" = "application/vnd.github+json"
        "User-Agent" = "ChatBubble-Updater"
    }
    $release = Invoke-RestMethod -Uri $ReleaseApiUrl -Headers $headers
    $archiveAsset = $release.assets |
        Where-Object { $_.name -eq "ChatBubble.zip" } |
        Select-Object -First 1
    $checksumAsset = $release.assets |
        Where-Object { $_.name -eq "ChatBubble.zip.sha256" } |
        Select-Object -First 1

    if (-not $archiveAsset -or -not $checksumAsset) {
        throw "The latest release is missing its package or checksum."
    }

    Write-Host "Downloading Chat Bubble $($release.tag_name)..."
    Invoke-WebRequest `
        -Uri $archiveAsset.browser_download_url `
        -OutFile $archivePath `
        -Headers $headers
    Invoke-WebRequest `
        -Uri $checksumAsset.browser_download_url `
        -OutFile $checksumPath `
        -Headers $headers

    $expectedHash = (
        Get-Content $checksumPath -Raw
    ).Trim().Split()[0].ToUpperInvariant()
    $actualHash = (
        Get-FileHash $archivePath -Algorithm SHA256
    ).Hash.ToUpperInvariant()

    if (
        $expectedHash -notmatch '^[A-F0-9]{64}$' -or
        $actualHash -ne $expectedHash
    ) {
        throw "Update verification failed. No files were changed."
    }

    Expand-Archive -Path $archivePath -DestinationPath $extractPath -Force

    $sourcePath = Join-Path $extractPath "ChatBubble\ChatBubble Files"

    if (
        -not (Test-Path (Join-Path $sourcePath "index.js")) -or
        -not (Test-Path (Join-Path $sourcePath "package-lock.json"))
    ) {
        throw "Verified package does not contain the expected application files."
    }

    Write-Host "Package verified. Installing update..."

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

Write-Host "Update installed from release $($release.tag_name)."
