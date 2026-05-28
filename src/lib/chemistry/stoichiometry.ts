/**
 * STOICHIOMETRIC CHEMISTRY ENGINE
 * The Brain of The Molecular Sandbox
 * 
 * Real-world physics calculations:
 * - Molar mass → moles conversion (n = m/M)
 * - Limiting reagent identification
 * - Theoretical yield calculation
 * - Enthalpy-based temperature change (ΔQ = mcΔT)
 * - Ideal Gas Law (PV = nRT)
 * - Phase state transitions
 * - Activation energy checks
 * - Safety violation detection
 */

import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════
// CONSTANTS (SI Units)
// ═══════════════════════════════════════════════════════════
const R_GAS = 8.314;           // J/(mol·K) - Universal gas constant
const G_ACCEL = 9.80665;       // m/s² - Gravitational acceleration
const ATM = 101325;            // Pa - Standard atmospheric pressure
const DEW_POINT_C = 20;        // °C - Lab ambient dew point
const LAB_VOLUME_M3 = 60;      // m³ - Approximate lab room volume
const TOXICITY_THRESHOLD = 0.05; // Toxicity score threshold for evacuation
const BURN_THRESHOLD_C = 50;   // °C - Temperature above which burns occur
const GLASS_FAILURE_C = 560;   // °C - Borosilicate failure point

// Substance cache to avoid repeated DB queries
let substanceCache: Map<string, SubstanceData> | null = null;
let reactionCache: ReactionData[] | null = null;

interface SubstanceData {
  id: string;
  iupacName: string;
  formula: string;
  molarMass: number;
  density: number;
  boilingPoint: number;
  meltingPoint: number;
  specificHeatCapacity: number;
  stateAt25C: string;
  hexColor: string;
  opacity: number;
  ghsHazards: string;
  riskRating: number;
  surfaceTension: number;
  vaporPressure: number;
  category: string;
}

interface ReactionData {
  id: string;
  reactionType: string;
  balancedEquation: string;
  reactantAId: string;
  reactantBId: string;
  catalystId: string;
  productIds: string;
  deltaH: number;
  rateOfReaction: string;
  gasEvolution: string;
  requiredPPE: string;
  failStateNoGloves: string;
  failStateNoGoggles: string;
  failStateNoFumeHood: string;
}

export interface ReactionInput {
  contents: Record<string, number>; // substanceId → mass in grams
  volumeML: number;
  temperatureK: number;
  hasCatalyst: boolean;
  containerClosed: boolean;
  ppe: {
    gloves: boolean;
    goggles: boolean;
    labCoat: boolean;
    fumeHood: boolean;
  };
}

export interface ReactionResult {
  reactionOccurred: boolean;
  reactionId: string | null;
  reactionType: string | null;
  balancedEquation: string | null;
  reactantsConsumed: Record<string, number>; // substanceId → mass consumed (g)
  productsFormed: Record<string, number>;     // substanceId → mass formed (g)
  newContents: Record<string, number>;        // substanceId → remaining mass (g)
  limitingReagent: string | null;
  limitingMoles: number;
  deltaH: number;               // kJ total (not per mol)
  temperatureChangeK: number;
  newTemperatureK: number;
  newVolumeML: number;
  gasEvolved: string;           // None, Mild, Vigorous
  gasSubstanceIds: string[];
  pressureKPa: number;          // Only relevant if containerClosed
  explosionRisk: boolean;
  safetyWarnings: string[];
  safetyViolations: string[];
  visualEffects: string[];      // What the UI should render
  precipitationFormed: boolean;
  precipitateColor: string | null;
  colorChange: boolean;
  newColor: string | null;
}

// ═══════════════════════════════════════════════════════════
// INITIALIZATION - Load data into memory
// ═══════════════════════════════════════════════════════════
async function ensureCacheLoaded(): Promise<void> {
  if (substanceCache && reactionCache) return;

  const substances = await db.substance.findMany();
  substanceCache = new Map();
  for (const s of substances) {
    substanceCache.set(s.id, {
      id: s.id,
      iupacName: s.iupacName,
      formula: s.formula,
      molarMass: s.molarMass,
      density: s.density,
      boilingPoint: s.boilingPoint,
      meltingPoint: s.meltingPoint,
      specificHeatCapacity: s.specificHeatCapacity,
      stateAt25C: s.stateAt25C,
      hexColor: s.hexColor,
      opacity: s.opacity,
      ghsHazards: s.ghsHazards,
      riskRating: s.riskRating,
      surfaceTension: s.surfaceTension,
      vaporPressure: s.vaporPressure,
      category: s.category,
    });
  }

  reactionCache = await db.reaction.findMany();
}

