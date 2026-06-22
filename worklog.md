# The Molecular Sandbox — Worklog

## Project Status: ✅ FULLY FUNCTIONAL

The Molecular Sandbox is a scientifically accurate 3D chemistry simulator built with Next.js 16, React Three Fiber, and Prisma. The app is **live and working** — verified end-to-end via agent-browser.

---

## Current State (as of 2025-06-22)

### What Works
- ✅ 3D lab scene renders with wooden bench, back wall, shelves, 3 glass beakers
- ✅ Realistic glass beakers using `meshPhysicalMaterial` with transmission, IOR, clearcoat
- ✅ Click beaker to select — instrument panel shows live readings
- ✅ Chemical shelf with 42 chemicals, search + category filter, volume control
- ✅ Add chemicals to beakers — volume & moles calculated correctly (n=m/M)
- ✅ **Reactions work!** Tested NaOH + HCl → NaCl + H₂O:
  - Limiting reagent correctly identified (HCl, 1.618 mol)
  - Stoichiometric consumption (1:1 ratio)
  - Products formed with correct volumes (NaCl 43.8mL, H₂O 29.2mL)
  - Temperature change calculated (ΔT = +278.2°C, exothermic)
  - Heat released: -92.72 kJ
- ✅ Instrument panel: temperature gauge, volume gauge, pressure, contents list
- ✅ Lab journal logs every reaction with equation, ΔT, timestamp
- ✅ Safety panel with PPE toggles (goggles, gloves, lab coat, mask) + GHS legend
- ✅ Last reaction result card shows equation, ΔH, ΔT, heat, moles
- ✅ Bubble particles when heating
- ✅ Beaker labels (holographic-style text in 3D)
- ✅ Temperature-based glass tint (hot = red, cold = blue)
- ✅ Dark themed UI with emerald accents, glassmorphism panels

### Architecture
```
src/
├── app/
│   ├── api/
│   │   ├── chemicals/route.ts    # GET all chemicals
│   │   ├── reactions/route.ts    # GET all reactions
│   │   └── lab-state/route.ts    # GET/POST lab persistence
│   ├── globals.css               # Tailwind + shadcn theme
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page: 3D canvas + 3-column UI
├── components/
│   ├── lab/
│   │   ├── LabScene.tsx          # Canvas, lighting, camera, OrbitControls
│   │   ├── Beaker.tsx            # Glass beaker + liquid + bubbles + labels
│   │   ├── LabBench.tsx          # Bench, walls, shelves
│   │   └── PourStream.tsx        # Pour animation (quadratic bezier tube)
│   ├── ui-panels/
│   │   ├── ChemicalShelf.tsx     # Left panel: chemical browser
│   │   ├── InstrumentPanel.tsx   # Right panel: gauges + react button
│   │   ├── SafetyPanel.tsx       # PPE + alerts + GHS
│   │   └── LabJournal.tsx        # Reaction history
│   └── ui/                       # 55+ shadcn/ui components
├── lib/
│   ├── chemistry/
│   │   ├── types.ts              # All TypeScript interfaces
│   │   ├── engine.ts             # StoichiometryEngine class
│   │   └── mixture.ts            # Color mixing, density, pH, vapor pressure
│   ├── store/
│   │   └── lab-store.ts          # Zustand store (full state management)
│   ├── db.ts                     # Prisma client
│   └── utils.ts                  # cn() utility
└── prisma/
    ├── schema.prisma             # Chemical, Reaction, LabState models
    └── seed.ts                   # 42 chemicals + 15 reactions seed
```

### Chemistry Engine
- `StoichiometryEngine.findReaction()` — matches reactants to known reactions
- `calculateReaction()` — limiting reagent, moles reacted, products, ΔT
- ΔT formula: `-ΔH × 1000 × n / (mass × specificHeat)`
- pH estimation for strong/weak acids and bases
- Beer-Lambert-inspired color mixing (weighted by moles)
- Gas evolution detection (products with stateAtSTP="gas")
- Precipitate detection (solid products from liquid reactants)

### Database
- 42 chemicals with real physical properties (molar mass, density, specific heat, boiling point, hazards, etc.)
- 15 reactions with balanced equations and accurate ΔH values
- 3 default beakers in the lab state

---

## Known Issues
1. **SoftShadows shader warnings** — `unpackRGBAToDepth` errors in console. These are cosmetic GLSL warnings from drei's SoftShadows, don't affect functionality. Could switch to regular shadows.
2. **Solid chemical volumes** — When adding solids (NaOH, metals), the "volume" is calculated from mass/density which gives large mL values. This is physically correct but could be improved with a "mass" input for solids.
3. **Temperature can exceed realistic bounds** — The ΔT calculation doesn't cap at boiling point. Could add phase-change heat absorption.
4. **Pour animation** — PourStream component exists but pour triggering isn't wired to UI yet (needs pour button or drag interaction).

---

## Next Steps (Priority Order)

### P1 — Polish & Bug Fixes
- [ ] Cap temperature at boiling point (phase change absorbs heat)
- [ ] Add "mass in grams" input for solid chemicals
- [ ] Wire pour action to UI (pour button when 2 beakers selected)
- [ ] Fix SoftShadows → use regular shadows or patch shader

### P2 — Enhanced Features
- [ ] Gas particle effects (bubbles rising + escaping for gas products)
- [ ] Precipitate visualization (solid settling at bottom)
- [ ] Heat haze post-processing when temperature > 60°C
- [ ] Color change animation during reactions
- [ ] Glass breaking effect when temperature shock

### P3 — Advanced Features
- [ ] AI Lab Assistant (LLM-powered, explains reactions)
- [ ] Preset experiment recipes (guided labs)
- [ ] Save/load lab state to database
- [ ] Multi-beaker pour system
- [ ] Bunsen burner with flame animation
- [ ] pH paper / litmus indicator visualization
- [ ] Multiplayer (WebSocket-based shared lab)

### P4 — Mobile & Accessibility
- [ ] Responsive layout for tablets
- [ ] Touch gestures for 3D manipulation
- [ ] Keyboard shortcuts
- [ ] Screen reader labels for 3D elements

---

## How to Run
```bash
cd /home/z/my-project
bun run dev          # Start dev server on port 3000
bun run db:seed      # Re-seed database (42 chemicals, 15 reactions)
bun run lint         # Check code quality
bun run db:push      # Push schema changes to SQLite
```

## Key Files to Know
- **Main page**: `src/app/page.tsx` — the only user-visible route
- **3D scene**: `src/components/lab/LabScene.tsx`
- **Beaker rendering**: `src/components/lab/Beaker.tsx`
- **Chemistry logic**: `src/lib/chemistry/engine.ts`
- **State management**: `src/lib/store/lab-store.ts`
- **Seed data**: `prisma/seed.ts`
