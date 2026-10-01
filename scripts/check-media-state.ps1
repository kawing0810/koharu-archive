$ErrorActionPreference = "Continue"
$idb = "C:\Users\lokaw\AppData\Local\Google\Chrome\User Data\Default\IndexedDB"
Get-ChildItem $idb -Directory | Where-Object { $_.Name -like "*localhost_3000*" } | ForEach-Object {
  $sum = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
  Write-Host ("{0}  bytes={1}  files={2}" -f $_.Name, $sum, (Get-ChildItem $_.FullName -Recurse -File -EA SilentlyContinue).Count)
}
$lim = "D:\koharu-archive\public\media\limited"
if (Test-Path $lim) {
  $files = Get-ChildItem $lim -File -Recurse
  Write-Host ("limited files={0} sizeMB={1:N1}" -f $files.Count, (($files | Measure-Object Length -Sum).Sum/1MB))
}
