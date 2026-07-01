# 🏛️ THE MOLECULAR SANDBOX — Complete Redesign Brief
## For AI Interior Designer / Game Architect

---

## 📋 PROJECT CONTEXT

**What:** The Molecular Sandbox — a first-person 3D chemistry lab simulator (like GTA but for chemistry)
**Stack:** Next.js 16 + React Three Fiber + Three.js + TypeScript + Tailwind CSS + Prisma/SQLite
**Location on PC:** `C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox`
**GitHub:** `github.com/onlykushalll/MolecularSandbox`
**73 real 3D models (.glb):** `public/models/` — includes fume hood, lab bench, microscope, analytical balance, bunsen burner, hot plate, centrifuge, spectrophotometer, pH meter, thermometer, fire extinguisher, emergency shower, gas cylinder, lab coat, goggles, glove box, test tubes, graduated cylinders, flasks, funnels, pipettes, burette, ring stand, desiccator, mortar & pestle, safety cabinet, bookshelf, plant, lab chair, office chair, trash bin, Apple desktop (ordering terminal), double door, window, ceiling lights, whiteboard, periodic table, wall clock, warning signs, fire blanket, first aid kit, sharps container, and more.
**61 chemicals** with real Indian market prices (₹0–₹8,500), ₹10,000 budget
**28 chemical reactions** with real thermodynamics (ΔH, ΔT, stoichiometry, precipitates, gas evolution)

---

## 🎯 CURRENT PROBLEMS (Be Brutal — Fix ALL of These)

### Visual:
1. **Models are wrong scale** — some are too small, some too large, floating in air, clipping through bench
2. **Only 14 of 73 models are wired** — 59 models sit unused in `public/models/`
3. **No post-processing** — bloom, AO, vignette were removed due to WebGL crash (need Draco compression first)
4. **Lighting is flat** — no shadows, no ambiance, no warmth, feels like a warehouse not a lab
5. **LabFurniture.tsx still uses procedural boxes** for some items (fume hood interior, side bench, decor)
6. **No reflections** — glass beakers and metal surfaces don't reflect environment
7. **No atmosphere** — no dust motes, no ambient particles, no fog, no depth
8. **Floor is boring** — flat color, no texture, no reflection, no grid pattern visible

### UX:
9. **No audio** — completely silent, no ambient hum, no interaction sounds, no pour/reaction sounds
10. **Hand animations are static** — arms don't move when picking up, pouring, or interacting
11. **No pour animation** — no liquid stream from bottle to beaker
12. **No door/drawer animation** — everything is static
13. **Hints disappear too fast** — 10 seconds isn't enough for new players
14. **No tutorial** — player doesn't know what to do

### Technical:
15. **WebGL crashes** with too many models — need Draco compression + instanced rendering
16. **Lazy loading works** but render distance is too small (5m) — models pop in/out visibly
17. **No LOD system** — all models are full detail even when far away
18. **Shadows disabled** — WebGL crash prevention, but kills realism

---

## 🏗️ ARCHITECTURE — How Everything Connects

