Stop-Process -Name git -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Remove-Item -Force "C:/Users/Default.L-HCG-9FVVGS3/OneDrive/Desktop/MolecularSandbox/.git/index.lock" -ErrorAction SilentlyContinue
Set-Location "C:/Users/Default.L-HCG-9FVVGS3/OneDrive/Desktop/MolecularSandbox"
git add -A
git commit -m "round-19-complete-sync-all-code-deleted-old-files"
git push --no-verify origin main
Write-Output "GIT_COMPLETE"
