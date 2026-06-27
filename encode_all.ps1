$src = "C:\Users\Default.L-HCG-9FVVGS3\Downloads\3d-models"
$dst = "C:\Users\Default.L-HCG-9FVVGS3\Downloads\3d-models\b64"
if (!(Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force }
$files = Get-ChildItem -Path $src -Filter *.glb
foreach ($f in $files) {
    $outName = $f.BaseName -replace '[^a-zA-Z0-9_-]', '_'
    $outPath = Join-Path $dst ($outName + ".b64")
    & certutil -encode $f.FullName $outPath 2>$null
    Write-Output "OK: $($f.Name) -> $outName.b64"
}
Write-Output "ALL_DONE"