```
src/
├── app/
│   ├── page.tsx              ← Main entry: loads data, renders scene + HUD
│   ├── layout.tsx            ← Sonner toaster
│   ├── globals.css           ← All custom CSS (5000+ lines)
│   ├── api/
│   │   ├── proxy/route.ts    ← MCPilot bridge (Cloudflare tunnel)
│   │   ├── upload-model/route.ts ← File upload endpoint
│   │   ├── chemicals/route.ts ← 61 chemicals from DB
│   │   ├── reactions/route.ts ← 28 reactions from DB
│   │   └── assistant/route.ts ← AI Lab Assistant (z-ai-web-dev-sdk)
│   └── bridge/page.tsx       ← MCPilot bridge page
├── components/
│   ├── lab/
│   │   ├── RealModels.tsx     ← ALL 3D model components + LazyModel loader
│   │   ├── FirstPersonScene.tsx ← Canvas + lighting + scene composition
│   │   ├── LabRoom.tsx        ← Room geometry (walls, floor, ceiling, lights)
│   │   ├── FirstPersonController.tsx ← WASD + mouse look + collision
│   │   ├── InteractionSystem.tsx ← Raycaster + right-click/left-click
│   │   ├── InteractableMesh.tsx ← Wrapper for hover/click on 3D objects
│   │   ├── PlayerBody.tsx     ← First-person coat/arms/hands viewmodel
│   │   ├── FPHUD.tsx          ← Minimal diegetic HUD (crosshair, prompts)
│   │   ├── ChemicalShelfRack.tsx ← Renders bottles on shelf
│   │   ├── OrderingTerminalUI.tsx ← Chemical ordering catalog overlay
│   │   └── LabFurniture.tsx   ← OLD procedural furniture (REPLACE with models)
│   ├── molecule/
│   │   ├── MoleculeModal.tsx  ← 3D molecule viewer modal
│   │   └── MoleculeViewer3D.tsx
│   └── ui-panels/             ← OLD orbit-camera panels (15 files, unused in FP mode)
├── lib/
│   ├── store/
│   │   ├── player-store.ts    ← Player position, budget, PPE, held item, orders
│   │   └── lab-store.ts       ← Containers, chemicals, reactions, heating tick
│   ├── chemistry/             ← Full chemistry engine
│   │   ├── engine.ts          ← Reaction processing
│   │   ├── stoichiometry.ts   ← Limiting reagent, ΔT calculation
│   │   ├── mixture.ts         ← Color mixing, pH calculation
│   │   ├── solubility.ts      ← Precipitate rules
│   │   ├── molecule.ts        ← 3D molecule layout engine
│   │   ├── types.ts           ← TypeScript types
│   │   ├── presets.ts         ← 8 preset experiments
│   │   └── mechanisms.ts      ← Reaction mechanisms
│   ├── sound/sound-manager.ts ← Web Audio API synthesized sounds
│   ├── achievements/          ← 21 achievements
│   ├── db.ts                  ← Prisma client
│   └── utils.ts               ← cn() utility
├── data/chemical-prices.json  ← 61 chemicals with real ₹ prices
└── hooks/                     ← use-mobile, use-toast
```

---

## 🎨 DESIGN VISION — "The Real Lab"

### Reference: Modern University Chemistry Lab (2024)
Think: MIT, ETH Zurich, IIT Bombay — clean, bright, professional, slightly clinical but warm enough to feel welcoming. NOT a hospital. NOT a sci-fi movie. A REAL lab where real scientists work.

### Color Palette:
```
Floor:      #d4d8de (light grey epoxy, glossy, reflects light)
Walls:      #e8ecf0 (soft blue-white, calming)
Ceiling:    #f0f2f5 (pure white)
Bench top:  #2a2e38 (dark resin, matte, professional)
Metal:      #c0c4cc (brushed steel)
Glass:      #e8f5f4 (clear, faint blue-green tint)
Accent 1:   #34d399 (lab green — for interactive highlights, go signals)
Accent 2:   #22d3ee (cyan — for data/instruments)
Warning:    #f59e0b (amber — for heat, caution)
Danger:     #ef4444 (red — for hazards, emergencies)
Text:       #e2e8f0 (light grey on dark)
Background: #0a0e14 (deep charcoal — UI overlays)
```

### Lighting Design:
```
Ambient:     0.5 intensity, color #f0f4f8 (soft white)
Key light:   Directional from above, 0.8 intensity, casts shadows
Ceiling:     9 point lights (3x3 grid), each 0.3 intensity, color #f0f4f8
Window:      Directional from east, 0.3 intensity, color #d4e8f5 (daylight)
Fume hood:   Internal LED strip, emissive material + point light, 0.4 intensity
Bunsen:      Point light when on, color #ff6600, 2.0 intensity, flickering
Hot plate:   Point light when on, color #ff3300, 0.3 intensity
Beaker (hot):Point light when temp > 60°C, color #ff3300, 0.4 intensity
```

