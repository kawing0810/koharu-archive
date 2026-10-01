$ErrorActionPreference = "Continue"
Stop-Process -Id 25880 -Force -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and ($_.CommandLine -match "next|koharu-archive")
} | ForEach-Object {
  try {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
    Write-Host ("stopped pid={0}" -f $_.ProcessId)
  } catch {
    Write-Host ("skip pid={0}: {1}" -f $_.ProcessId, $_.Exception.Message)
  }
}
Start-Sleep -Seconds 2
Write-Host "processes cleared"
