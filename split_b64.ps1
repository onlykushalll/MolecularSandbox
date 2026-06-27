Add-Type -AssemblyName System.IO
$src = "C:\Users\Default.L-HCG-9FVVGS3\Downloads\3d-models\b64"
$dst = "C:\Users\Default.L-HCG-9FVVGS3\Downloads\3d-models\chunks"
if (!(Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force }

$files = Get-ChildItem -Path $src -Filter *.b64
$count = 0
foreach ($f in $files) {
    $lines = Get-Content $f.FullName
    # Skip the certutil header/footer lines
    $dataLines = $lines | Where-Object { $_ -notmatch 'BEGIN CERT' -and $_ -notmatch 'END CERT' -and $_.Trim() -ne '' }
    $totalLines = $dataLines.Count
    $chunkSize = 800
    $numChunks = [Math]::Ceiling($totalLines / $chunkSize)
    $baseName = $f.BaseName
    for ($i = 0; $i -lt $numChunks; $i++) {
        $start = $i * $chunkSize
        $end = [Math]::Min(($i + 1) * $chunkSize, $totalLines)
        $chunk = $dataLines[$start..($end - 1)]
        $chunkPath = Join-Path $dst "$baseName.part$i"
        [IO.File]::WriteAllText($chunkPath, ($chunk -join "`n"))
    }
    $count++
    Write-Output "Split: $($f.Name) -> $numChunks parts"
}
Write-Output "DONE: $count files split into chunks"