### Post-Processing (after Draco compression):
```
Bloom:       intensity 0.4, threshold 0.8 (for flames, screens, LEDs)
AO:          ambient occlusion, intensity 0.5 (depth in corners)
Vignette:    offset 0.15, darkness 0.4 (subtle edge darkening)
Tone mapping: ACES Filmic, exposure 1.15
SMAA:        anti-aliasing
```

### Material Standards (PBR):
```
Glass (beakers/bottles):
  transmission: 0.92, IOR: 1.5, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.02, thickness: 0.005

Metal (instruments/frames):
  metalness: 0.9, roughness: 0.15, color: #c0c4cc

Plastic (caps/housing):
  metalness: 0.1, roughness: 0.4, color: category-specific

Resin (bench top):
  metalness: 0.3, roughness: 0.2, clearcoat: 0.5, color: #2a2e38

Epoxy (floor):
  metalness: 0.15, roughness: 0.25, clearcoat: 0.3, color: #d4d8de

Painted walls:
  metalness: 0, roughness: 0.85, color: #e8ecf0
```

---

## 📐 LAB LAYOUT — Precise Dimensions & Positions

### Room: 14m × 10m, 2.8m ceiling
```
         NORTH WALL (z = -5)
    ┌─────────────────────────┐
    │  [FUME HOOD]            │
    │  ┌──────┐               │
    │  │      │  [WHITEBOARD] │
    │  └──────┘               │
    │                         │
    │  [BENCH]                │
    │  ┌──────────────────┐   │
 W │  │ 🔬 ⚗️ 🔥 ⚖️ 🧪   │   │ E
 E │  │  beakers bunsen   │   │ A
 S │  │  balance microscope│   │ S
 T │  └──────────────────┘   │ T
   │                         │
   │  [SHELF]    [CABINET]   │
   │  [BOOKSHELF]            │
   │                         │
   │  [PLANT]  [CHAIR]       │
   │            [TERMINAL]   │
    └────────[DOOR]──────────┘
         SOUTH WALL (z = +5)
```

