$models = "C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models"
$out = "C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models_optimized"
New-Item -ItemType Directory -Force -Path $out | Out-Null

# HERO tier: held constantly, or the primary gameplay/architectural focus. Kept sharp (2048 max).
$hero = @(
  "01_reagent_bottle_100ml.glb","bottle_with_dropper.glb","treatment_serum_dropper_bottle.glb",
  "bunsen_burner.glb","02_hot_plate_magnetic_stirrer.glb","lab_bench.glb","fume_cupboards.glb",
  "04_analytical_balance.glb","03_ring_retort_stand.glb","05_burette_50ml.glb","13_centrifuge.glb",
  "12_desiccator.glb","graduated_cylinder.glb","test_tube.glb","test_tube_rack.glb",
  "erlenmeyer_flask.glb","florence_flask.glb","simple_lab_round_bottom_flask.glb",
  "07_lab_coat_hanging.glb","cafeteria_tile_3d_scan.glb","beakers(all-3-in-one).glb"
)

$results = @()
Get-ChildItem $models -Filter *.glb | ForEach-Object {
  $name = $_.Name
  $isHero = $hero -contains $name
  $maxRes = if ($isHero) { 2048 } else { 1024 }
  $srcPath = $_.FullName
  $dstPath = Join-Path $out $name
  $before = $_.Length
  npx --yes @gltf-transform/cli resize "$srcPath" "$dstPath" --width $maxRes --height $maxRes 2>&1 | Out-Null
  $after = (Get-Item $dstPath -ErrorAction SilentlyContinue).Length
  $tier = if ($isHero) { "HERO-2048" } else { "STD-1024" }
  $results += [PSCustomObject]@{ Name=$name; Tier=$tier; BeforeMB=[math]::Round($before/1MB,2); AfterMB=[math]::Round($after/1MB,2) }
}
$results | Export-Csv -Path "$out\_resize_report.csv" -NoTypeInformation
$totalBefore = ($results | Measure-Object BeforeMB -Sum).Sum
$totalAfter = ($results | Measure-Object AfterMB -Sum).Sum
Write-Host "TOTAL_BEFORE_MB=$totalBefore  TOTAL_AFTER_MB=$totalAfter"
