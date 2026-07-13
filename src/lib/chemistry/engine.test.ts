import { describe, it, expect } from "vitest";
import { StoichiometryEngine } from "./engine";
import type { ChemicalData, ReactionData, ContainerContent } from "./types";

// --- Test fixtures ---

const HCl: ChemicalData = {
  id: "hcl", name: "Hydrochloric Acid", formula: "HCl",
  molarMass: 36.46, density: 1.18, specificHeatCapacity: 3.14,
  surfaceTension: 0.068, vaporPressure: 30, boilingPoint: 110,
  meltingPoint: -30, hexColor: "#ccffcc", stateAtSTP: "liquid",
  hazards: ["corrosive"], solubility: {}, refractiveIndex: 1.36,
  viscosity: 1.2, category: "acid", description: "",
};

const NaOH: ChemicalData = {
  id: "naoh", name: "Sodium Hydroxide", formula: "NaOH",
  molarMass: 40.0, density: 2.13, specificHeatCapacity: 1.49,
  surfaceTension: 0.073, vaporPressure: 0, boilingPoint: 1388,
  meltingPoint: 318, hexColor: "#ffffff", stateAtSTP: "solid",
  hazards: ["corrosive"], solubility: {}, refractiveIndex: 1.47,
  viscosity: 1.0, category: "base", description: "",
};

const NaCl: ChemicalData = {
  id: "nacl", name: "Sodium Chloride", formula: "NaCl",
  molarMass: 58.44, density: 2.16, specificHeatCapacity: 0.88,
  surfaceTension: 0, vaporPressure: 0, boilingPoint: 1465,
  meltingPoint: 801, hexColor: "#ffffff", stateAtSTP: "solid",
  hazards: [], solubility: {}, refractiveIndex: 1.54,
  viscosity: 0, category: "salt", description: "",
};

const H2O: ChemicalData = {
  id: "h2o", name: "Water", formula: "H2O",
  molarMass: 18.015, density: 1.0, specificHeatCapacity: 4.18,
  surfaceTension: 0.072, vaporPressure: 3.17, boilingPoint: 100,
  meltingPoint: 0, hexColor: "#88ccff", stateAtSTP: "liquid",
  hazards: [], solubility: {}, refractiveIndex: 1.33,
  viscosity: 1.0, category: "solvent", description: "",
};

const CO2: ChemicalData = {
  id: "co2", name: "Carbon Dioxide", formula: "CO2",
  molarMass: 44.01, density: 0.001977, specificHeatCapacity: 0.84,
  surfaceTension: 0, vaporPressure: 5730, boilingPoint: -78.5,
  meltingPoint: -56.6, hexColor: "#cccccc", stateAtSTP: "gas",
  hazards: [], solubility: {}, refractiveIndex: 1.0,
  viscosity: 0.015, category: "gas", description: "",
};

const neutralization: ReactionData = {
  id: "rxn1", name: "Neutralization",
  equation: "HCl + NaOH → NaCl + H2O",
  deltaH: -57.1, reactionType: "acid_base", isReversible: false,
  conditions: {}, description: "Strong acid-base neutralization",
  reactants: [
    { chemicalId: "hcl", coefficient: 1 },
    { chemicalId: "naoh", coefficient: 1 },
  ],
  products: [
    { chemicalId: "nacl", coefficient: 1 },
    { chemicalId: "h2o", coefficient: 1 },
  ],
};

const allChemicals = [HCl, NaOH, NaCl, H2O, CO2];

function makeEngine(reactions: ReactionData[] = [neutralization]) {
  return new StoichiometryEngine(allChemicals, reactions);
}

// --- Tests ---

