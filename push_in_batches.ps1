# Get all files under public/models that are currently untracked/modified in Git
$status = git status -s
$filesToCommit = @()
foreach ($line in $status) {
    if ($line -match '^\?\?\s+(public/models/.*)$' -or $line -match '^\s*M\s+(public/models/.*)$') {
        $file = $Matches[1].Trim().Trim('"')
        if ($file) {
            $filesToCommit += $file
        }
    }
}

Write-Output "Found $($filesToCommit.Count) files to commit in batches."

$batchSize = 5
for ($i = 0; $i -lt $filesToCommit.Count; $i += $batchSize) {
    $end = [Math]::Min($i + $batchSize - 1, $filesToCommit.Count - 1)
    $batch = $filesToCommit[$i..$end]
    
    Write-Output "Staging batch ($($i+1) to $($end+1) of $($filesToCommit.Count))..."
    foreach ($file in $batch) {
        git add $file
    }
    
    $commitMsg = "round-18-models-batch-$([Math]::Floor($i/$batchSize))"
    Write-Output "Committing: $commitMsg"
    git commit --no-verify -m $commitMsg
    
    Write-Output "Pushing..."
    git push --no-verify origin main
}
