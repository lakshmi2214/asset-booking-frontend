# 1. Sync local data and images to the frontend folder
python sync_db_to_mock.py

# 2. Enter the frontend folder (which is treated as a separate repository)
Set-Location frontend

# 3. Ensure the remote points to the new requested repository
$newRepo = "https://github.com/lakshmi2214/Assets_Frontend-.git"
if (!(Test-Path .git)) {
    git init
    git remote add origin $newRepo
    git branch -M main
} else {
    git remote set-url origin $newRepo
}

# 4. Stage and push frontend changes including images
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "Update assets and images from local backend"
    git push origin main --force
    Write-Host "`nSuccessfully pushed exact frontend code and images to $newRepo!" -ForegroundColor Green
    Write-Host "Verify your Vercel deployment is linked to this new repository." -ForegroundColor Cyan
} else {
    # Even if no code changes, try to push in case remote was just changed
    git push origin main --force
    Write-Host "`nFrontend is already up to date on GitHub." -ForegroundColor Yellow
}

Set-Location ..
