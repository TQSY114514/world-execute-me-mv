param(
  [Parameter(Mandatory=$true)][string]$In,
  [string]$Out = ""
)
if (-not (Test-Path $In)) { Write-Error "not found: $In"; exit 1 }
if (-not $Out) { $Out = [IO.Path]::ChangeExtension((Resolve-Path $In), '.mp4') }
ffmpeg -y -i "$In" -map 0:v:0 -map 0:a? `
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.2 `
  -c:a aac -b:a 192k -movflags +faststart "$Out"
if ($LASTEXITCODE -eq 0) { Write-Host "OK -> $Out" } else { Write-Error "ffmpeg failed" }
