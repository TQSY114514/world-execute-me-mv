param(
  [string]$Edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  [string]$Song = ""
)
$root = Split-Path -Parent $PSScriptRoot
if (-not $Song) { $Song = Join-Path $root "song.mp3" }
$page = (Join-Path $root "index.html") -replace '\\','/'

if (-not (Test-Path $Song)) { Write-Error "song not found: $Song"; exit 1 }

Write-Host "opening the film — it records itself and downloads a webm when it ends (~3:32)."
Start-Process $Edge "file:///$page?record=1"
Read-Host "press Enter once the download has finished"

$webm = Get-ChildItem "$env:USERPROFILE\Downloads\world.execute(me)*.webm" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $webm) { Write-Error "no webm found in Downloads"; exit 1 }
Write-Host "video: $($webm.FullName)"

$out = Join-Path $root "world.execute(me).mp4"
ffmpeg -y -i "$($webm.FullName)" -i "$Song" `
  -map 0:v:0 -map 1:a:0 `
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.2 `
  -c:a aac -b:a 192k -shortest -movflags +faststart "$out"
if ($LASTEXITCODE -eq 0) { Write-Host "OK -> $out" } else { Write-Error "ffmpeg failed" }