### Object Positions (x, y, z) with Scale:
```javascript
// FURNITURE
fumeHood:        { pos: [0, 0, -5],     scale: 2.0 }
labBench:        { pos: [0, 0, 0],      scale: 2.5 }
storageCabinet:  { pos: [6.5, 0, -2.5], scale: 1.5 }
safetyCabinet:   { pos: [-7, 0, -2],    scale: 1.0 }
sink:            { pos: [-7.3, 0, 4],   scale: 0.6 }

// BENCH EQUIPMENT (on top of bench, y = 1.0)
beaker1:         { pos: [-1.5, 1.0, 0], scale: 1.0 }
beaker2:         { pos: [0, 1.0, 0],    scale: 1.0 }
beaker3:         { pos: [1.5, 1.0, 0],  scale: 1.0 }
bunsenBurner:    { pos: [-2.5, 1.0, 0.3], scale: 0.3 }
hotPlate:        { pos: [-2.5, 1.0, -0.3], scale: 0.2 }
analyticalBalance: { pos: [2.5, 1.0, 0.5], scale: 0.25 }
microscope:      { pos: [-2.5, 1.0, 0.5], scale: 0.2 }
spectrophotometer: { pos: [3, 1.0, 0],   scale: 0.3 }
centrifuge:      { pos: [3.5, 1.0, -0.5], scale: 0.25 }
ringStand:       { pos: [2.5, 1.0, -0.5], scale: 0.3 }
burette:         { pos: [2.5, 1.5, -0.3], scale: 0.2 }
desiccator:      { pos: [-2, 1.0, -0.5], scale: 0.15 }
mortarPestle:    { pos: [1.5, 1.0, 0.5], scale: 0.15 }
testTubeRack:    { pos: [1.5, 1.0, -0.3], scale: 0.2 }
graduatedCylinder: { pos: [-1.5, 1.0, 0.5], scale: 0.2 }
funnel:          { pos: [1.0, 1.0, -0.3], scale: 0.15 }
pipette:         { pos: [-1.0, 1.0, 0.5], scale: 0.2 }
stopwatch:       { pos: [2.0, 1.0, 0.3], scale: 0.1 }
thermometer:     { pos: [-3.0, 1.0, 0.5], scale: 0.15 }
phMeter:         { pos: [-3.5, 1.0, 0.5], scale: 0.2 }

// SAFETY (along walls)
fireExtinguisher: { pos: [4.5, 0, 5],    scale: 0.5 }
fireBlanket:     { pos: [-5, 1.5, 5.8], scale: 0.3 }
firstAidKit:     { pos: [-5.5, 1.5, 5.8], scale: 0.3 }
emergencyShower: { pos: [-7, 0, 3],      scale: 0.5 }
sharpsContainer: { pos: [3, 1.0, 5],    scale: 0.3 }
gloveBox:        { pos: [-6, 1.0, 4.3], scale: 0.3 }
labCoat:         { pos: [-6.5, 1.0, 4.5], scale: 0.4 }
goggles:         { pos: [-5.5, 1.0, 4.3], scale: 0.3 }
warningSigns:    { pos: [0, 2.5, -5.8],  scale: 0.4 }

// DECOR
whiteboard:      { pos: [6.89, 1.6, -1], scale: 0.5, rot: [0, -PI/2, 0] }
periodicTable:   { pos: [-6.89, 1.8, 2], scale: 0.3, rot: [0, PI/2, 0] }
wallClock:       { pos: [5, 2.7, -5.8],  scale: 0.3 }
bookshelf:       { pos: [-7.5, 0, -3],   scale: 0.6 }
plant:           { pos: [7.2, 0, 5],     scale: 0.5 }
labChair:        { pos: [2.5, 0, 1.5],   scale: 0.4 }
officeChair:     { pos: [6, 0, 5],       scale: 0.4 }
trashBin:        { pos: [5, 0, 5.5],     scale: 0.3 }
gasCylinder:     { pos: [-6, 0, -4],     scale: 0.4 }

// ELECTRONICS
orderTerminal:   { pos: [6, 1.0, 4.5],   scale: 0.5 }

// ROOM
door:            { pos: [2, 0, 5.8],     scale: 1.0 }
window:          { pos: [6.8, 1.5, 1.5], scale: 0.5, rot: [0, -PI/2, 0] }
ceilingLights:   3x3 grid at y=2.75,     scale: 0.3
```

---

## 🎬 ANIMATIONS NEEDED

### Player Body (PlayerBody.tsx):
```
Idle:        Arms sway gently (sin wave, 0.5s period, 0.01m amplitude)
Walking:     Arms swing opposite to legs (sin wave, 1s period)
Sprinting:   Arms swing faster (sin wave, 0.6s period, larger amplitude)
Holding:     Right arm raised, hand gripping bottle (static + slight bob)
Pouring:     Right arm tilts forward 30°, bottle tilts, liquid stream appears
Interacting: Right arm reaches forward, hand presses button
```

### Liquid Pouring (particle-based):
```
1. Bottle tilts → spout points toward beaker
2. Particle stream: 20-30 droplets, parabolic arc from spout to beaker
3. Each droplet: small sphere, color = chemical hexColor, gravity = -9.8
4. On impact: splash particle burst (5 small spheres, radial)
5. Beaker liquid level rises in real-time
6. Sound: "glug glug" (Web Audio API, low frequency oscillation)
```

### Flame (Bunsen Burner):
```
Outer cone:  height 0.15m, color #ff5500, opacity 0.7, additive blending
Inner cone:  height 0.12m, color #00bbff, opacity 0.85, additive blending
Tip:         small sphere, color #ffdd00, opacity 0.7
Light:       pointLight, color #ff6600, intensity 2.0, flickering (sin*8 + sin*15)
Particles:   12 spark particles rising, fading
Sound:       continuous hiss (white noise, low volume)
```

### Reaction Effects:
```
Flash:       Full-screen radial gradient, green (#22c55e), 0.6s fade
Bubbles:     10-15 small white spheres rising in beaker (when hot)
Steam:       8 grey spheres rising above beaker (when temp > 70°C)
Precipitate: 20-30 dodecahedrons settling at bottom (colored by salt)
Gas:         6 colored spheres rising + drifting (when gas evolved)
Color change:Lerp from old color to new color over 0.5s
Sound:       "pop + fizz" (oscillator + noise burst)
```

