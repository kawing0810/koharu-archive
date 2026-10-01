$ErrorActionPreference = "Continue"
$src = "C:\Users\lokaw\koharu-archive"
if (-not (Test-Path $src)) {
  Write-Host "Already gone"
  exit 0
}
# Make sure we don't delete D by mistake
if ((Resolve-Path $src).Path -notlike "C:\*") {
  Write-Host "ERROR: unexpected path"
  exit 1
}
Write-Host "Deleting old C: copy..."
Remove-Item -LiteralPath $src -Recurse -Force
if (Test-Path $src) {
  Write-Host "WARN: some files remained (maybe locked). Trying robocopy purge..."
  $empty = Join-Path $env:TEMP "empty-koharu-delete"
  New-Item -ItemType Directory -Force -Path $empty | Out-Null
  robocopy $empty $src /MIR /E /NFL /NDL /NJH /NJS /R:1 /W:1 | Out-Null
  Remove-Item -LiteralPath $src -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $empty -Force -ErrorAction SilentlyContinue
}
if (Test-Path $src) {
  Write-Host "FAIL: still exists. Close any Explorer windows on that folder and delete manually."
  exit 1
}
Write-Host "C: folder deleted"
