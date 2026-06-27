$src = "C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models"
$dst = "C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models\b64"
if (!(Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force }
$files = Get-ChildItem -Path $src -Filter *.glb
foreach ($f in $files) {
    $bytes = [IO.File]::ReadAllBytes($f.FullName)
    $b64 = [Convert]::ToBase64String($bytes)
    $outName = $f.BaseName -replace '[^a-zA-Z0-9_-]', '_'
    $outPath = Join-Path $dst ($outName + ".b64")
    [IO.File]::WriteAllText($outPath, $b64)
    Write-Output "OK: $($f.Name)"
}
Write-Output "ALL_DONE"