describe("StoichiometryEngine", () => {
  describe("findReaction", () => {
    it("finds reaction when all reactants present", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 10, moles: 0.1 },
        { chemicalId: "naoh", volume: 5, moles: 0.05 },
      ];
      const rxn = engine.findReaction(contents);
      expect(rxn).not.toBeNull();
      expect(rxn!.id).toBe("rxn1");
    });

    it("returns null when only one reactant present", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 10, moles: 0.1 },
      ];
      expect(engine.findReaction(contents)).toBeNull();
    });

    it("returns null for empty contents", () => {
      const engine = makeEngine();
      expect(engine.findReaction([])).toBeNull();
    });

    it("ignores chemicals with zero moles", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 10, moles: 0.1 },
        { chemicalId: "naoh", volume: 0, moles: 0 },
      ];
      expect(engine.findReaction(contents)).toBeNull();
    });
  });

  describe("getLimitingReagent", () => {
    it("identifies limiting reagent in 1:1 ratio with unequal moles", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 10, moles: 0.1 },
        { chemicalId: "naoh", volume: 5, moles: 0.05 },
      ];
      const result = engine.getLimitingReagent(neutralization, contents);
      expect(result.chemicalId).toBe("naoh");
      expect(result.molesAvailable).toBeCloseTo(0.05);
    });

    it("identifies either reagent when equal moles in 1:1", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 10, moles: 0.1 },
        { chemicalId: "naoh", volume: 10, moles: 0.1 },
      ];
      const result = engine.getLimitingReagent(neutralization, contents);
      expect(result.molesAvailable).toBeCloseTo(0.1);
    });

    it("handles missing reagent gracefully", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 10, moles: 0.1 },
      ];
      const result = engine.getLimitingReagent(neutralization, contents);
      expect(result.chemicalId).toBe("naoh");
      expect(result.molesAvailable).toBe(0);
    });
  });

  describe("calculateReaction", () => {
    it("produces correct products for HCl + NaOH neutralization", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 10, moles: 0.1 },
        { chemicalId: "naoh", volume: 5, moles: 0.05 },
      ];
      const result = engine.calculateReaction(neutralization, contents, 100);
      expect(result.limitingReagent).toBe("naoh");
      expect(result.molesReacted).toBeCloseTo(0.05);
      expect(result.reactantsConsumed).toHaveLength(2);
      expect(result.productsProduced).toHaveLength(2);

      const naclProduct = result.productsProduced.find(p => p.chemicalId === "nacl");
      expect(naclProduct).toBeDefined();
      expect(naclProduct!.moles).toBeCloseTo(0.05);
    });

    it("calculates exothermic temperature change (ΔT > 0 for negative ΔH)", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 50, moles: 0.5 },
        { chemicalId: "naoh", volume: 50, moles: 0.5 },
      ];
      const result = engine.calculateReaction(neutralization, contents, 100);
      // ΔH = -57.1 kJ/mol, so -ΔH is positive → temperature increases
      expect(result.temperatureChange).toBeGreaterThan(0);
      expect(result.heatReleased).toBeCloseTo(-57.1 * 0.5);
    });

    it("detects gas evolution", () => {
      const gasReaction: ReactionData = {
        id: "rxn2", name: "Gas test",
        equation: "Test → CO2", deltaH: -10,
        reactionType: "decomposition", isReversible: false,
        conditions: {}, description: "",
        reactants: [{ chemicalId: "hcl", coefficient: 1 }],
        products: [{ chemicalId: "co2", coefficient: 1 }],
      };
      const engine = new StoichiometryEngine(allChemicals, [gasReaction]);
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 10, moles: 0.1 },
      ];
      const result = engine.calculateReaction(gasReaction, contents, 100);
      expect(result.gasEvolved).toBe(true);
      expect(result.gasChemicalId).toBe("co2");
    });
  });

  describe("estimatePH", () => {
    it("returns pH 7 for empty container", () => {
      const engine = makeEngine();
      expect(engine.estimatePH([])).toBe(7);
    });

    it("returns pH ~1 for 0.1M HCl (strong acid)", () => {
      const engine = makeEngine();
      // 0.1 mol in 1000 mL = 0.1 M
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 1000, moles: 0.1 },
      ];
      const pH = engine.estimatePH(contents);
      expect(pH).toBeCloseTo(1, 0);
    });

    it("returns pH ~13 for 0.1M NaOH (strong base)", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "naoh", volume: 1000, moles: 0.1 },
      ];
      const pH = engine.estimatePH(contents);
      expect(pH).toBeCloseTo(13, 0);
    });

    it("returns ~pH 7 when equal moles of strong acid and base mixed", () => {
      const engine = makeEngine();
      const contents: ContainerContent[] = [
        { chemicalId: "hcl", volume: 500, moles: 0.05 },
        { chemicalId: "naoh", volume: 500, moles: 0.05 },
      ];
      const pH = engine.estimatePH(contents);
      expect(pH).toBe(7);
    });
  });

  describe("getChemical / getAllChemicals", () => {
    it("retrieves chemical by id", () => {
      const engine = makeEngine();
      const chem = engine.getChemical("hcl");
      expect(chem).toBeDefined();
      expect(chem!.name).toBe("Hydrochloric Acid");
    });

    it("returns undefined for unknown id", () => {
      const engine = makeEngine();
      expect(engine.getChemical("nonexistent")).toBeUndefined();
    });

    it("returns all chemicals", () => {
      const engine = makeEngine();
      expect(engine.getAllChemicals()).toHaveLength(allChemicals.length);
    });
  });
});
