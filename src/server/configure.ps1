param(
    [string]$EnvPath = (
        Join-Path $PSScriptRoot ".env"
    )
)

$apiKey = ""

if (Test-Path $EnvPath) {
    foreach ($line in Get-Content $EnvPath) {
        if ($line -match '^YOUTUBE_API_KEY=(.*)$') {
            $apiKey = $Matches[1].Trim()
        }
    }
}

if (-not $apiKey) {
    Write-Host ""
    Write-Host "First-time setup:"
    Write-Host "Paste your YouTube Data API v3 key."
    Write-Host "It is saved only in this folder."
    $apiKey = (Read-Host "API key").Trim()
}

if (-not $apiKey) {
    Write-Error "A YouTube API key is required."
    exit 1
}

Write-Host ""
Write-Host "Paste the YouTube livestream link."
$videoInput = (Read-Host "Livestream link").Trim()

$patterns = @(
    '(?:youtube\.com/watch\?.*?v=)([A-Za-z0-9_-]+)',
    '(?:youtube\.com/live/)([A-Za-z0-9_-]+)',
    '(?:youtu\.be/)([A-Za-z0-9_-]+)'
)

$videoId = $videoInput

foreach ($pattern in $patterns) {
    if ($videoInput -match $pattern) {
        $videoId = $Matches[1]
        break
    }
}

if ($videoId -notmatch '^[A-Za-z0-9_-]{6,}$') {
    Write-Error "That does not look like a YouTube livestream link."
    exit 1
}

@(
    "YOUTUBE_API_KEY=$apiKey"
    "YOUTUBE_VIDEO_ID=$videoId"
) | Set-Content -Encoding ASCII $EnvPath

Write-Host "Livestream selected."
