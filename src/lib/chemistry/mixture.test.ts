import { describe, it, expect } from "vitest";
import {
  calculateTotalMass,
  calculateAverageSpecificHeat,
  calculateDensity,
  calculateVaporPressure,
  isHomogeneous,
  mixHexColors,
  molesToVolume,
  volumeToMoles,
  calculatePH,
  hexToRgb,
  rgbToHex,
  phToColor,
  phLabel,
} from "./mixture";
import type { ChemicalData, ContainerContent } from "./types";

const water: ChemicalData = {
  id: "h2o", name: "Water", formula: "H2O",
  molarMass: 18.015, density: 1.0, specificHeatCapacity: 4.18,
  surfaceTension: 0.072, vaporPressure: 3.17, boilingPoint: 100,
  meltingPoint: 0, hexColor: "#88ccff", stateAtSTP: "liquid",
  hazards: [], solubility: {}, refractiveIndex: 1.33,
  viscosity: 1.0, category: "solvent", description: "",
};

const hcl: ChemicalData = {
  id: "hcl", name: "Hydrochloric Acid", formula: "HCl",
  molarMass: 36.46, density: 1.18, specificHeatCapacity: 3.14,
  surfaceTension: 0.068, vaporPressure: 30, boilingPoint: 110,
  meltingPoint: -30, hexColor: "#ccffcc", stateAtSTP: "liquid",
  hazards: ["corrosive"], solubility: {}, refractiveIndex: 1.36,
  viscosity: 1.2, category: "acid", description: "",
};

const naoh: ChemicalData = {
  id: "naoh", name: "Sodium Hydroxide", formula: "NaOH",
  molarMass: 40.0, density: 2.13, specificHeatCapacity: 1.49,
  surfaceTension: 0.073, vaporPressure: 0, boilingPoint: 1388,
  meltingPoint: 318, hexColor: "#ffffff", stateAtSTP: "solid",
  hazards: ["corrosive"], solubility: {}, refractiveIndex: 1.47,
  viscosity: 1.0, category: "base", description: "",
};

const co2: ChemicalData = {
  id: "co2", name: "Carbon Dioxide", formula: "CO2",
  molarMass: 44.01, density: 0.001977, specificHeatCapacity: 0.84,
  surfaceTension: 0, vaporPressure: 5730, boilingPoint: -78.5,
  meltingPoint: -56.6, hexColor: "#cccccc", stateAtSTP: "gas",
  hazards: [], solubility: {}, refractiveIndex: 1.0,
  viscosity: 0.015, category: "gas", description: "",
};

const chemicals = new Map<string, ChemicalData>([
  ["h2o", water],
  ["hcl", hcl],
  ["naoh", naoh],
  ["co2", co2],
]);

describe("calculateTotalMass", () => {
  it("calculates mass for liquids (volume × density)", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "h2o", volume: 100, moles: 5.55 },
    ];
    const mass = calculateTotalMass(contents, chemicals);
    expect(mass).toBeCloseTo(100); // 100 mL × 1.0 g/mL
  });

  it("calculates mass for solids (moles × molarMass)", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "naoh", volume: 10, moles: 0.5 },
    ];
    const mass = calculateTotalMass(contents, chemicals);
    expect(mass).toBeCloseTo(20); // 0.5 mol × 40 g/mol
  });

  it("sums multiple chemicals", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "h2o", volume: 100, moles: 5.55 },
      { chemicalId: "hcl", volume: 50, moles: 1.4 },
    ];
    const mass = calculateTotalMass(contents, chemicals);
    expect(mass).toBeCloseTo(100 + 50 * 1.18);
  });

  it("returns 0 for empty contents", () => {
    expect(calculateTotalMass([], chemicals)).toBe(0);
  });
});

describe("calculateAverageSpecificHeat", () => {
  it("returns water's specific heat for pure water", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "h2o", volume: 100, moles: 5.55 },
    ];
    const cp = calculateAverageSpecificHeat(contents, chemicals);
    expect(cp).toBeCloseTo(4.18);
  });

  it("returns default 4.18 for empty contents", () => {
    expect(calculateAverageSpecificHeat([], chemicals)).toBeCloseTo(4.18);
  });
});

describe("calculateDensity", () => {
  it("returns 1.0 for pure water", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "h2o", volume: 100, moles: 5.55 },
    ];
    expect(calculateDensity(contents, chemicals)).toBeCloseTo(1.0);
  });

  it("returns 1.0 for empty contents", () => {
    expect(calculateDensity([], chemicals)).toBe(1.0);
  });
});

describe("calculateVaporPressure", () => {
  it("returns 0 for empty", () => {
    expect(calculateVaporPressure([], chemicals, 25)).toBe(0);
  });

  it("increases with temperature", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "h2o", volume: 100, moles: 5.55 },
    ];
    const p25 = calculateVaporPressure(contents, chemicals, 25);
    const p50 = calculateVaporPressure(contents, chemicals, 50);
    expect(p50).toBeGreaterThan(p25);
  });
});

