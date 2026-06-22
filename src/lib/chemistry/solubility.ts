// Solubility Rules Engine for The Molecular Sandbox
// Implements the standard solubility rules taught in introductory chemistry.
// Reference: Brown, LeMay, Bursten — Chemistry: The Central Science

/**
 * Determine whether a salt is soluble in water at standard conditions.
 * Returns "soluble" | "insoluble" | "slightly soluble".
 *
 * Solubility Rules (in order of priority — first match wins):
 * 1. Alkali metal (Li+, Na+, K+, Rb+, Cs+, NH4+) salts → SOLUBLE
 * 2. Nitrate (NO3-), acetate (CH3COO-), chlorate (ClO3-), perchlorate (ClO4-) → SOLUBLE
 * 3. Halides (Cl-, Br-, I-) → SOLUBLE except Ag+, Pb2+, Hg2 2+
 * 4. Sulfates (SO4 2-) → SOLUBLE except Ba2+, Pb2+, Ca2+, Sr2+ (slightly)
 * 5. Carbonates (CO3 2-), phosphates (PO4 3-), sulfites (SO3 2-) → INSOLUBLE except alkali/NH4+
 * 6. Hydroxides (OH-) → INSOLUBLE except alkali, Ba2+, Sr2+, Ca2+ (slightly)
 * 7. Sulfides (S 2-) → INSOLUBLE except alkali, alkaline earth, NH4+
 * 8. Oxides → INSOLUBLE except alkali, alkaline earth
 */
export type Solubility = "soluble" | "insoluble" | "slightly";

export interface SolubilityResult {
  solubility: Solubility;
  reason: string;
  /** g per 100 mL at 20°C (approximate, for known compounds) */
  gPer100mL?: number;
}

// Common ion regex patterns
const CATION_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /^(Li|Na|K|Rb|Cs|Fr)(?![a-z])/, name: "alkali-metal" },
  { pattern: /^NH4/, name: "ammonium" },
  { pattern: /^Ag(?![a-z])/, name: "silver" },
  { pattern: /^Pb(?![a-z])/, name: "lead" },
  { pattern: /^Hg2/, name: "mercury(I)" },
  { pattern: /^Hg(?![a-z])/, name: "mercury(II)" },
  { pattern: /^Ba(?![a-z])/, name: "barium" },
  { pattern: /^Sr(?![a-z])/, name: "strontium" },
  { pattern: /^Ca(?![a-z])/, name: "calcium" },
  { pattern: /^Mg(?![a-z])/, name: "magnesium" },
  { pattern: /^Fe(?![a-z])/, name: "iron" },
  { pattern: /^Cu(?![a-z])/, name: "copper" },
  { pattern: /^Zn(?![a-z])/, name: "zinc" },
  { pattern: /^Al(?![a-z])/, name: "aluminum" },
];

const ANION_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /NO3$/, name: "nitrate" },
  { pattern: /NO2$/, name: "nitrite" },
  { pattern: /CH3COO$/, name: "acetate" },
  { pattern: /C2H3O2$/, name: "acetate" },
  { pattern: /ClO3$/, name: "chlorate" },
  { pattern: /ClO4$/, name: "perchlorate" },
  { pattern: /Cl$/, name: "chloride" },
  { pattern: /Br$/, name: "bromide" },
  { pattern: /I$/, name: "iodide" },
  { pattern: /SO4$/, name: "sulfate" },
  { pattern: /SO3$/, name: "sulfite" },
  { pattern: /CO3$/, name: "carbonate" },
  { pattern: /PO4$/, name: "phosphate" },
  { pattern: /OH$/, name: "hydroxide" },
  { pattern: /S$/, name: "sulfide" },
  { pattern: /O$/, name: "oxide" },
];

function detectCation(formula: string): string {
  for (const { pattern, name } of CATION_PATTERNS) {
    if (pattern.test(formula)) return name;
  }
  return "unknown";
}

