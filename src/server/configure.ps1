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
Write-Host "Get the livestream link:"
Write-Host "  1. Open the livestream on YouTube."
Write-Host "  2. Click Share."
Write-Host "  3. Click Copy."
Write-Host "  4. Paste the full link below."
Write-Host ""
Write-Host "Example: https://youtu.be/AbCdEf12345"
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
    Write-Host ""
    Write-Error (
        "That is not a video link. Open the livestream's normal YouTube " +
        "page, then click Share > Copy."
    )
    exit 1
}

@(
    "YOUTUBE_API_KEY=$apiKey"
    "YOUTUBE_VIDEO_ID=$videoId"
) | Set-Content -Encoding ASCII $EnvPath

Write-Host "Livestream selected."
