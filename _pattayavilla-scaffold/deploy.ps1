# PATTAYA VILLA deploy — clean staging deploy with allowlist gate
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PATTAYA VILLA DEPLOY" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
$STAGE=".deploy-stage"; $SRC="."
if (Test-Path $STAGE){Remove-Item -Recurse -Force $STAGE}
Copy-Item -Recurse -Force $SRC $STAGE | Out-Null
# Purge disallowed
$disallow=@('AUDIT*.md','NUKLEAR*.md','*.bak','.DS_Store','Thumbs.db','__pycache__','.deploy-stage','.git','.github','.wrangler','deploy.ps1','README.md','CLAUDE.md')
foreach($p in $disallow){Get-ChildItem -Path $STAGE -Recurse -Force -Include $p -ErrorAction SilentlyContinue | ForEach-Object{Remove-Item -Recurse -Force $_.FullName}}
npx wrangler pages deploy $STAGE --project-name pattayavilla --branch=master
if ($LASTEXITCODE -ne 0){Remove-Item -Recurse -Force $STAGE; exit 1}
Remove-Item -Recurse -Force $STAGE
Write-Host "Live: https://pattayavilla.com/" -ForegroundColor Green
