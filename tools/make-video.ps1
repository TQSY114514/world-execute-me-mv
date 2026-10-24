param(
  [switch]$Subtitles = $false,
  [string]$Out = "world.execute(me).mp4"
)
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=========================================================="
Write-Host "  WORLD.EXECUTE(ME); - DETERMINISTIC 60FPS EXPORT ENGINE  "
Write-Host "=========================================================="
Write-Host "Running WebCodecs GPU hardware-accelerated frame pipeline..."

node tools/export-video.mjs
