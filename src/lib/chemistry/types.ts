// Chemistry type definitions for The Molecular Sandbox

export type ChemicalCategory =
  | "reagent"
  | "acid"
  | "base"
  | "salt"
  | "organic"
  | "indicator"
  | "solvent"
  | "metal"
  | "gas"
  | "oxidizer";

export type StateAtSTP = "solid" | "liquid" | "gas";

export type GHSHazard =
  | "explosive"
  | "flammable"
  | "oxidizing"
  | "gas_under_pressure"
  | "corrosive"
  | "toxic"
  | "harmful"
  | "health_hazard"
  | "environmental"
  | "irritant";

export interface ChemicalData {
  id: string;
  name: string;
  formula: string;
  molarMass: number; // g/mol
  density: number; // g/mL
  specificHeatCapacity: number; // J/(g·K)
  surfaceTension: number; // N/m
  vaporPressure: number; // kPa at 25°C
  boilingPoint: number; // °C
  meltingPoint: number; // °C
  hexColor: string;
  stateAtSTP: StateAtSTP;
  hazards: GHSHazard[];
  solubility: Record<string, number>; // { chemicalId: g/100mL }
  refractiveIndex: number;
  viscosity: number; // mPa·s
  category: ChemicalCategory;
  description: string;
}

export interface ContainerContent {
  chemicalId: string;
  volume: number; // mL
  moles: number;
}

export type ContainerType =
  | "beaker"
  | "flask"
  | "test_tube"
  | "erlenmeyer"
  | "graduated_cylinder";

export interface ContainerState {
  id: string;
  type: ContainerType;
  position: [number, number, number];
  rotation: [number, number, number];
  capacity: number; // mL
  contents: ContainerContent[];
  temperature: number; // °C
  pressure: number; // kPa
  isHeating: boolean;
  isBroken: boolean;
  // VFX state tracking (transient — derived from reactions)
  precipitate?: {
    chemicalId: string;
    moles: number;
    color: string;
  }[] | null;
  gasEmitting?: {
    chemicalId: string;
    intensity: number; // 0..1 decay
    color: string;
  } | null;
  lastReactionAt?: number;
}

export type ReactionType =
  | "synthesis"
  | "decomposition"
  | "single_replacement"
  | "double_replacement"
  | "combustion"
  | "acid_base"
  | "redox"
  | "precipitation";

export interface ReactionParticipant {
  chemicalId: string;
  coefficient: number;
  isLimiting?: boolean;
}

export interface ReactionData {
  id: string;
  name: string;
  equation: string;
  deltaH: number; // kJ/mol
  reactionType: ReactionType;
  isReversible: boolean;
  conditions: {
    catalyst?: string;
    temperature?: number;
    pressure?: number;
  };
  description: string;
  reactants: ReactionParticipant[];
  products: ReactionParticipant[];
}

export interface ReactionResult {
  reaction: ReactionData;
  molesReacted: number;
  limitingReagent: string;
  temperatureChange: number; // °C
  productsProduced: { chemicalId: string; moles: number; volume?: number }[];
  reactantsConsumed: { chemicalId: string; moles: number }[];
  heatReleased: number; // kJ
  isComplete: boolean;
  gasEvolved: boolean;
  gasChemicalId?: string;
  precipitateFormed: boolean;
  precipitateChemicalId?: string;
}

export interface MixtureState {
  contents: ContainerContent[];
  temperature: number;
  pressure: number;
  volume: number;
  pH?: number;
  isHomogeneous: boolean;
  hasPrecipitate: boolean;
  precipitateChemicalId?: string;
  gasEvolved: boolean;
  gasChemicalId?: string;
  colorHex: string;
  opacity: number;
  density: number;
  totalMass: number;
  avgSpecificHeat: number;
}

export interface SafetyAlert {
  type: "thermal" | "toxic" | "corrosive" | "explosion" | "gas";
  message: string;
  severity: "warning" | "danger";
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  text: string;
  reaction?: string;
  equation?: string;
  temperatureChange?: number;
}
