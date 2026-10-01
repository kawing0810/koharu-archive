$ErrorActionPreference = "Continue"
# stop anything on port 3000 / next
Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and ($_.CommandLine -match "next dev --port 3000")
} | ForEach-Object {
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  Write-Host ("stopped {0}" -f $_.ProcessId)
}

$next = "D:\koharu-archive\.next"
if (Test-Path $next) {
  Remove-Item -LiteralPath $next -Recurse -Force
  Write-Host "cleared .next"
}

# verify junction
$nm = "D:\koharu-archive\node_modules"
if (-not (Test-Path (Join-Path $nm "next"))) {
  Write-Host "junction broken, recreating..."
  if (Test-Path $nm) { cmd /c "rmdir `"$nm`"" }
  cmd /c "mklink /J `"$nm`" `"C:\Users\lokaw\kouen-seats\node_modules`""
}
Write-Host ("next exists: {0}" -f (Test-Path (Join-Path $nm "next")))
