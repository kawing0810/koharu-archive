$ErrorActionPreference = "Stop"
$src = "C:\Users\lokaw\koharu-archive"
$dst = "D:\koharu-archive"
$junctionTarget = "C:\Users\lokaw\kouen-seats\node_modules"

if (Test-Path $dst) {
  Write-Host "ERROR: destination exists"
  exit 1
}

# Remove junction so Move-Item won't try to copy kouen-seats node_modules
$nm = Join-Path $src "node_modules"
if (Test-Path $nm) {
  cmd /c "rmdir `"$nm`""
  if (Test-Path $nm) {
    Write-Host "ERROR: failed to remove node_modules junction"
    exit 1
  }
  Write-Host "Removed node_modules junction"
}

Write-Host "Moving folder to D:\koharu-archive ..."
Move-Item -LiteralPath $src -Destination $dst
if (-not (Test-Path $dst)) {
  Write-Host "ERROR: move failed"
  exit 1
}
Write-Host "Moved OK"

# Recreate junction
$newNm = Join-Path $dst "node_modules"
cmd /c "mklink /J `"$newNm`" `"$junctionTarget`""
if (-not (Test-Path $newNm)) {
  Write-Host "ERROR: junction recreate failed"
  exit 1
}
Write-Host "Recreated node_modules junction -> $junctionTarget"

# Verify old path gone
if (Test-Path $src) {
  Write-Host "WARN: old path still exists"
} else {
  Write-Host "Old C: path removed"
}

Write-Host "DONE"
