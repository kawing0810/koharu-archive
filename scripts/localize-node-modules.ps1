$ErrorActionPreference = "Continue"
Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and ($_.CommandLine -match "next dev --port 3000")
} | ForEach-Object {
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

$dst = "D:\koharu-archive\node_modules"
$src = "C:\Users\lokaw\kouen-seats\node_modules"
$nextCache = "D:\koharu-archive\.next"

if (Test-Path $nextCache) {
  Remove-Item -LiteralPath $nextCache -Recurse -Force
  Write-Host "cleared .next"
}

# remove junction if present
if (Test-Path $dst) {
  $item = Get-Item $dst -Force
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
    cmd /c "rmdir `"$dst`""
    Write-Host "removed junction"
  } else {
    Write-Host "node_modules already real, refreshing..."
  }
}

Write-Host "Copying node_modules to D: (may take a few minutes)..."
robocopy $src $dst /E /XD .cache /R:2 /W:1 /NFL /NDL /NJH /NP
$code = $LASTEXITCODE
Write-Host ("robocopy exit={0}" -f $code)
if ($code -ge 8) { exit 1 }

Write-Host ("next pkg exists: {0}" -f (Test-Path (Join-Path $dst "next\package.json")))
