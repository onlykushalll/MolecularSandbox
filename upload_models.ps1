# Upload all .glb files to sandbox via HTTP POST
$src = "C:\Users\Default.L-HCG-9FVVGS3\Downloads\3d-models"
$url = "http://localhost:3000/api/upload-model"

# Wait for server to be ready
Write-Output "Checking server..."
try {
    $test = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Output "Server is up: $($test.StatusCode)"
} catch {
    Write-Output "Server not reachable on localhost:3000, trying preview URL..."
    # The sandbox might be on a different URL
    $url = "http://21.0.12.33:3000/api/upload-model"
}

$files = Get-ChildItem -Path $src -Filter *.glb
$ok = 0
$fail = 0
foreach ($f in $files) {
    # Skip files that are too large (> 40MB)
    if ($f.Length -gt 40000000) {
        Write-Output "SKIP (too large): $($f.Name) ($([math]::Round($f.Length/1MB, 1))MB)"
        continue
    }
    # Skip duplicates
    if ($f.Name -match '\(1\)' -or $f.Name -eq 'potted_plant.glb') {
        Write-Output "SKIP (dup/skip): $($f.Name)"
        continue
    }
    try {
        $bytes = [IO.File]::ReadAllBytes($f.FullName)
        $tempFile = $f.FullName
        $formData = @{
            file = Get-Item $tempFile
            filename = $f.Name
        }
        $response = Invoke-WebRequest -Uri $url -Method POST -Form $formData -UseBasicParsing -TimeoutSec 60
        if ($response.StatusCode -eq 200) {
            Write-Output "OK: $($f.Name) ($([math]::Round($f.Length/1KB, 0))KB)"
            $ok++
        } else {
            Write-Output "FAIL: $($f.Name) (HTTP $($response.StatusCode))"
            $fail++
        }
    } catch {
        Write-Output "FAIL: $($f.Name) - $($_.Exception.Message.Substring(0, [Math]::Min(80, $_.Exception.Message.Length)))"
        $fail++
    }
}
Write-Output "DONE: $ok OK, $fail FAIL"
