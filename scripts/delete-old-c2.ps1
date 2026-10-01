$ErrorActionPreference = "Continue"
$src = "C:\Users\lokaw\koharu-archive"
$trash = "C:\Users\lokaw\koharu-archive-OLD-DELETE-ME"

# Try rename first so Cursor stops using it as active path conceptually
if (Test-Path $src) {
  try {
    Rename-Item -LiteralPath $src -NewName "koharu-archive-OLD-DELETE-ME" -Force
    Write-Host "Renamed to koharu-archive-OLD-DELETE-ME"
  } catch {
    Write-Host ("Rename failed: {0}" -f $_.Exception.Message)
  }
}

if (Test-Path $trash) {
  cmd /c "rd /s /q `"$trash`""
  if (Test-Path $trash) {
    Write-Host "Still locked. Listing top-level leftovers:"
    Get-ChildItem $trash -Force | Select-Object -First 20 Name, Attributes
  } else {
    Write-Host "Deleted renamed folder"
  }
} elseif (-not (Test-Path $src)) {
  Write-Host "C path already gone"
}
