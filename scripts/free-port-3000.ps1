$ErrorActionPreference = "Continue"
# kill by port 3000
$conns = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
foreach ($c in $conns) {
  if ($c.OwningProcess) {
    Write-Host ("killing pid on 3000: {0}" -f $c.OwningProcess)
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}
Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and ($_.CommandLine -match "next dev")
} | ForEach-Object {
  Write-Host ("killing next: {0}" -f $_.ProcessId)
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
$left = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($left) { Write-Host "port still busy" } else { Write-Host "port free" }
