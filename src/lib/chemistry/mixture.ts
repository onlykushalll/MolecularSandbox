// Mixture calculation utilities for The Molecular Sandbox
import type {
  ChemicalData,
  ContainerContent,
} from "./types";

/**
 * Calculate total mass of all contents in a container.
 * mass = volume × density (for liquids), or moles × molarMass (for solids)
 */
export function calculateTotalMass(
  contents: ContainerContent[],
  chemicals: Map<string, ChemicalData>
): number {
  return contents.reduce((total, content) => {
    const chem = chemicals.get(content.chemicalId);
    if (!chem) return total;
    if (chem.stateAtSTP === "liquid" || chem.stateAtSTP === "gas") {
      return total + content.volume * chem.density;
    }
    // solids: use moles × molarMass
    return total + content.moles * chem.molarMass;
  }, 0);
}

/**
 * Calculate mass-weighted average specific heat capacity.
 */
export function calculateAverageSpecificHeat(
  contents: ContainerContent[],
  chemicals: Map<string, ChemicalData>
): number {
  let weightedSum = 0;
  let totalMass = 0;
  for (const content of contents) {
    const chem = chemicals.get(content.chemicalId);
    if (!chem) continue;
    const mass =
      chem.stateAtSTP === "liquid" || chem.stateAtSTP === "gas"
        ? content.volume * chem.density
        : content.moles * chem.molarMass;
    weightedSum += mass * chem.specificHeatCapacity;
    totalMass += mass;
  }
  if (totalMass === 0) return 4.18; // default water
  return weightedSum / totalMass;
}

/**
 * Calculate overall density of the mixture.
 */
export function calculateDensity(
  contents: ContainerContent[],
  chemicals: Map<string, ChemicalData>
): number {
  const totalMass = calculateTotalMass(contents, chemicals);
  const totalVolume = contents.reduce((sum, c) => sum + c.volume, 0);
  if (totalVolume === 0) return 1.0;
  return totalMass / totalVolume;
}

/**
 * Check if mixture is homogeneous (all liquids are miscible).
 * Simplified: assume miscible unless containing immiscible solvents.
 */
export function isHomogeneous(
  contents: ContainerContent[],
  chemicals: Map<string, ChemicalData>
): boolean {
  if (contents.length <= 1) return true;
  const hasOil = contents.some((c) => {
    const chem = chemicals.get(c.chemicalId);
    return chem && chem.category === "organic" && chem.name.toLowerCase().includes("oil");
  });
  const hasWater = contents.some((c) => {
    const chem = chemicals.get(c.chemicalId);
    return chem && (chem.name === "Water" || chem.formula === "H2O");
  });
  return !(hasOil && hasWater);
}

/**
 * Raoult's law approximation for vapor pressure of mixture.
 * P_total = Σ (x_i × P_i)
 */
export function calculateVaporPressure(
  contents: ContainerContent[],
  chemicals: Map<string, ChemicalData>,
  temperature: number
): number {
  const totalMoles = contents.reduce((sum, c) => sum + c.moles, 0);
  if (totalMoles === 0) return 0;
  let totalPressure = 0;
  for (const content of contents) {
    const chem = chemicals.get(content.chemicalId);
    if (!chem) continue;
    const moleFraction = content.moles / totalMoles;
    // Clausius-Clapeyron approximation for temperature dependence
    const tempFactor = Math.exp(
      (1 / 298.15 - 1 / (temperature + 273.15)) * 40000
    );
    totalPressure += moleFraction * chem.vaporPressure * tempFactor;
  }
  return totalPressure;
}

/**
 * Calculate boiling point of mixture (simplified).
 */
export function calculateBoilingPoint(
  contents: ContainerContent[],
  chemicals: Map<string, ChemicalData>
): number {
  if (contents.length === 0) return 100;
  const pure = chemicals.get(contents[0].chemicalId);
  if (!pure) return 100;
  if (contents.length === 1) return pure.boilingPoint;
  // return weighted average
  let weightedSum = 0;
  let totalMoles = 0;
  for (const content of contents) {
    const chem = chemicals.get(content.chemicalId);
    if (!chem) continue;
    weightedSum += content.moles * chem.boilingPoint;
    totalMoles += content.moles;
  }
  return totalMoles === 0 ? 100 : weightedSum / totalMoles;
}

/**
 * Mix hex colors weighted by moles (Beer-Lambert inspired).
 */
