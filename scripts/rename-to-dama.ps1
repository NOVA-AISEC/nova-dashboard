param(
  [switch]$Apply
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoDir = Split-Path -Parent $scriptDir
$currentName = Split-Path $repoDir -Leaf
$parentDir = Split-Path -Parent $repoDir
$targetDir = Join-Path $parentDir 'dama-dashboard'

Write-Host "Repository: $repoDir"
Write-Host "Current folder name: $currentName"

if ($currentName -eq 'dama-dashboard') {
  Write-Host 'Folder already matches dama-dashboard.'
  exit 0
}

if (Test-Path $targetDir) {
  Write-Host "Target path already exists: $targetDir"
  exit 1
}

$renameCommand = "Rename-Item -LiteralPath `"$repoDir`" -NewName `"dama-dashboard`""
Write-Host ''
Write-Host 'Planned folder rename command:'
Write-Host "  $renameCommand"

$remoteUrl = $null
try {
  $remoteUrl = git -C $repoDir remote get-url origin 2>$null
} catch {
  $remoteUrl = $null
}

if ($remoteUrl -and $remoteUrl -match 'nova-dashboard') {
  $newRemoteUrl = $remoteUrl -replace 'nova-dashboard', 'dama-dashboard'
  Write-Host ''
  Write-Host 'Planned git remote update command:'
  Write-Host "  git -C `"$targetDir`" remote set-url origin `"$newRemoteUrl`""
} else {
  $newRemoteUrl = $null
}

if (-not $Apply) {
  Write-Host ''
  Write-Host 'Dry run only. Re-run with -Apply to execute after prompts.'
  exit 0
}

$renameConfirm = Read-Host 'Rename the parent folder to dama-dashboard? [y/N]'
if ($renameConfirm -notin @('y', 'Y', 'yes', 'YES')) {
  Write-Host 'Folder rename skipped.'
  exit 0
}

Set-Location $parentDir
Invoke-Expression $renameCommand
Write-Host "Folder renamed to: $targetDir"

if ($newRemoteUrl) {
  $remoteConfirm = Read-Host 'Update git origin remote to the dama-dashboard URL? [y/N]'
  if ($remoteConfirm -in @('y', 'Y', 'yes', 'YES')) {
    git -C $targetDir remote set-url origin $newRemoteUrl
    Write-Host 'Git origin remote updated.'
  } else {
    Write-Host 'Git origin remote unchanged.'
  }
}
