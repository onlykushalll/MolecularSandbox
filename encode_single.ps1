Add-Type -AssemblyName System.IO
$src = "C:\Users\Default.L-HCG-9FVVGS3\Downloads\3d-models"
$dst = "C:\Users\Default.L-HCG-9FVVGS3\Downloads\3d-models\single"
if (!(Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force }
$files = Get-ChildItem -Path $src -Filter *.glb
foreach ($f in $files) {
    # Skip large/dup files
    if ($f.Length -gt 40000000) { continue }
    if ($f.Name -match '\(1\)' -or $f.Name -eq 'potted_plant.glb') { continue }
    $bytes = [IO.File]::ReadAllBytes($f.FullName)
    $b64 = [Convert]::ToBase64String($bytes)
    $outName = $f.BaseName -replace '[^a-zA-Z0-9_-]', '_'
    $outPath = Join-Path $dst ($outName + ".b64")
    # Write as SINGLE LINE (no line breaks)
    [IO.File]::WriteAllText($outPath, $b64)
    Write-Output "OK: $($f.Name) -> $outName.b64 ($($b64.Length) chars, 1 line)"
}
Write-Output "ALL_DONE"