### Door/Drawer:
```
Door:    Rotate Y from 0° to 90° over 0.5s, ease-in-out
Drawer:  Translate Z from 0 to 0.3m over 0.3s
Cabinet: Rotate X from 0° to 60° over 0.4s (hinged at top)
```

---

## 🔊 AUDIO DESIGN

### Ambient (always playing):
```
Fluorescent buzz:   40Hz sine wave, 0.02 volume, continuous
Air conditioning:   Brown noise, 0.01 volume, low-pass filtered, continuous
Room tone:          Very subtle reverb (convolver with small room impulse)
```

### Interaction Sounds:
```
Footstep:     Short noise burst, 0.1s, 0.05 volume, every 0.5s (walk) / 0.3s (sprint)
Pickup:       "Click" — 800Hz square wave, 0.05s, 0.1 volume
Drop:         "Thud" — 100Hz sine wave, 0.1s, 0.1 volume
Pour:         "Glug" — 200Hz oscillation with noise, 0.3s, 0.15 volume
Reaction:     "Pop + fizz" — noise burst + descending tone, 0.5s, 0.2 volume
Bunsen on:    "Whoosh" — noise sweep, 0.3s, 0.15 volume
Bunsen hiss:  White noise, 0.03 volume, continuous while on
Bubbles:      "Blup blup" — random 300Hz tones, 0.05 volume, every 0.3s when hot
Steam:        "Sssss" — filtered noise, 0.04 volume, continuous when temp > 70°C
UI click:     "Tick" — 1200Hz square wave, 0.02s, 0.08 volume
Success:      C major chord (C4+E4+G4), 0.3s, 0.15 volume
Warning:      Two-tone alert (A3→A4), 0.2s each, 0.15 volume
Glass break:  Noise burst + descending frequency, 0.5s, 0.2 volume
Delivery:     "Ding dong" — two-tone bell, 0.5s, 0.15 volume
```

---

## ⚡ PERFORMANCE PLAN

### Step 1: Draco Compression (DO THIS FIRST)
```bash
# Install gltf-transform
npm install -g @gltf-transform/cli

# Compress all models (90% size reduction)
for file in public/models/*.glb; do
  gltf-transform optimize "$file" "$file" --texture-compress webp --meshopt
done
```

### Step 2: Enable Shadows + Post-Processing
After Draco compression, re-enable:
- `shadows` on Canvas
- `EffectComposer` with Bloom, Vignette, SMAA
- `Environment preset="warehouse"` for reflections
- `ContactShadows` under bench

### Step 3: Instanced Rendering
For repeated objects:
- Ceiling lights → `<Instances>` (9 instances, 1 geometry)
- Shelf bottles → `<Instances>` (15+ bottles, 1 geometry)
- Floor tiles → `<Instances>` (if using tile model)

### Step 4: LOD (Level of Detail)
```
Distance < 3m:  Full model (all meshes)
Distance < 8m:  Model (simplified — remove small details)
Distance > 8m:  Don't render
```

---

## 🎮 INTERACTION MODEL

### Controls:
```
WASD:          Move (Shift = sprint)
Mouse:         Look (pointer lock)
Left-Click:    Use/Interact (pour, press button, select)
Right-Click:   Pick up/Grab (bottles, items)
E:             Interact (alternative)
Q:             Drop held item
1/2/3:         Select beaker 1/2/3
R:             Trigger reaction on selected beaker
X:             Empty selected beaker
T:             Open/close ordering terminal
B:             Toggle Bunsen burner
P:             Toggle all PPE
F:             Focus mode (hide both sidebars)
Esc:           Release mouse
```