function detectAnion(formula: string): string {
  // Strip hydrate notation like CuSO4·5H2O
  const clean = formula.split(/[·.]/)[0];
  for (const { pattern, name } of ANION_PATTERNS) {
    if (pattern.test(clean)) return name;
  }
  return "unknown";
}

export function checkSolubility(formula: string): SolubilityResult {
  // Normalize: remove spaces, parentheses markers that confuse regex
  const f = formula.replace(/\s+/g, "").replace(/\(H2O\)/g, "");
  const clean = f.split(/[·.]/)[0];

  // Pure elements and gases aren't "salts" — they don't apply
  if (/^(H2|O2|N2|Cl2|Br2|I2|F2|He|Ne|Ar|Kr|Xe|Rn)$/.test(clean)) {
    return { solubility: "insoluble", reason: "Element / diatomic gas — not an ionic salt" };
  }
  // Acids are soluble (infinite miscibility)
  if (/^(HCl|HBr|HI|HNO3|H2SO4|HClO4|CH3COOH|HF)$/.test(clean)) {
    return { solubility: "soluble", reason: "Acid — fully miscible", gPer100mL: 1000 };
  }
  // Bases like NaOH, KOH soluble; NH3 miscible
  // Water
  if (clean === "H2O" || clean === "H2O(l)") {
    return { solubility: "soluble", reason: "Solvent", gPer100mL: 1000 };
  }

  const cation = detectCation(clean);
  const anion = detectAnion(clean);

  // Rule 1: alkali metal / ammonium salts — always soluble
  if (cation === "alkali-metal" || cation === "ammonium") {
    return { solubility: "soluble", reason: `Alkali/NH4+ salt — always soluble (Rule 1)` };
  }

  // Rule 2: nitrates, acetates, chlorates, perchlorates — always soluble
  if (["nitrate", "nitrite", "acetate", "chlorate", "perchlorate"].includes(anion)) {
    return { solubility: "soluble", reason: `${anion} salt — always soluble (Rule 2)` };
  }

  // Rule 3: halides — soluble except Ag+, Pb2+, Hg2 2+
  if (["chloride", "bromide", "iodide"].includes(anion)) {
    if (cation === "silver" || cation === "lead" || cation === "mercury(I)") {
      return {
        solubility: "insoluble",
        reason: `${cation} ${anion} — exception to halide rule (Rule 3)`,
        gPer100mL: cation === "silver" ? 0.00089 : cation === "lead" ? 0.067 : 0,
      };
    }
    return { solubility: "soluble", reason: `Halide salt — soluble (Rule 3)` };
  }

  // Rule 4: sulfates — soluble except Ba2+, Pb2+, Ca2+ (slightly), Sr2+
  if (anion === "sulfate") {
    if (cation === "barium" || cation === "lead" || cation === "strontium") {
      return {
        solubility: "insoluble",
        reason: `${cation} sulfate — exception (Rule 4)`,
        gPer100mL: cation === "barium" ? 0.000244 : 0.0045,
      };
    }
    if (cation === "calcium") {
      return {
        solubility: "slightly",
        reason: `Calcium sulfate — slightly soluble (Rule 4)`,
        gPer100mL: 0.21,
      };
    }
    return { solubility: "soluble", reason: `Sulfate salt — soluble (Rule 4)` };
  }

  // Rule 5: carbonates, phosphates, sulfites — insoluble except alkali/NH4+ (already handled above)
  if (["carbonate", "phosphate", "sulfite"].includes(anion)) {
    return {
      solubility: "insoluble",
      reason: `${cation} ${anion} — insoluble (Rule 5)`,
      gPer100mL: 0.001,
    };
  }

  // Rule 6: hydroxides — insoluble except alkali (handled), Ba2+, Sr2+ (soluble), Ca2+ (slightly)
  if (anion === "hydroxide") {
    if (cation === "barium" || cation === "strontium") {
      return { solubility: "soluble", reason: `${cation} hydroxide — soluble (Rule 6)` };
    }
    if (cation === "calcium") {
      return {
        solubility: "slightly",
        reason: `Calcium hydroxide — slightly soluble (Rule 6)`,
        gPer100mL: 0.173,
      };
    }
    return {
      solubility: "insoluble",
      reason: `${cation} hydroxide — insoluble (Rule 6)`,
      gPer100mL: cation === "copper" ? 0.0003 : cation === "iron" ? 0.0001 : 0.001,
    };
  }

  // Rule 7: sulfides — insoluble except alkali, alkaline earth, NH4+
  if (anion === "sulfide") {
    if (["alkali-metal", "ammonium", "calcium", "barium", "strontium", "magnesium"].includes(cation)) {
      return { solubility: "soluble", reason: `${cation} sulfide — soluble (Rule 7)` };
    }
    return {
      solubility: "insoluble",
      reason: `${cation} sulfide — insoluble (Rule 7)`,
      gPer100mL: 0.0001,
    };
  }

  // Rule 8: oxides — insoluble except alkali, alkaline earth
  if (anion === "oxide") {
    if (["alkali-metal", "calcium", "barium", "strontium", "magnesium"].includes(cation)) {
      return { solubility: "soluble", reason: `${cation} oxide — soluble (Rule 8)` };
    }
    return { solubility: "insoluble", reason: `${cation} oxide — insoluble (Rule 8)` };
  }

  // Unknown compound — assume soluble (conservative)
  return {
    solubility: "soluble",
    reason: `Unknown compound (${cation} ${anion}) — assumed soluble`,
  };
}

