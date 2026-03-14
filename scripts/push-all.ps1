param(
  [string]$Branch = "main"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Push-Remote([string]$Remote, [string]$BranchName) {
  Write-Host "Pushing $BranchName to $Remote..."
  git push $Remote $BranchName`:$BranchName
}

Push-Remote -Remote "origin" -BranchName $Branch
Push-Remote -Remote "vercel" -BranchName $Branch

Write-Host "Done."