export function mixHexColors(
  colorData: { hex: string; moles: number }[]
): { hex: string; opacity: number } {
  if (colorData.length === 0) return { hex: "#88ccff", opacity: 0.3 };
  const totalMoles = colorData.reduce((sum, c) => sum + c.moles, 0);
  if (totalMoles === 0) return { hex: "#88ccff", opacity: 0.3 };

  let r = 0,
    g = 0,
    b = 0;
  let opacitySum = 0;
  for (const { hex, moles } of colorData) {
    const weight = moles / totalMoles;
    const rgb = hexToRgb(hex);
    r += rgb.r * weight;
    g += rgb.g * weight;
    b += rgb.b * weight;
    opacitySum += weight * 0.7;
  }
  return {
    hex: rgbToHex(Math.round(r), Math.round(g), Math.round(b)),
    opacity: Math.min(0.95, Math.max(0.2, opacitySum)),
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert moles to volume given density and molar mass.
 */
export function molesToVolume(
  moles: number,
  chemical: ChemicalData
): number {
  if (chemical.stateAtSTP === "gas") {
    // PV = nRT, at STP 1 mol = 22.4 L
    return moles * 22400; // mL
  }
  const mass = moles * chemical.molarMass; // grams
  return mass / chemical.density; // mL
}

/**
 * Convert volume to moles given density and molar mass (for liquids).
 */
export function volumeToMoles(
  volume: number,
  chemical: ChemicalData
): number {
  if (chemical.stateAtSTP === "gas") {
    return volume / 22400;
  }
  const mass = volume * chemical.density; // grams
  return mass / chemical.molarMass;
}

/**
 * Estimate pH of a mixture based on acid/base contents.
 * Strong acids (HCl, HNO3, H2SO4): fully dissociate.
 * Weak acids (acetic, carbonic): partial dissociation with Ka.
 * Strong bases (NaOH, KOH): fully dissociate.
 * Weak bases (ammonia): partial.
 * Neutral salts / water: pH 7.
 */
export function calculatePH(
  contents: ContainerContent[],
  chemicals: Map<string, ChemicalData>
): number {
  if (contents.length === 0) return 7.0;

  let hPlus = 0; // moles of H+ from strong acids
  let ohMinus = 0; // moles of OH- from strong bases
  let weakAcidH = 0; // approximate H+ from weak acids
  let weakBaseOH = 0; // approximate OH- from weak bases
  let totalVolumeL = 0;

  const strongAcids = ["hcl", "hno3", "h2so4", "hbr", "hi", "hclo4"];
  const strongBases = ["naoh", "koh", "lioh", "caoh2", "baoh2", "sroh2"];
  const weakAcids = ["ch3cooh", "h2co3", "h2so3", "h3po4", "hf", "hno2", "hcn"];
  const weakBases = ["nh3", "nh4oh"];

  for (const content of contents) {
    const chem = chemicals.get(content.chemicalId);
    if (!chem) continue;
    const formula = chem.formula.toLowerCase();
    const volL = content.volume / 1000;
    totalVolumeL += volL;

    if (strongAcids.includes(formula)) {
      // H2SO4 gives 2 H+
      const protons = formula === "h2so4" ? 2 : 1;
      hPlus += content.moles * protons;
    } else if (strongBases.includes(formula)) {
      const hydroxides = formula.includes("oh2") ? 2 : 1; // Ca(OH)2, Ba(OH)2
      ohMinus += content.moles * hydroxides;
    } else if (weakAcids.includes(formula)) {
      // Approximate Ka ~ 10^-4 to 10^-5 → [H+] ≈ sqrt(Ka * C)
      const Ka = formula === "ch3cooh" ? 1.8e-5 : 4.3e-7;
      const C = content.moles / Math.max(volL, 0.001);
      const hConc = Math.sqrt(Ka * C);
      weakAcidH += hConc * volL;
    } else if (weakBases.includes(formula)) {
      const Kb = 1.8e-5;
      const C = content.moles / Math.max(volL, 0.001);
      const ohConc = Math.sqrt(Kb * C);
      weakBaseOH += ohConc * volL;
    }
  }

  if (totalVolumeL <= 0) return 7.0;

  const netH = hPlus + weakAcidH - ohMinus - weakBaseOH;
  if (Math.abs(netH) < 1e-9) return 7.0;

  if (netH > 0) {
    const hConc = netH / totalVolumeL;
    return Math.max(0, -Math.log10(hConc));
  } else {
    const ohConc = -netH / totalVolumeL;
    const pOH = Math.max(0, -Math.log10(ohConc));
    return Math.min(14, 14 - pOH);
  }
}

/**
 * Map a pH value to a universal indicator color.
 * Red (pH 0) → Orange → Yellow → Green (pH 7) → Blue → Indigo → Violet (pH 14)
 */
export function phToColor(pH: number): string {
  // Clamp pH 0..14
  const p = Math.max(0, Math.min(14, pH));
  // Color stops
  const stops = [
    { p: 0, c: [220, 38, 38] },     // red
    { p: 2, c: [234, 88, 12] },     // orange
    { p: 4, c: [250, 204, 21] },    // yellow
    { p: 6, c: [132, 204, 22] },    // yellow-green
    { p: 7, c: [34, 197, 94] },     // green
    { p: 8, c: [20, 184, 166] },    // teal
    { p: 10, c: [59, 130, 246] },   // blue
    { p: 12, c: [99, 102, 241] },   // indigo
    { p: 14, c: [139, 92, 246] },   // violet
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (p >= stops[i].p && p <= stops[i + 1].p) {
      const t = (p - stops[i].p) / (stops[i + 1].p - stops[i].p);
      const r = Math.round(stops[i].c[0] + (stops[i + 1].c[0] - stops[i].c[0]) * t);
      const g = Math.round(stops[i].c[1] + (stops[i + 1].c[1] - stops[i].c[1]) * t);
      const b = Math.round(stops[i].c[2] + (stops[i + 1].c[2] - stops[i].c[2]) * t);
      return rgbToHex(r, g, b);
    }
  }
  return "#22c55e";
}

/**
 * Get a qualitative pH label.
 */
export function phLabel(pH: number): string {
  if (pH < 2) return "Strongly Acidic";
  if (pH < 5) return "Acidic";
  if (pH < 6.5) return "Weakly Acidic";
  if (pH < 7.5) return "Neutral";
  if (pH < 9) return "Weakly Basic";
  if (pH < 12) return "Basic";
  return "Strongly Basic";
}
