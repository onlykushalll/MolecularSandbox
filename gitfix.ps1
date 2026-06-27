taskkill /f /im git.exe 2>$null
Start-Sleep -Seconds 2
Remove-Item -Force "C:/Users/Default.L-HCG-9FVVGS3/OneDrive/Desktop/MolecularSandbox/.git/index.lock" -ErrorAction SilentlyContinue
cd "C:/Users/Default.L-HCG-9FVVGS3/OneDrive/Desktop/MolecularSandbox"
git add -A
git commit -m "round-18-all-82-real-models-complete"
git push --no-verify origin main
Write-Output "GIT_DONE"
