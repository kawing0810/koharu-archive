$ErrorActionPreference = "Continue"
$src = "C:\Users\lokaw\koharu-archive"
$big = @(
  (Join-Path $src ".next"),
  (Join-Path $src "public\media"),
  (Join-Path $src ".git")
)
foreach ($path in $big) {
  if (Test-Path $path) {
    Write-Host ("Deleting {0} ..." -f $path)
    cmd /c "rd /s /q `"$path`""
    if (Test-Path $path) {
      Write-Host ("  still locked: {0}" -f $path)
    } else {
      Write-Host "  gone"
    }
  }
}

# try full delete again
cmd /c "rd /s /q `"$src`""
if (Test-Path $src) {
  $left = (Get-ChildItem $src -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
  Write-Host ("Remaining on C: {0:N1} MB" -f ($left / 1MB))
  Get-ChildItem $src -Force | Select-Object Name
} else {
  Write-Host "Full C folder deleted"
}
