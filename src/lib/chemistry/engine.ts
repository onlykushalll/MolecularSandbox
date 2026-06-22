// Stoichiometry Engine for The Molecular Sandbox
import type {
  ChemicalData,
  ContainerContent,
  ReactionData,
  ReactionResult,
  MixtureState,
  ReactionParticipant,
} from "./types";
import {
  calculateTotalMass,
  calculateAverageSpecificHeat,
  calculateDensity,
  isHomogeneous,
  calculateVaporPressure,
  mixHexColors,
  molesToVolume,
} from "./mixture";

export class StoichiometryEngine {
  private chemicals: Map<string, ChemicalData>;
  private reactions: ReactionData[];

  constructor(chemicals: ChemicalData[], reactions: ReactionData[]) {
    this.chemicals = new Map(chemicals.map((c) => [c.id, c]));
    this.reactions = reactions;
  }

  /**
   * Find the first applicable reaction for the given container contents.
   */
  findReaction(contents: ContainerContent[]): ReactionData | null {
    if (contents.length === 0) return null;
    const presentChemicalIds = new Set(
      contents.filter((c) => c.moles > 0).map((c) => c.chemicalId)
    );
    for (const reaction of this.reactions) {
      const allReactantsPresent = reaction.reactants.every((r) =>
        presentChemicalIds.has(r.chemicalId)
      );
      if (allReactantsPresent && reaction.reactants.length > 0) {
        return reaction;
      }
    }
    return null;
  }

  /**
   * Calculate the result of a reaction.
   */
  calculateReaction(
    reaction: ReactionData,
    contents: ContainerContent[],
    _containerVolume: number
  ): ReactionResult {
    const limiting = this.getLimitingReagent(reaction, contents);
    const limitingChem = this.chemicals.get(limiting.chemicalId);
    const molesReacted = limiting.molesAvailable / limiting.coefficientPerMole;

    const productsProduced: ReactionResult["productsProduced"] = [];
    const reactantsConsumed: ReactionResult["reactantsConsumed"] = [];

    for (const product of reaction.products) {
      const chem = this.chemicals.get(product.chemicalId);
      const moles = molesReacted * product.coefficient;
      let volume: number | undefined;
      if (chem) {
        volume = molesToVolume(moles, chem);
      }
      productsProduced.push({ chemicalId: product.chemicalId, moles, volume });
    }

    for (const reactant of reaction.reactants) {
      const moles = molesReacted * reactant.coefficient;
      reactantsConsumed.push({ chemicalId: reactant.chemicalId, moles });
    }

    const totalMass = calculateTotalMass(contents, this.chemicals);
    const avgSpecificHeat = calculateAverageSpecificHeat(contents, this.chemicals);

    // ΔT = -ΔH × n / (m × c)
    // ΔH in kJ/mol → convert to J/mol by × 1000
    const heatReleased = reaction.deltaH * molesReacted; // kJ
    const temperatureChange =
      totalMass > 0 && avgSpecificHeat > 0
        ? (-reaction.deltaH * 1000 * molesReacted) /
          (totalMass * avgSpecificHeat)
        : 0;

    // check for gas product
    let gasEvolved = false;
    let gasChemicalId: string | undefined;
    for (const product of productsProduced) {
      const chem = this.chemicals.get(product.chemicalId);
      if (chem && chem.stateAtSTP === "gas") {
        gasEvolved = true;
        gasChemicalId = product.chemicalId;
      }
    }

    // check for precipitate (solid product from liquid reactants)
    let precipitateFormed = false;
    let precipitateChemicalId: string | undefined;
    for (const product of productsProduced) {
      const chem = this.chemicals.get(product.chemicalId);
      if (chem && chem.stateAtSTP === "solid") {
        const reactantsAllLiquid = reaction.reactants.every((r) => {
          const rc = this.chemicals.get(r.chemicalId);
          return rc && (rc.stateAtSTP === "liquid" || rc.stateAtSTP === "solid");
        });
        if (reactantsAllLiquid) {
          precipitateFormed = true;
          precipitateChemicalId = product.chemicalId;
        }
      }
    }

    return {
      reaction,
      molesReacted,
      limitingReagent: limiting.chemicalId,
      temperatureChange,
      productsProduced,
      reactantsConsumed,
      heatReleased,
      isComplete: limiting.molesAvailable <= 0.001,
      gasEvolved,
      gasChemicalId,
      precipitateFormed,
      precipitateChemicalId,
    };
  }

