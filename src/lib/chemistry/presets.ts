// Preset experiments — guided one-click recipes for The Molecular Sandbox
export interface PresetStep {
  beakerId: string;
  chemicalName: string;
  volume: number;
}

export interface PresetExperiment {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: "acid-base" | "precipitation" | "gas" | "displacement" | "decomposition";
  expectedEquation: string;
  expectedDeltaH: number;
  steps: PresetStep[];
  safetyNote?: string;
  observation: string;
  color: string; // theme color for the card
}

export const presetExperiments: PresetExperiment[] = [
  {
    id: "neutralization",
    name: "Acid-Base Neutralization",
    description: "Classic strong acid + strong base reaction producing salt and water. Watch the temperature rise!",
    difficulty: "beginner",
    category: "acid-base",
    expectedEquation: "NaOH + HCl → NaCl + H₂O",
    expectedDeltaH: -57.3,
    color: "#ef4444",
    steps: [
      { beakerId: "beaker-1", chemicalName: "Hydrochloric Acid", volume: 50 },
      { beakerId: "beaker-2", chemicalName: "Sodium Hydroxide", volume: 50 },
    ],
    safetyNote: "Both HCl and NaOH are corrosive. Wear goggles and gloves.",
    observation: "Exothermic reaction — temperature rises significantly. Solution remains colorless.",
  },
  {
    id: "golden-rain",
    name: "Golden Rain",
    description: "Beautiful yellow precipitate of lead iodide forms when potassium iodide meets lead nitrate.",
    difficulty: "intermediate",
    category: "precipitation",
    expectedEquation: "2KI + Pb(NO₃)₂ → 2KNO₃ + PbI₂↓",
    expectedDeltaH: -52,
    color: "#facc15",
    steps: [
      { beakerId: "beaker-1", chemicalName: "Potassium Iodide", volume: 50 },
      { beakerId: "beaker-2", chemicalName: "Lead Nitrate", volume: 50 },
    ],
    safetyNote: "Lead compounds are toxic. Avoid skin contact and inhalation.",
    observation: "Brilliant golden-yellow precipitate forms instantly.",
  },
  {
    id: "elephant-toothpaste",
    name: "Oxygen Evolution",
    description: "Catalyzed decomposition of hydrogen peroxide produces vigorous oxygen gas bubbles.",
    difficulty: "intermediate",
    category: "decomposition",
    expectedEquation: "2H₂O₂ →(MnO₂) 2H₂O + O₂↑",
    expectedDeltaH: -196,
    color: "#06b6d4",
    steps: [
      { beakerId: "beaker-1", chemicalName: "Hydrogen Peroxide", volume: 80 },
      { beakerId: "beaker-2", chemicalName: "Manganese Dioxide", volume: 10 },
    ],
    safetyNote: "H₂O₂ is an oxidizer. MnO₂ is harmful if inhaled.",
    observation: "Vigorous bubbling as oxygen gas evolves. Strongly exothermic.",
  },
  {
    id: "silver-tree",
    name: "Silver Tree",
    description: "Copper displaces silver from solution — beautiful silver crystals grow on copper metal.",
    difficulty: "intermediate",
    category: "displacement",
    expectedEquation: "2AgNO₃ + Cu → Cu(NO₃)₂ + 2Ag",
    expectedDeltaH: -147,
    color: "#c0c0c0",
    steps: [
      { beakerId: "beaker-1", chemicalName: "Silver Nitrate", volume: 60 },
      { beakerId: "beaker-2", chemicalName: "Copper", volume: 20 },
    ],
    safetyNote: "Silver nitrate stains skin and is corrosive.",
    observation: "Silver crystals form on copper surface. Solution turns blue (copper nitrate).",
  },
  {
    id: "magnesium-acid",
    name: "Hydrogen Production",
    description: "Magnesium reacts vigorously with hydrochloric acid, producing flammable hydrogen gas.",
    difficulty: "beginner",
    category: "gas",
    expectedEquation: "Mg + 2HCl → MgCl₂ + H₂↑",
    expectedDeltaH: -466,
    color: "#84cc16",
    steps: [
      { beakerId: "beaker-1", chemicalName: "Hydrochloric Acid", volume: 60 },
      { beakerId: "beaker-2", chemicalName: "Magnesium", volume: 15 },
    ],
    safetyNote: "Hydrogen gas is flammable! Keep away from flames.",
    observation: "Rapid bubbling of hydrogen gas. Very exothermic — solution heats up quickly.",
  },
  {
    id: "baking-soda-volcano",
    name: "CO₂ Volcano",
    description: "Baking soda + acid produces carbon dioxide gas — the classic volcano reaction!",
    difficulty: "beginner",
    category: "gas",
    expectedEquation: "NaHCO₃ + HCl → NaCl + H₂O + CO₂↑",
    expectedDeltaH: -11.8,
    color: "#f97316",
    steps: [
      { beakerId: "beaker-1", chemicalName: "Sodium Bicarbonate", volume: 40 },
      { beakerId: "beaker-2", chemicalName: "Hydrochloric Acid", volume: 50 },
    ],
    safetyNote: "HCl is corrosive. Wear eye protection.",
    observation: "Vigorous fizzing as CO₂ gas escapes. Mild temperature rise.",
  },
  {
    id: "copper-precipitate",
    name: "Copper Hydroxide",
    description: "Blue gelatinous precipitate of copper hydroxide forms when NaOH meets copper sulfate.",
    difficulty: "beginner",
    category: "precipitation",
    expectedEquation: "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄",
    expectedDeltaH: -59.8,
    color: "#3b82f6",
    steps: [
      { beakerId: "beaker-1", chemicalName: "Copper Sulfate", volume: 50 },
      { beakerId: "beaker-2", chemicalName: "Sodium Hydroxide", volume: 50 },
    ],
    safetyNote: "CuSO₄ is toxic to aquatic life. NaOH is corrosive.",
    observation: "Bright blue gelatinous precipitate forms immediately.",
  },
  {
    id: "iron-displacement",
    name: "Iron displaces Copper",
    description: "Iron pushes copper out of solution — blue copper sulfate fades to green iron sulfate.",
    difficulty: "intermediate",
    category: "displacement",
    expectedEquation: "Fe + CuSO₄ → FeSO₄ + Cu",
    expectedDeltaH: -156,
    color: "#10b981",
    steps: [
      { beakerId: "beaker-1", chemicalName: "Copper Sulfate", volume: 60 },
      { beakerId: "beaker-2", chemicalName: "Iron", volume: 20 },
    ],
    observation: "Blue solution gradually turns pale green. Copper metal deposits on iron.",
  },
];
