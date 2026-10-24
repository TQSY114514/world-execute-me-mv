param(
  [string]$Edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  [string]$Song = "",
  [switch]$Subtitles = $false,
  [string]$Out = "world.execute(me).mp4"
)
$root = Split-Path -Parent $PSScriptRoot
if (-not $Song) { $Song = Join-Path $root "song.mp3" }
if (-not (Test-Path $Song)) { Write-Error "song not found: $Song"; exit 1 }

$webm = Join-Path $root "world.execute(me).webm"
if (Test-Path $webm) { Remove-Item $webm -Force }

Write-Host "Starting local capture server on port 8731..."
$serverJob = Start-Process node -ArgumentList "tools/capture-server.mjs `"$webm`"" -PassThru -NoNewWindow

Start-Sleep -Seconds 1

$subParam = if ($Subtitles) { "nosub=0" } else { "nosub=1" }
$url = "http://127.0.0.1:8731/index.html?record=1&$subParam&upload=http://127.0.0.1:8731/upload"

Write-Host "Launching Edge for video rendering (Subtitles: $(if ($Subtitles) {'ON'} else {'OFF'}))..."
Write-Host "Rendering 212.5s @ 60fps (~3:32)..."

$browserProc = Start-Process $Edge -ArgumentList "--new-window", "--autoplay-policy=no-user-gesture-required", $url -PassThru

# Wait for capture server to complete upload and exit
$serverJob | Wait-Process -Timeout 360

Start-Sleep -Seconds 2

if ($browserProc -and -not $browserProc.HasExited) {
  Stop-Process -Id $browserProc.Id -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path $webm) -or (Get-Item $webm).Length -lt 1000) {
  Write-Error "Recording failed: $webm was not produced"
  exit 1
}

$sizeMb = [math]::Round((Get-Item $webm).Length / 1MB, 2)
Write-Host "Recorded WebM generated successfully ($sizeMb MB)."
Write-Host "Muxing master audio into MP4 via FFmpeg..."

$outFile = Join-Path $root $Out
ffmpeg -y -i "$webm" -i "$Song" `
  -map 0:v:0 -map 1:a:0 `
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.2 `
  -c:a aac -b:a 192k -shortest -movflags +faststart "$outFile"

if ($LASTEXITCODE -eq 0 -and (Test-Path $outFile)) {
  $mp4Mb = [math]::Round((Get-Item $outFile).Length / 1MB, 2)
  Write-Host "=================================================="
  Write-Host "SUCCESS! Video rendered -> $outFile ($mp4Mb MB)"
  Write-Host "=================================================="
} else {
  Write-Error "FFmpeg muxing failed"
}