  /**
   * Get limiting reagent and how many moles can react.
   */
  getLimitingReagent(
    reaction: ReactionData,
    contents: ContainerContent[]
  ): {
    chemicalId: string;
    molesAvailable: number;
    coefficientPerMole: number;
    molesNeeded: number;
  } {
    let limiting = "";
    let minMoles = Infinity;
    let limitingCoeff = 1;

    for (const reactant of reaction.reactants) {
      const content = contents.find((c) => c.chemicalId === reactant.chemicalId);
      const available = content ? content.moles : 0;
      const perMole = available / reactant.coefficient;
      if (perMole < minMoles) {
        minMoles = perMole;
        limiting = reactant.chemicalId;
        limitingCoeff = reactant.coefficient;
      }
    }

    return {
      chemicalId: limiting,
      molesAvailable: minMoles === Infinity ? 0 : minMoles,
      coefficientPerMole: limitingCoeff,
      molesNeeded: minMoles * limitingCoeff,
    };
  }

  /**
   * Calculate full mixture state including color, pH, density.
   */
  calculateMixture(
    contents: ContainerContent[],
    temperature: number,
    volume: number
  ): MixtureState {
    const colorData = contents.map((c) => {
      const chem = this.chemicals.get(c.chemicalId);
      return { hex: chem?.hexColor || "#88ccff", moles: c.moles };
    });
    const { hex, opacity } = mixHexColors(colorData);
    const totalMass = calculateTotalMass(contents, this.chemicals);
    const avgSpecificHeat = calculateAverageSpecificHeat(contents, this.chemicals);
    const density = calculateDensity(contents, this.chemicals);
    const pH = this.estimatePH(contents);
    const pressure = calculateVaporPressure(contents, this.chemicals, temperature);

    return {
      contents,
      temperature,
      pressure,
      volume,
      pH,
      isHomogeneous: isHomogeneous(contents, this.chemicals),
      hasPrecipitate: false,
      gasEvolved: false,
      colorHex: hex,
      opacity,
      density,
      totalMass,
      avgSpecificHeat,
    };
  }

  /**
   * Estimate pH for acid/base solutions.
   */
  estimatePH(contents: ContainerContent[]): number {
    let acidStrength = 0;
    let baseStrength = 0;
    const totalVolume = contents.reduce((s, c) => s + c.volume, 0);
    if (totalVolume === 0) return 7;

    for (const content of contents) {
      const chem = this.chemicals.get(content.chemicalId);
      if (!chem) continue;
      const concentration = content.moles / (totalVolume / 1000); // mol/L

      if (chem.category === "acid") {
        // Strong acids: HCl, H2SO4, HNO3 → full dissociation
        const strongAcids = ["HCl", "H2SO4", "HNO3"];
        const isStrong = strongAcids.some((f) => chem.formula.includes(f));
        const Ka = isStrong ? 1000 : 0.000018; // acetic acid Ka ~ 1.8e-5
        const hPlus = isStrong
          ? concentration
          : (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * concentration)) / 2;
        acidStrength += hPlus;
      } else if (chem.category === "base") {
        const strongBases = ["NaOH", "KOH"];
        const isStrong = strongBases.some((f) => chem.formula.includes(f));
        const Kb = isStrong ? 1000 : 0.000018;
        const ohMinus = isStrong
          ? concentration
          : (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * concentration)) / 2;
        baseStrength += ohMinus;
      }
    }

    if (acidStrength > baseStrength) {
      const net = acidStrength - baseStrength;
      return Math.max(0, -Math.log10(net));
    } else if (baseStrength > acidStrength) {
      const net = baseStrength - acidStrength;
      return Math.min(14, 14 + Math.log10(net));
    }
    return 7;
  }

  /**
   * Check if a reaction should occur.
   */
  shouldReact(contents: ContainerContent[]): boolean {
    return this.findReaction(contents) !== null;
  }

  /**
   * Get the chemical by ID.
   */
  getChemical(id: string): ChemicalData | undefined {
    return this.chemicals.get(id);
  }

  /**
   * Get all chemicals.
   */
  getAllChemicals(): ChemicalData[] {
    return Array.from(this.chemicals.values());
  }
}
