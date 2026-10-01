$ErrorActionPreference = "Stop"
$src = "C:\Users\lokaw\koharu-archive"
$dst = "D:\koharu-archive"

Write-Host "Checking sizes..."
$bytes = (Get-ChildItem $src -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Write-Host ("Source size: {0:N1} MB" -f ($bytes / 1MB))
$free = (Get-PSDrive D).Free
Write-Host ("D: free: {0:N1} GB" -f ($free / 1GB))

$nm = Join-Path $src "node_modules"
if (Test-Path $nm) {
  $item = Get-Item $nm -Force
  Write-Host ("node_modules Attributes: {0}" -f $item.Attributes)
  Write-Host ("node_modules Target: {0}" -f ($item.Target -join ","))
  cmd /c "fsutil reparsepoint query `"$nm`""
}

if (Test-Path $dst) {
  Write-Host "ERROR: D:\koharu-archive already exists"
  exit 1
}
Write-Host "OK to move"
