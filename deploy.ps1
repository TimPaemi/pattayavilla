# PATTAYA VILLA STREAM deploy - clean staging deploy with pre-flight validation + allowlist gate
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PATTAYA VILLA STREAM DEPLOY" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# ============================================================
# PRE-FLIGHT VALIDATION - fails the deploy if anything is wrong
# ============================================================
$ErrorActionPreference = "Stop"
$valFailed = $false

Write-Host ""
Write-Host "[1/6] SEO audit..." -ForegroundColor Yellow
python scripts/seo_audit.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAIL: SEO audit failed" -ForegroundColor Red
    $valFailed = $true
} else {
    Write-Host "  OK: SEO audit passed" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/6] HTML integrity check..." -ForegroundColor Yellow
$htmlFiles = Get-ChildItem -Recurse -Filter "*.html" -File | Where-Object { $_.FullName -notmatch '\.deploy-stage|_pattayavilla-scaffold|\.git' }
foreach ($f in $htmlFiles) {
    $content = Get-Content $f.FullName -Raw
    if ($content -notmatch '</html>') {
        Write-Host "  FAIL: $($f.FullName) missing </html>" -ForegroundColor Red
        $valFailed = $true
    } elseif ($content -notmatch '</body>') {
        Write-Host "  FAIL: $($f.FullName) missing </body>" -ForegroundColor Red
        $valFailed = $true
    } else {
        Write-Host "  OK: $($f.FullName.Replace($PWD,'.'))" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[3/6] JSON parse check..." -ForegroundColor Yellow
$jsonFiles = @('manifest.json')
foreach ($f in $jsonFiles) {
    if (Test-Path $f) {
        try {
            $null = Get-Content $f -Raw | ConvertFrom-Json -ErrorAction Stop
            Write-Host "  OK: $f parses" -ForegroundColor Green
        } catch {
            Write-Host "  FAIL: $f does not parse - $($_.Exception.Message)" -ForegroundColor Red
            $valFailed = $true
        }
    }
}

Write-Host ""
Write-Host "[4/6] TODO / PLACEHOLDER leak check (HTML only)..." -ForegroundColor Yellow
$leakHits = 0
foreach ($f in $htmlFiles) {
    $content = Get-Content $f.FullName -Raw
    # Find unintended TODO markers - but allow [PLACEHOLDER href ...] which is intentional
    if ($content -match '\[TODO') {
        Write-Host "  WARN: $($f.FullName.Replace($PWD,'.')) has `[TODO`] marker" -ForegroundColor Yellow
        $leakHits++
    }
}
if ($leakHits -eq 0) {
    Write-Host "  OK: no `[TODO`] leaks" -ForegroundColor Green
} else {
    Write-Host "  $leakHits TODO markers found - review before deploy" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/6] Auto-update sitemap.xml lastmod..." -ForegroundColor Yellow
if (Test-Path "sitemap.xml") {
    $today = (Get-Date).ToString("yyyy-MM-dd")
    $sitemap = Get-Content "sitemap.xml" -Raw
    $updated = [System.Text.RegularExpressions.Regex]::Replace($sitemap, '<lastmod>\d{4}-\d{2}-\d{2}</lastmod>', "<lastmod>$today</lastmod>")
    if ($updated -ne $sitemap) {
        Set-Content "sitemap.xml" -Value $updated -NoNewline
        Write-Host "  OK: sitemap.xml lastmod updated to $today" -ForegroundColor Green
    } else {
        Write-Host "  OK: sitemap.xml lastmod already current" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[6/6] Asset existence check..." -ForegroundColor Yellow
$assetFail = $false
$refs = @()
foreach ($f in $htmlFiles) {
    $content = Get-Content $f.FullName -Raw
    foreach ($m in [regex]::Matches($content, '/assets/[a-zA-Z0-9/_.-]+')) {
        $refs += $m.Value
    }
}
$refs = $refs | Select-Object -Unique
foreach ($r in $refs) {
    if (-not (Test-Path ".$r")) {
        Write-Host "  FAIL: missing asset $r" -ForegroundColor Red
        $assetFail = $true
    }
}
if (-not $assetFail) { Write-Host "  OK: $($refs.Count) asset refs exist" -ForegroundColor Green } else { $valFailed = $true }

if ($valFailed) {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "  PRE-FLIGHT VALIDATION FAILED" -ForegroundColor Red
    Write-Host "  Fix errors above before deploying." -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "  PRE-FLIGHT VALIDATION: PASSED" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# ============================================================
# STAGING - copy to .deploy-stage, purge disallowed files
# ============================================================
$STAGE = ".deploy-stage"
$SRC = "."
if (Test-Path $STAGE) { Remove-Item -Recurse -Force $STAGE }
New-Item -ItemType Directory -Path $STAGE -Force | Out-Null
Get-ChildItem -Path $SRC -Force | Where-Object { $_.Name -ne $STAGE } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $STAGE -Recurse -Force
}

$disallow = @(
    'AUDIT*.md','NUKLEAR*.md','*.bak','.DS_Store','Thumbs.db','__pycache__',
    '.deploy-stage','.git','.github','.wrangler','deploy.ps1','README.md','CLAUDE.md','AGENTS.md',
    '_pattayavilla-scaffold','index.lock','scripts'
)
foreach ($p in $disallow) {
    Get-ChildItem -Path $STAGE -Recurse -Force -Include $p -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item -Recurse -Force $_.FullName
    }
}

# ============================================================
# DEPLOY via Wrangler
# ============================================================
Write-Host ""
Write-Host "Deploying via Wrangler..." -ForegroundColor Cyan
npx wrangler pages deploy $STAGE --project-name pattayavilla --branch=master
if ($LASTEXITCODE -ne 0) {
    Remove-Item -Recurse -Force $STAGE
    Write-Host "Deploy FAILED" -ForegroundColor Red
    exit 1
}
Remove-Item -Recurse -Force $STAGE
Write-Host ""
Write-Host "Post-deploy: IndexNow ping..." -ForegroundColor Yellow
$indexKey = "psindex2026pattayastreamkey"
$urlList = @()
if (Test-Path "sitemap.xml") {
    $sm = Get-Content "sitemap.xml" -Raw
    foreach ($m in [regex]::Matches($sm, '<loc>(https://pattayastream.com[^<]+)</loc>')) {
        $urlList += $m.Groups[1].Value
    }
}
if ($urlList.Count -gt 0) {
    $body = @{
        host = "pattayastream.com"
        key = $indexKey
        keyLocation = "https://pattayastream.com/$indexKey.txt"
        urlList = $urlList
    } | ConvertTo-Json -Depth 3
    try {
        $null = Invoke-RestMethod -Uri "https://api.indexnow.org/indexnow" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        Write-Host "  OK: IndexNow pinged $($urlList.Count) URLs" -ForegroundColor Green
    } catch {
        Write-Host "  WARN: IndexNow ping failed - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""
Write-Host "Post-deploy: GSC sitemap submit (optional)..." -ForegroundColor Yellow
python scripts/gsc_submit.py
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "  LIVE: https://pattayastream.com/" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
