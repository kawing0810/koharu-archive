$ErrorActionPreference = "Continue"
# Kill anything still holding the folder
Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and (
    $_.CommandLine -match "koharu-archive|next|webpack|node\.exe"
  )
} | ForEach-Object {
  Write-Host ("pid={0} name={1}" -f $_.ProcessId, $_.Name)
  Write-Host ("  cmd={0}" -f $_.CommandLine.Substring(0, [Math]::Min(160, $_.CommandLine.Length)))
}

# Also check handles via handle if available - skip
# Force stop node processes related to next
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Host ("node pid={0}" -f $_.Id)
}
