$orig = "C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models"
$optim = "C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models_optimized"
$final = "C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models_final"
New-Item -ItemType Directory -Force -Path $final | Out-Null

$report = @()
Get-ChildItem $orig -Filter *.glb | ForEach-Object {
  $name = $_.Name
  $origSize = $_.Length
  $optimPath = Join-Path $optim $name
  $optimSize = (Get-Item $optimPath -ErrorAction SilentlyContinue).Length
  if ($optimSize -and ($optimSize -lt ($origSize * 0.9))) {
    Copy-Item $optimPath (Join-Path $final $name) -Force
    $report += [PSCustomObject]@{Name=$name; Used="optimized"; OrigMB=[math]::Round($origSize/1MB,2); FinalMB=[math]::Round($optimSize/1MB,2)}
  } else {
    Copy-Item $_.FullName (Join-Path $final $name) -Force
    $report += [PSCustomObject]@{Name=$name; Used="original"; OrigMB=[math]::Round($origSize/1MB,2); FinalMB=[math]::Round($origSize/1MB,2)}
  }
}
$report | Export-Csv "$final\_final_report.csv" -NoTypeInformation
$totalFinal = ($report | Measure-Object FinalMB -Sum).Sum
$totalOrig = ($report | Measure-Object OrigMB -Sum).Sum
$usedOptim = ($report | Where-Object Used -eq "optimized").Count
Write-Host "TOTAL_ORIG_MB=$totalOrig  TOTAL_FINAL_MB=$totalFinal  FILES_USING_OPTIMIZED=$usedOptim of $($report.Count)"
