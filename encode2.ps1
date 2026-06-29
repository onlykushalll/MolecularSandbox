$src = "C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models"
$dst = "C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models\b64temp"
if (!(Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force }
$files = @("lab_bench.glb", "fume_cupboards.glb")
foreach ($f in $files) {
    $bytes = [IO.File]::ReadAllBytes("$src\$f")
    $b64 = [Convert]::ToBase64String($bytes)
    [IO.File]::WriteAllText("$dst\$($f).b64", $b64)
    Write-Output "OK: $f ($($b64.Length) chars)"
}
Write-Output "DONE"
