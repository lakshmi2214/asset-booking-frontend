# Run the sync script to update mockData.js and media
python sync_db_to_mock.py

# Stage the updated mock data, media, and the script itself
git add frontend/src/mockData.js
git add frontend/public/media/*
git add publish.ps1
git add vercel.json

# Only commit if there are changes
$status = git status --porcelain
if ($status) {
    git commit -m "Sync assets and update configuration"
    git push origin main
    Write-Host "`nSuccessfully published updated assets to GitHub and Vercel!" -ForegroundColor Green
    Write-Host "Vercel will redeploy automatically in a few minutes." -ForegroundColor Cyan
} else {
    Write-Host "`nNo changes detected. Your site is already up to date!" -ForegroundColor Yellow
}