function getSubstance(id: string): SubstanceData | undefined {
  return substanceCache?.get(id);
}

// ═══════════════════════════════════════════════════════════
// CORE STOICHIOMETRY SOLVER
// ═══════════════════════════════════════════════════════════
export async function solveReaction(input: ReactionInput): Promise<ReactionResult> {
  await ensureCacheLoaded();

  const { contents, volumeML, temperatureK, hasCatalyst, containerClosed, ppe } = input;

  const emptyResult: ReactionResult = {
    reactionOccurred: false,
    reactionId: null,
    reactionType: null,
    balancedEquation: null,
    reactantsConsumed: {},
    productsFormed: {},
    newContents: { ...contents },
    limitingReagent: null,
    limitingMoles: 0,
    deltaH: 0,
    temperatureChangeK: 0,
    newTemperatureK: temperatureK,
    newVolumeML: volumeML,
    gasEvolved: 'None',
    gasSubstanceIds: [],
    pressureKPa: ATM / 1000,
    explosionRisk: false,
    safetyWarnings: [],
    safetyViolations: [],
    visualEffects: [],
    precipitationFormed: false,
    precipitateColor: null,
    colorChange: false,
    newColor: null,
  };

  const contentIds = Object.keys(contents).filter(id => (contents[id] || 0) > 0);
  if (contentIds.length < 1) return emptyResult;

  // ═══════════════════════════════════════════════════════════
  // STEP 1: Find matching reaction(s)
  // ═══════════════════════════════════════════════════════════
  const matchedReaction = findMatchingReaction(contentIds, hasCatalyst);
  if (!matchedReaction) return emptyResult;

  // ═══════════════════════════════════════════════════════════
  // STEP 2: Calculate moles of each reactant
  // ═══════════════════════════════════════════════════════════
  const reactantIds = [matchedReaction.reactantAId];
  if (matchedReaction.reactantBId) reactantIds.push(matchedReaction.reactantBId);

  const reactantMoles: Record<string, number> = {};
  for (const id of reactantIds) {
    const substance = getSubstance(id);
    if (!substance) return emptyResult;
    const mass = contents[id] || 0;
    if (mass <= 0) return emptyResult;
    reactantMoles[id] = mass / substance.molarMass;
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 3: Identify limiting reagent
  // ═══════════════════════════════════════════════════════════
  let limitingReagentId: string | null = null;
  let limitingMoles = Infinity;

  for (const [id, moles] of Object.entries(reactantMoles)) {
    if (moles < limitingMoles) {
      limitingMoles = moles;
      limitingReagentId = id;
    }
  }

  if (!limitingReagentId || limitingMoles <= 0) return emptyResult;

  // ═══════════════════════════════════════════════════════════
  // STEP 4: Activation energy check
  // (Simplified: some reactions need higher temperature)
  // ═══════════════════════════════════════════════════════════
  const minTempK = getActivationTempK(matchedReaction);
  if (temperatureK < minTempK) {
    return {
      ...emptyResult,
      safetyWarnings: [`Reaction requires heating to ${Math.round(minTempK - 273.15)}°C to proceed.`],
      visualEffects: ['no_reaction'],
    };
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 5: Execute reaction - calculate mass transfer
  // ═══════════════════════════════════════════════════════════
  const reactantsConsumed: Record<string, number> = {};
  const newContents = { ...contents };

  for (const id of reactantIds) {
    const substance = getSubstance(id);
    if (!substance) continue;
    // Consume limiting reagent fully, other reagents proportionally
    const stoichRatio = reactantMoles[id] / limitingMoles;
    const molesConsumed = Math.min(reactantMoles[id], limitingMoles * (reactantMoles[id] / reactantMoles[limitingReagentId]));
    const massConsumed = molesConsumed * substance.molarMass;
    reactantsConsumed[id] = massConsumed;
    newContents[id] = Math.max(0, (newContents[id] || 0) - massConsumed);
    if (newContents[id] < 0.001) delete newContents[id]; // Remove trace amounts
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 6: Calculate product yields
  // ═══════════════════════════════════════════════════════════
  const productIds = matchedReaction.productIds.split(',').map(s => s.trim()).filter(Boolean);
  const productsFormed: Record<string, number> = {};
  const gasSubstanceIds: string[] = [];
  let totalProductMass = 0;

  for (const pid of productIds) {
    const substance = getSubstance(pid);
    if (!substance) continue;
    // Distribute limiting moles among products (simplified 1:1 stoich per product)
    const productMoles = limitingMoles;
    const productMass = productMoles * substance.molarMass;
    productsFormed[pid] = productMass;
    newContents[pid] = (newContents[pid] || 0) + productMass;
    totalProductMass += productMass;

    // Check if product is a gas at current temperature
    if (substance.stateAt25C === 'Gas' || temperatureK > substance.boilingPoint + 273.15) {
      gasSubstanceIds.push(pid);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 7: Thermodynamics - temperature change
  // ΔT = (-ΔH × n) / (m_total × c_avg)
  // Important: Use ALL mass present (original + products) for heat capacity
  // ═══════════════════════════════════════════════════════════
  const totalMassGrams = Object.values(contents).reduce((sum, m) => sum + m, 0);
  const avgSpecificHeat = calculateAvgSpecificHeat(contents);
  const totalDeltaH = matchedReaction.deltaH * limitingMoles; // kJ
  // q = ΔH × n (kJ), convert to J: q × 1000
  // ΔT = q / (m × c) where m is in grams, c is in J/(g·K)
  // Cap temperature change to realistic bounds (max ±200K per reaction)
  const rawTempChangeK = (-totalDeltaH * 1000) / (totalMassGrams * avgSpecificHeat);
  const tempChangeK = Math.sign(rawTempChangeK) * Math.min(Math.abs(rawTempChangeK), 200);
  const newTemperatureK = temperatureK + tempChangeK;

  // ═══════════════════════════════════════════════════════════
  // STEP 8: Phase state changes
  // ═══════════════════════════════════════════════════════════
  const visualEffects: string[] = [];
  let precipitationFormed = false;
  let precipitateColor: string | null = null;
  let colorChange = false;
  let newColor: string | null = null;

  for (const [pid, mass] of Object.entries(newContents)) {
    if (mass <= 0) continue;
    const substance = getSubstance(pid);
    if (!substance) continue;

    const boilingK = substance.boilingPoint + 273.15;
    const meltingK = substance.meltingPoint + 273.15;

    // If temperature exceeds boiling point, substance becomes gas
    if (newTemperatureK > boilingK && substance.stateAt25C !== 'Gas') {
      if (!gasSubstanceIds.includes(pid)) gasSubstanceIds.push(pid);
      visualEffects.push('boiling');
      visualEffects.push(`vapor_${pid}`);
    }
    
    // Precipitation: if product is solid at current temp and was formed in liquid
    if (substance.stateAt25C === 'Solid' && productsFormed[pid] && pid !== matchedReaction.reactantAId && pid !== matchedReaction.reactantBId) {
      precipitationFormed = true;
      precipitateColor = substance.hexColor;
      visualEffects.push('precipitation');
      visualEffects.push(`precipitate_${substance.hexColor}`);
    }
  }

  // Determine dominant color of mixture
  const liquidContents = Object.entries(newContents).filter(([id]) => {
    const s = getSubstance(id);
    return s && (s.stateAt25C === 'Liquid' || newTemperatureK > (s.meltingPoint + 273.15));
  });

  if (liquidContents.length > 0) {
    let maxMass = 0;
    let dominantId = liquidContents[0][0];
    for (const [id, mass] of liquidContents) {
      if (mass > maxMass) {
        maxMass = mass;
        dominantId = id;
      }
    }
    const dominant = getSubstance(dominantId);
    if (dominant && dominant.hexColor !== '#FFFFFF' && dominant.hexColor !== '#F0F0F0') {
      colorChange = true;
      newColor = dominant.hexColor;
      visualEffects.push('color_change');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 9: Gas law calculations (PV = nRT)
  // ═══════════════════════════════════════════════════════════
  let pressureKPa = ATM / 1000;
  let explosionRisk = false;

  if (gasSubstanceIds.length > 0) {
    let totalGasMoles = 0;
    for (const gid of gasSubstanceIds) {
      const substance = getSubstance(gid);
      if (!substance) continue;
      const mass = newContents[gid] || 0;
      totalGasMoles += mass / substance.molarMass;
    }

    if (containerClosed && totalGasMoles > 0) {
      const volumeM3 = (volumeML / 1000000);
      pressureKPa = (totalGasMoles * R_GAS * newTemperatureK) / (volumeM3) / 1000;
      
      if (pressureKPa > GLASS_FAILURE_C) {
        explosionRisk = true;
        visualEffects.push('explosion');
        visualEffects.push('glass_shatter');
      }
    }

    // Gas visual effects
    if (matchedReaction.gasEvolution === 'Vigorous') {
      visualEffects.push('vigorous_gas');
      visualEffects.push('bubbling');
    } else if (matchedReaction.gasEvolution === 'Mild') {
      visualEffects.push('mild_gas');
      visualEffects.push('gentle_bubbling');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 10: Safety checks
  // ═══════════════════════════════════════════════════════════
  const safetyWarnings: string[] = [];
  const safetyViolations: string[] = [];

  // PPE requirements
  if (matchedReaction.requiredPPE) {
    const required = matchedReaction.requiredPPE.toLowerCase();
    if (required.includes('gloves') && !ppe.gloves) {
      safetyViolations.push(matchedReaction.failStateNoGloves || 'Chemical contact hazard - gloves required');
    }
    if (required.includes('goggles') && !ppe.goggles) {
      safetyViolations.push(matchedReaction.failStateNoGoggles || 'Eye protection required');
    }
    if (required.includes('lab coat') && !ppe.labCoat) {
      safetyViolations.push('Lab coat required for this reaction');
    }
  }

  // Fume hood requirement for gas-producing reactions
  if (gasSubstanceIds.length > 0 && !ppe.fumeHood && matchedReaction.gasEvolution !== 'None') {
    safetyViolations.push(matchedReaction.failStateNoFumeHood || 'Toxic gas - fume hood required');

    // Calculate toxicity score
    let toxicityScore = 0;
    for (const gid of gasSubstanceIds) {
      const substance = getSubstance(gid);
      if (!substance) continue;
      const mass = newContents[gid] || 0;
      const gasVolume = (mass / substance.molarMass) * R_GAS * newTemperatureK / ATM * 1000; // mL
      toxicityScore += (substance.riskRating * gasVolume) / (LAB_VOLUME_M3 * 1000000);
    }
    if (toxicityScore > TOXICITY_THRESHOLD) {
      safetyViolations.push('⚠️ TOXIC ATMOSPHERE - LAB EVACUATION REQUIRED');
      visualEffects.push('evacuation');
      visualEffects.push('toxic_gas_overlay');
    }
  }

  // Temperature warnings
  if (newTemperatureK > BURN_THRESHOLD_C + 273.15) {
    safetyWarnings.push(`⚠️ High temperature: ${Math.round(newTemperatureK - 273.15)}°C - Use tongs to handle`);
  }

  // GHS hazard warnings
  for (const id of contentIds) {
    const substance = getSubstance(id);
    if (substance && substance.ghsHazards) {
      const hazards = substance.ghsHazards.split('-');
      for (const h of hazards) {
        if (h.startsWith('GHS05')) safetyWarnings.push(`⚠️ ${substance.iupacName} is corrosive`);
        if (h.startsWith('GHS06')) safetyWarnings.push(`☠️ ${substance.iupacName} is toxic`);
        if (h.startsWith('GHS02')) safetyWarnings.push(`🔥 ${substance.iupacName} is flammable`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 11: Calculate new volume
  // ═══════════════════════════════════════════════════════════
  let newVolumeML = volumeML;
  for (const [pid, mass] of Object.entries(productsFormed)) {
    const substance = getSubstance(pid);
    if (substance && substance.stateAt25C === 'Solid') continue; // Solids don't add to liquid volume
    if (substance && substance.stateAt25C === 'Gas') continue;   // Gases escape (unless closed)
    if (substance) {
      newVolumeML += mass / (substance.density || 1) / 1000; // density in g/cm³ = g/mL
    }
  }
  for (const [rid, mass] of Object.entries(reactantsConsumed)) {
    const substance = getSubstance(rid);
    if (substance && substance.stateAt25C === 'Liquid') {
      newVolumeML -= mass / (substance.density || 1) / 1000;
    }
  }
  newVolumeML = Math.max(0, newVolumeML);

  // ═══════════════════════════════════════════════════════════
  // BUILD RESULT
  // ═══════════════════════════════════════════════════════════
  return {
    reactionOccurred: true,
    reactionId: matchedReaction.id,
    reactionType: matchedReaction.reactionType,
    balancedEquation: matchedReaction.balancedEquation,
    reactantsConsumed,
    productsFormed,
    newContents,
    limitingReagent: limitingReagentId,
    limitingMoles,
    deltaH: totalDeltaH,
    temperatureChangeK: tempChangeK,
    newTemperatureK,
    newVolumeML,
    gasEvolved: matchedReaction.gasEvolution,
    gasSubstanceIds,
    pressureKPa: Math.round(pressureKPa * 100) / 100,
    explosionRisk,
    safetyWarnings,
    safetyViolations,
    visualEffects,
    precipitationFormed,
    precipitateColor,
    colorChange,
    newColor,
  };
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function findMatchingReaction(contentIds: string[], hasCatalyst: boolean): ReactionData | null {
  if (!reactionCache) return null;

  for (const reaction of reactionCache) {
    const requiredReactants = [reaction.reactantAId];
    if (reaction.reactantBId) requiredReactants.push(reaction.reactantBId);

    // Check if all required reactants are present
    const allPresent = requiredReactants.every(r => contentIds.includes(r));
    if (!allPresent) continue;

    // Check catalyst requirement
    if (reaction.catalystId && reaction.catalystId !== '') {
      if (!hasCatalyst && !contentIds.includes(reaction.catalystId)) continue;
    }

    return reaction;
  }

  return null;
}

function getActivationTempK(reaction: ReactionData): number {
  // Estimate activation temperature from reaction type and rate
  switch (reaction.rateOfReaction) {
    case 'Instant': return 273.15;   // Works at 0°C
    case 'Fast': return 273.15 + 20; // Room temp
    case 'Moderate': return 273.15 + 30; // Slight warmth
    case 'Slow': return 273.15 + 50; // Needs heating
    case 'Vigorous': return 273.15 + 10; // Usually room temp but energetic
    default: return 273.15;
  }
}

function calculateAvgSpecificHeat(contents: Record<string, number>): number {
  let totalMass = 0;
  let weightedSum = 0;

  for (const [id, mass] of Object.entries(contents)) {
    const substance = getSubstance(id);
    if (!substance) continue;
    totalMass += mass;
    weightedSum += mass * substance.specificHeatCapacity;
  }

  return totalMass > 0 ? weightedSum / totalMass : 4.18; // Default to water
}

// ═══════════════════════════════════════════════════════════
// UTILITY: Calculate pH from mixture
// ═══════════════════════════════════════════════════════════
export function calculatePH(contents: Record<string, number>, volumeML: number): number {
  const STRONG_ACIDS = ['C003', 'C004', 'C005']; // HCl, H2SO4, HNO3
  const STRONG_BASES = ['C007']; // NaOH
  const WEAK_ACIDS = ['C006']; // Acetic acid
  const WEAK_BASES = ['C008']; // Ammonia

  let hPlusMoles = 0;
  let ohMinusMoles = 0;

  for (const [id, mass] of Object.entries(contents)) {
    const substance = getSubstance(id);
    if (!substance) continue;
    const moles = mass / substance.molarMass;

    if (STRONG_ACIDS.includes(id)) {
      hPlusMoles += moles;
    } else if (STRONG_BASES.includes(id)) {
      ohMinusMoles += moles;
    } else if (WEAK_ACIDS.includes(id)) {
      hPlusMoles += moles * 0.01; // ~1% dissociation for weak acids
    } else if (WEAK_BASES.includes(id)) {
      ohMinusMoles += moles * 0.01;
    }
  }

  const volumeL = volumeML / 1000 || 0.1;
  
  if (hPlusMoles > ohMinusMoles) {
    const netH = (hPlusMoles - ohMinusMoles) / volumeL;
    return -Math.log10(Math.max(netH, 1e-14));
  } else if (ohMinusMoles > hPlusMoles) {
    const netOH = (ohMinusMoles - hPlusMoles) / volumeL;
    const pOH = -Math.log10(Math.max(netOH, 1e-14));
    return 14 - pOH;
  }

  return 7.0; // Neutral
}

// ═══════════════════════════════════════════════════════════
// UTILITY: Calculate Torricelli pouring
// v = sqrt(2 * g * h), dV = v * A * dt
// ═══════════════════════════════════════════════════════════
export function calculatePouringRate(
  liquidHeightM: number,
  containerRadiusM: number,
  deltaTime: number
): number {
  if (liquidHeightM <= 0) return 0;
  const velocity = Math.sqrt(2 * G_ACCEL * liquidHeightM); // m/s
  const crossSection = Math.PI * containerRadiusM * containerRadiusM; // m²
  const dV = velocity * crossSection * deltaTime; // m³
  return dV * 1000000; // Convert to mL
}

// ═══════════════════════════════════════════════════════════
// UTILITY: Get liquid height from volume and container shape
// ═══════════════════════════════════════════════════════════
export function calculateLiquidHeight(
  volumeML: number,
  containerRadiusM: number
): number {
  const volumeM3 = volumeML / 1000000;
  const crossSection = Math.PI * containerRadiusM * containerRadiusM;
  return volumeM3 / crossSection; // meters
}