### Hover System:
```
Looking at interactable:
  - Object gets emissive edge glow (color = interaction type)
  - Crosshair expands + turns green
  - Contextual prompt appears: "[E] Pick up HCl" or "[L-Click] Pour"

Holding item + looking at beaker:
  - Beaker gets cyan glow
  - Prompt: "[L-Click] Pour into BEAKER-1"

Holding nothing + looking at beaker:
  - Beaker gets green glow
  - Prompt: "[L-Click] Select BEAKER-1"
```

### PPE Enforcement:
```
No coat + no goggles + no gloves:
  → Cannot pour chemicals
  → Toast: "⚠ Safety violation! Equip PPE first"
  → Cannot trigger reactions
  → Can still walk around, pick up items, use terminal
```

---

## 📊 INSTRUMENT DATA (All Real, No Fake)

### Thermometer (fever_thermometer.glb):
- Reads `selectedContainer.temperature` from lab-store
- Liquid column height = `(temp / 150) * tubeLength`
- Color: blue (<10°C) → green (25°C) → orange (60°C) → red (100°C+)
- Digital readout on hover: `{temp.toFixed(1)}°C`

### pH Meter (low_poly_digital_ph_meter.glb):
- Reads `calculatePH(contents, chemicalsMap)` from chemistry engine
- Display: `{ph.toFixed(2)}` in color (red acidic → green neutral → blue basic)
- Updates in real-time as reactions change pH

### Analytical Balance (04_analytical_balance.glb):
- Reads `sum(moles) * 100` from selected beaker
- Display: `{mass.toFixed(3)} g`
- Glass draft shield visible

### Spectrophotometer (spectrophotometer.glb):
- Reads Beer-Lambert absorbance from chemical color
- Display: absorbance value + wavelength
- Cuvette slot visible

---

## 🧪 CHEMISTRY SYSTEM (Already Working — Don't Break This)

### Flow:
```
1. Player picks up bottle (right-click) → heldItem set
2. Player walks to beaker → looks at it → left-click
3. PPE check → if no PPE, block + toast
4. addChemicalToContainer(containerId, chemicalId, volume, autoReact=true)
5. If autoReact + matching reaction exists → triggerReaction after 300ms
6. Reaction processes: limiting reagent, products, ΔT, precipitates, gas
7. Temperature updates → heating tick every 500ms
8. Visual effects: flash, bubbles, steam, precipitate, color change
9. Toast: "Reaction Complete! NaOH + HCl → NaCl + H₂O · ΔT = +278.2°C"
10. Achievement check → unlock if conditions met
```

### Key Functions (in lab-store.ts):
- `addChemicalToContainer(containerId, chemicalId, volume, autoReact)`
- `triggerReaction(containerId)`
- `heatingTick()` — runs every 500ms, heats/cools beakers
- `emptyContainer(containerId)`
- `selectContainer(containerId)`

---

## 📦 MODELS TO LOAD (ALL 73)

### Critical (load immediately at spawn):
1. lab_bench.glb
2. fume_cupboards.glb
3. bunsen_burner.glb
4. 01_reagent_bottle_100ml.glb (for shelf bottles)

### Bench Equipment (load within 5m):
5. 02_hot_plate_magnetic_stirrer.glb
6. 04_analytical_balance.glb
7. microscope_swift_sw380b.glb
8. spectrophotometer.glb
9. 13_centrifuge.glb
10. 03_ring_retort_stand.glb
11. 05_burette_50ml.glb
12. 12_desiccator.glb
13. mortar_and_pestle.glb
14. test_tube_rack.glb
15. graduated_cylinder.glb
16. cc0_-_funnel_3.glb
17. free_pipette__laboratory__low_poly.glb
18. stopwatch-284.glb
19. fever_thermometer.glb
20. low_poly_digital_ph_meter.glb

### Furniture (load within 8m):
21. laboratory_cabinet_storage__pbr_low_poly__free.glb
22. 06_safety_cabinet_yellow.glb
23. gameready_wash_basin_model.glb
24. bookshelf_cc0.glb
25. lab_chair.glb
26. office_chair.glb
27. trash_bin.glb
28. gas_cylinder_tank_co2_helium_nitrogen.glb