describe("isHomogeneous", () => {
  it("single chemical is homogeneous", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "h2o", volume: 100, moles: 5.55 },
    ];
    expect(isHomogeneous(contents, chemicals)).toBe(true);
  });

  it("empty is homogeneous", () => {
    expect(isHomogeneous([], chemicals)).toBe(true);
  });
});

describe("molesToVolume / volumeToMoles", () => {
  it("converts moles to volume for liquid", () => {
    // 1 mol water = 18.015g / 1.0 g/mL = 18.015 mL
    const vol = molesToVolume(1, water);
    expect(vol).toBeCloseTo(18.015);
  });

  it("converts moles to volume for gas (ideal gas at STP)", () => {
    const vol = molesToVolume(1, co2);
    expect(vol).toBeCloseTo(22400); // 1 mol = 22.4 L = 22400 mL
  });

  it("round-trips volume → moles → volume for liquid", () => {
    const moles = volumeToMoles(100, water);
    const vol = molesToVolume(moles, water);
    expect(vol).toBeCloseTo(100);
  });

  it("round-trips for gas", () => {
    const moles = volumeToMoles(22400, co2);
    expect(moles).toBeCloseTo(1);
  });
});

describe("mixHexColors", () => {
  it("returns default for empty", () => {
    const { hex, opacity } = mixHexColors([]);
    expect(hex).toBe("#88ccff");
    expect(opacity).toBeCloseTo(0.3);
  });

  it("returns single color when one chemical", () => {
    const { hex } = mixHexColors([{ hex: "#ff0000", moles: 1 }]);
    expect(hex).toBe("#ff0000");
  });

  it("mixes two equal colors to midpoint", () => {
    const { hex } = mixHexColors([
      { hex: "#ff0000", moles: 1 },
      { hex: "#0000ff", moles: 1 },
    ]);
    // Should be roughly purple: R=128, G=0, B=128
    expect(hex).toBe("#800080");
  });
});

describe("hexToRgb / rgbToHex", () => {
  it("parses hex to RGB", () => {
    expect(hexToRgb("#ff8800")).toEqual({ r: 255, g: 136, b: 0 });
  });

  it("converts RGB back to hex", () => {
    expect(rgbToHex(255, 136, 0)).toBe("#ff8800");
  });

  it("round-trips", () => {
    const { r, g, b } = hexToRgb("#1a2b3c");
    expect(rgbToHex(r, g, b)).toBe("#1a2b3c");
  });
});

describe("calculatePH", () => {
  it("returns 7 for empty", () => {
    expect(calculatePH([], chemicals)).toBe(7.0);
  });

  it("returns ~1 for 0.1M HCl", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "hcl", volume: 1000, moles: 0.1 },
    ];
    const pH = calculatePH(contents, chemicals);
    expect(pH).toBeCloseTo(1, 0);
  });

  it("returns ~13 for 0.1M NaOH", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "naoh", volume: 1000, moles: 0.1 },
    ];
    const pH = calculatePH(contents, chemicals);
    expect(pH).toBeCloseTo(13, 0);
  });

  it("returns ~7 for equal moles acid + base", () => {
    const contents: ContainerContent[] = [
      { chemicalId: "hcl", volume: 500, moles: 0.1 },
      { chemicalId: "naoh", volume: 500, moles: 0.1 },
    ];
    const pH = calculatePH(contents, chemicals);
    expect(pH).toBe(7.0);
  });

  it("pH decreases with increasing acid concentration", () => {
    const weak: ContainerContent[] = [
      { chemicalId: "hcl", volume: 1000, moles: 0.01 },
    ];
    const strong: ContainerContent[] = [
      { chemicalId: "hcl", volume: 1000, moles: 1.0 },
    ];
    const pHWeak = calculatePH(weak, chemicals);
    const pHStrong = calculatePH(strong, chemicals);
    expect(pHStrong).toBeLessThan(pHWeak);
  });
});

describe("phToColor", () => {
  it("returns red-ish for pH 0", () => {
    const color = phToColor(0);
    const { r } = hexToRgb(color);
    expect(r).toBeGreaterThan(200);
  });

  it("returns green-ish for pH 7", () => {
    const color = phToColor(7);
    const { g } = hexToRgb(color);
    expect(g).toBeGreaterThan(150);
  });

  it("returns blue/violet for pH 14", () => {
    const color = phToColor(14);
    const { b } = hexToRgb(color);
    expect(b).toBeGreaterThan(200);
  });
});

describe("phLabel", () => {
  it("strongly acidic for pH < 2", () => {
    expect(phLabel(0.5)).toBe("Strongly Acidic");
  });
  it("neutral for pH ~7", () => {
    expect(phLabel(7)).toBe("Neutral");
  });
  it("strongly basic for pH > 12", () => {
    expect(phLabel(13)).toBe("Strongly Basic");
  });
});
