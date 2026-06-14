param(
    [string]$EnvPath = (
        Join-Path $PSScriptRoot "src\server\.env"
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
    $apiKey = (Read-Host "YouTube API key").Trim()
}

if (-not $apiKey) {
    Write-Error "A YouTube API key is required."
    exit 1
}

$videoInput = (
    Read-Host "YouTube video URL or video ID"
).Trim()

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
    Write-Error "Enter a valid YouTube URL or video ID."
    exit 1
}

$envDirectory = Split-Path -Parent $EnvPath
New-Item -ItemType Directory -Force $envDirectory |
    Out-Null

@(
    "YOUTUBE_API_KEY=$apiKey"
    "YOUTUBE_VIDEO_ID=$videoId"
) | Set-Content -Encoding ASCII $EnvPath

Write-Host "Configured video ID: $videoId"
