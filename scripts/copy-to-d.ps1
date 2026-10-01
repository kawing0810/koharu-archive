$ErrorActionPreference = "Continue"
Stop-Process -Id 34452,6272 -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$src = "C:\Users\lokaw\koharu-archive"
$dst = "D:\koharu-archive"
$junctionTarget = "C:\Users\lokaw\kouen-seats\node_modules"

# Ensure junction removed
$nm = Join-Path $src "node_modules"
if (Test-Path $nm) {
  cmd /c "rmdir `"$nm`""
}

if (Test-Path $dst) {
  Write-Host "Cleaning partial destination..."
  Remove-Item -LiteralPath $dst -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Copying to D: (this may take a few minutes)..."
# /E copy subdirs including empty; /XJ exclude junctions; /NFL /NDL quieter
$args = @($src, $dst, "/E", "/XJ", "/R:2", "/W:1", "/NFL", "/NDL", "/NJH", "/NP")
& robocopy @args
$code = $LASTEXITCODE
Write-Host ("robocopy exit={0}" -f $code)
# robocopy 0-7 are success-ish
if ($code -ge 8) {
  Write-Host "ERROR: robocopy failed"
  exit 1
}

$newNm = Join-Path $dst "node_modules"
cmd /c "mklink /J `"$newNm`" `"$junctionTarget`""
if (-not (Test-Path $newNm)) {
  Write-Host "ERROR: junction failed"
  exit 1
}
Write-Host "Junction OK"
Write-Host "Copy complete. Old folder still on C until Cursor switches root."
