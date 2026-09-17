$ErrorActionPreference = "Stop"

Write-Host "=== UAE Malayalees Deployment ===" -ForegroundColor Cyan

function Run-Ssh {
    param([string]$cmd)
    ssh -p 22 root@194.164.151.202 "$cmd"
}

Write-Host "`n[1/6] Pulling code..." -ForegroundColor Cyan
Run-Ssh "cd /opt/uaemalayalees && git pull origin main"

Write-Host "`n[2/6] Installing deps..." -ForegroundColor Cyan
Run-Ssh "cd /opt/uaemalayalees && npm install"

Write-Host "`n[3/6] Building..." -ForegroundColor Cyan
Run-Ssh "cd /opt/uaemalayalees && npm run build"

Write-Host "`n[4/6] Migrations..." -ForegroundColor Cyan
Run-Ssh "cd /opt/uaemalayalees && npx prisma db push --skip-generate"

Write-Host "`n[5/6] Restarting PM2..." -ForegroundColor Cyan
Run-Ssh "cd /opt/uaemalayalees && pm2 restart uaemalayalees && pm2 save"

Write-Host "`n[6/6] Checking status..." -ForegroundColor Cyan
Run-Ssh "pm2 status"

Write-Host "`n? Done!" -ForegroundColor Green