/**
 * Color overrides for common precipitates (since hex colors in DB are for the dry salt).
 * Many dry salts are white but their precipitate form has characteristic colors.
 */
export const PRECIPITATE_COLORS: Record<string, string> = {
  // Common precipitate colors (when formed in solution)
  PbI2: "#ffdd00",        // golden yellow
  PbCl2: "#ffffff",       // white
  PbSO4: "#ffffff",       // white
  "Pb(OH)2": "#ffffff",   // white
  AgCl: "#ffffff",        // white (curdy)
  AgBr: "#fff0cc",        // pale cream
  AgI: "#ffeb99",         // yellow
  "Ag2CrO4": "#b8003e",   // brick red
  BaSO4: "#ffffff",       // white
  CaSO4: "#ffffff",       // white
  "Cu(OH)2": "#3399ff",   // blue gelatinous
  "Fe(OH)2": "#88aa66",   // pale green
  "Fe(OH)3": "#aa3300",   // rust red-brown
  "Mg(OH)2": "#ffffff",   // white
  "Zn(OH)2": "#ffffff",   // white
  "Al(OH)3": "#ffffff",   // white gelatinous
  CuS: "#222222",         // black
  FeS: "#333322",         // black-brown
  ZnS: "#ffffff",         // white
  PbS: "#1a1a1a",         // black
  Ag2S: "#1a1a1a",        // black
  MnS: "#a8d4a8",         // pink/salmon
  CdS: "#ffdd33",         // yellow (cadmium yellow)
  NiS: "#222222",         // black
  CoS: "#222222",         // black
  CaCO3: "#ffffff",       // white
  BaCO3: "#ffffff",       // white
  "Ca3(PO4)2": "#ffffff", // white
  MgCO3: "#ffffff",       // white
};

/**
 * Get the precipitate color for a chemical formula.
 * Falls back to the provided default color (typically the DB hexColor).
 */
export function getPrecipitateColor(formula: string, fallbackColor: string): string {
  const clean = formula.replace(/\s+/g, "").replace(/\(H2O\)/g, "").split(/[·.]/)[0];
  return PRECIPITATE_COLORS[clean] ?? fallbackColor;
}

/**
 * Convenience: should this product be treated as a precipitate?
 * A solid product from liquid/aqueous reactants is a precipitate only if it's insoluble.
 */
export function isPrecipitate(formula: string): boolean {
  const { solubility } = checkSolubility(formula);
  return solubility === "insoluble" || solubility === "slightly";
}
