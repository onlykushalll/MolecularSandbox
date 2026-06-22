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