### Safety (load within 8m):
29. carbon_dioxide_fire_extinguisher_-__co2.glb
30. fire_blanket_free_low_poly.glb
31. tactical_first_aid_kit.glb
32. emergency_shower_with_eye_wash.glb
33. hospital_sharps_container.glb
34. nitrile_glove_box_v2.glb
35. 07_lab_coat_hanging.glb
36. glasses.glb
37. warning_signs__virus_laboratory.glb

### Decor (load within 10m):
38. whiteboard (1).glb
39. the_3d_periodic_table.glb
40. wall_clock.glb
41. indoor_plant.glb
42. apple_desktop.glb (ordering terminal)
43. double_door.glb
44. window.glb
45. ceiling_light_round.glb (×9)

### Glassware (on shelf, load within 5m):
46. erlenmeyer_flask.glb
47. florence_flask.glb
48. simple_lab_round_bottom_flask.glb
49. volumetric_flasks.glb
50. test_tube.glb
51. petri_dish_collection__by_3dlabware.glb
52. bottle_with_dropper.glb
53. treatment_serum_dropper_bottle.glb
54. wash_bottle.glb
55. mechanical_pipette.glb
56. crucible_tongs_-_game_ready.glb
57. tripod_stand.glb
58. 08_b_chner_funnel.glb
59. 09_filter_flask_vacuum_250ml.glb
60. 10_condenser_liebig.glb
61. 11_separatory_funnel.glb
62. beakers(all-3-in-one).glb
63. the_pen.glb
64. pencil.glb
65. single_spiral_notepad.glb
66. ruler.glb
67. wooden_spatula.glb
68. cafeteria_tile_3d_scan.glb
69. ceiling_lampslights_set-up.glb
70. monster_plant.glb
71. laser_thermometer.glb
72. gaming_desktop_pc.glb
73. fire_extinguisher.glb

---

## ✅ ACCEPTANCE CRITERIA

The redesign is complete when:

1. **All 73 models load** and are visible in the lab (no missing objects)
2. **No WebGL crash** — stable 30+ FPS with all models loaded
3. **Post-processing active** — bloom on flames/screens, vignette, AO visible
4. **Shadows enabled** — objects cast shadows on bench and floor
5. **Audio working** — ambient hum, footstep, pickup, pour, reaction sounds
6. **Hand animations** — arms move when walking, holding, pouring
7. **Pour animation** — visible liquid stream from bottle to beaker
8. **All instruments show real data** — thermometer, pH meter, balance
9. **VLM rates 8/10+** — "looks like a real lab, not a game"
10. **No broken imports** — all files compile clean
11. **Chemistry still works** — pour → react → ΔT → effects
12. **All code synced to PC** + pushed to GitHub

---

## 🔑 KEY FILES TO MODIFY

```
RealModels.tsx        → Add ALL 73 model components with correct positions/scales
FirstPersonScene.tsx  → Add post-processing, shadows, Environment, all models
LabRoom.tsx           → Keep current design (already redesigned)
FPHUD.tsx             → Keep current diegetic design (already minimal)
PlayerBody.tsx        → Add walk/pour/interact animations
InteractionSystem.tsx → Keep right-click/left-click (already working)
sound-manager.ts      → Add ambient + interaction sounds
page.tsx              → Add audio initialization, keep sceneReady pattern
LabFurniture.tsx      → DELETE (replaced by RealModels components)
```

---

## 🚀 START HERE

1. Read this document completely
2. Read `uploaded/GAME_DESIGN_RESEARCH.md` for additional design research
3. Install Draco compression: `npm install -g @gltf-transform/cli`
4. Compress all models: `gltf-transform optimize input.glb output.glb --meshopt`
5. Rewrite `RealModels.tsx` with ALL 73 model components
6. Rewrite `FirstPersonScene.tsx` with post-processing + shadows + all models
7. Add audio to `sound-manager.ts`
8. Add animations to `PlayerBody.tsx`
9. Test in browser with agent-browser + VLM
10. Sync to PC + push to GitHub

**Be a fashion critic. If it doesn't look like a real lab, fix it. Don't ship until VLM says 8/10+.**
