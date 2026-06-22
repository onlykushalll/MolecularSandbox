// Molecular formula parser + 3D atom layout generator
// Parses chemical formulas like "H2SO4", "Ca(OH)2", "CuSO4·5H2O" into element counts,
// then lays out atoms in 3D space using geometry rules (linear, trigonal, tetrahedral,
// octahedral, Fibonacci sphere for larger molecules).

export interface Atom {
  element: string;
  position: [number, number, number];
  index: number;
}

export interface Bond {
  a: number; // atom index
  b: number; // atom index
  order: number; // 1, 2, 3 (single, double, triple)
}

export interface MoleculeModel {
  atoms: Atom[];
  bonds: Bond[];
  center: [number, number, number];
  formula: string;
}

// Element data: color (CPK), VDW radius (Å), common valence
export interface ElementData {
  color: string;
  radius: number; // VDW radius in Å
  valence: number; // typical valence
  group?: number;
}

export const ELEMENT_DATA: Record<string, ElementData> = {
  H: { color: "#ffffff", radius: 0.31, valence: 1, group: 1 },
  D: { color: "#ffffc0", radius: 0.31, valence: 1, group: 1 }, // Deuterium
  He: { color: "#d9ffff", radius: 0.28, valence: 0, group: 18 },
  Li: { color: "#cc80ff", radius: 1.28, valence: 1, group: 1 },
  Be: { color: "#c2ff00", radius: 0.96, valence: 2, group: 2 },
  B: { color: "#ffb5b5", radius: 0.84, valence: 3, group: 13 },
  C: { color: "#909090", radius: 0.76, valence: 4, group: 14 },
  N: { color: "#3050f8", radius: 0.71, valence: 3, group: 15 },
  O: { color: "#ff0d0d", radius: 0.66, valence: 2, group: 16 },
  F: { color: "#90e050", radius: 0.57, valence: 1, group: 17 },
  Ne: { color: "#b3e3f5", radius: 0.58, valence: 0, group: 18 },
  Na: { color: "#ab5cf2", radius: 1.66, valence: 1, group: 1 },
  Mg: { color: "#8aff00", radius: 1.41, valence: 2, group: 2 },
  Al: { color: "#bfa6a6", radius: 1.21, valence: 3, group: 13 },
  Si: { color: "#f0c8a0", radius: 1.11, valence: 4, group: 14 },
  P: { color: "#ff8000", radius: 1.07, valence: 3, group: 15 },
  S: { color: "#ffff30", radius: 1.05, valence: 2, group: 16 },
  Cl: { color: "#1ff01f", radius: 1.02, valence: 1, group: 17 },
  K: { color: "#8f40d4", radius: 2.03, valence: 1, group: 1 },
  Ca: { color: "#3dff00", radius: 1.76, valence: 2, group: 2 },
  Sc: { color: "#e6e6e6", radius: 1.70, valence: 3, group: 3 },
  Ti: { color: "#bfc2c7", radius: 1.60, valence: 4, group: 4 },
  V: { color: "#a6a6ab", radius: 1.53, valence: 5, group: 5 },
  Cr: { color: "#8a99c7", radius: 1.39, valence: 6, group: 6 },
  Mn: { color: "#9c7ac7", radius: 1.39, valence: 7, group: 7 },
  Fe: { color: "#e06633", radius: 1.32, valence: 3, group: 8 },
  Co: { color: "#f0908c", radius: 1.26, valence: 3, group: 9 },
  Ni: { color: "#50d050", radius: 1.24, valence: 2, group: 10 },
  Cu: { color: "#c88033", radius: 1.32, valence: 2, group: 11 },
  Zn: { color: "#7d80b0", radius: 1.22, valence: 2, group: 12 },
  Ga: { color: "#c28f8f", radius: 1.22, valence: 3, group: 13 },
  Ge: { color: "#668f8f", radius: 1.20, valence: 4, group: 14 },
  As: { color: "#bd80e3", radius: 1.19, valence: 3, group: 15 },
  Se: { color: "#ffa100", radius: 1.20, valence: 2, group: 16 },
  Br: { color: "#a62929", radius: 1.20, valence: 1, group: 17 },
  Kr: { color: "#5cb8d1", radius: 1.16, valence: 0, group: 18 },
  Rb: { color: "#702eb0", radius: 2.20, valence: 1, group: 1 },
  Sr: { color: "#00ff00", radius: 1.95, valence: 2, group: 2 },
  Ag: { color: "#c0c0c0", radius: 1.45, valence: 1, group: 11 },
  Cd: { color: "#ffd98f", radius: 1.44, valence: 2, group: 12 },
  Sn: { color: "#668080", radius: 1.39, valence: 4, group: 14 },
  I: { color: "#940094", radius: 1.39, valence: 1, group: 17 },
  Cs: { color: "#57178f", radius: 2.44, valence: 1, group: 1 },
  Ba: { color: "#00c900", radius: 2.15, valence: 2, group: 2 },
  Au: { color: "#ffd123", radius: 1.36, valence: 3, group: 11 },
  Hg: { color: "#b8b8d0", radius: 1.32, valence: 2, group: 12 },
  Pb: { color: "#575961", radius: 1.46, valence: 4, group: 14 },
  Bi: { color: "#9e4fb5", radius: 1.48, valence: 3, group: 15 },
};

// Common polyatomic ion shapes for better geometry
const POLYATOMIC_SHAPES: Record<string, string> = {
  SO4: "tetrahedral",
  NO3: "trigonal_planar",
  CO3: "trigonal_planar",
  PO4: "tetrahedral",
  NH4: "tetrahedral",
  OH: "linear",
  CN: "linear",
  SCN: "linear",
  MnO4: "tetrahedral",
  ClO3: "trigonal_pyramidal",
  ClO4: "tetrahedral",
  CrO4: "tetrahedral",
  Cr2O7: "tetrahedral",
};

// Tokenizer: parse a formula string into a flat list of (element, count) pairs.
// Handles nested parentheses and hydrates (·nH2O).
function tokenizeFormula(formula: string): Array<{ el: string; count: number }> {
  // Strip hydrate notation: split on · or . and process each part
  const parts = formula
    .replace(/·/g, ".")
    .split(/[.·]/)
    .filter(Boolean);

  const result: Array<{ el: string; count: number }> = [];

  for (const part of parts) {
    // Check if this part starts with a number (hydrate prefix like "5H2O")
    const hydrateMatch = part.match(/^(\d+)(.+)$/);
    let multiplier = 1;
    let core = part;
    if (hydrateMatch) {
      multiplier = parseInt(hydrateMatch[1], 10);
      core = hydrateMatch[2];
    }
    const tokens = tokenizeCore(core);
    for (const t of tokens) {
      result.push({ el: t.el, count: t.count * multiplier });
    }
  }

  return result;
}

function tokenizeCore(formula: string): Array<{ el: string; count: number }> {
  const tokens: Array<{ el: string; count: number }> = [];
  const stack: Array<{ el: string; count: number }>[] = [[]];
  let i = 0;

  while (i < formula.length) {
    const ch = formula[i];

    // Uppercase letter → new element
    if (ch >= "A" && ch <= "Z") {
      let el = ch;
      i++;
      // Lowercase letters continue element name
      while (i < formula.length && formula[i] >= "a" && formula[i] <= "z") {
        el += formula[i];
        i++;
      }
      // Parse count
      let countStr = "";
      while (i < formula.length && formula[i] >= "0" && formula[i] <= "9") {
        countStr += formula[i];
        i++;
      }
      const count = countStr === "" ? 1 : parseInt(countStr, 10);
      stack[stack.length - 1].push({ el, count });
      continue;
    }

    // Opening parenthesis → push new frame
    if (ch === "(" || ch === "[") {
      stack.push([]);
      i++;
      continue;
    }

    // Closing parenthesis → pop frame, apply multiplier
    if (ch === ")" || ch === "]") {
      i++;
      let countStr = "";
      while (i < formula.length && formula[i] >= "0" && formula[i] <= "9") {
        countStr += formula[i];
        i++;
      }
      const mult = countStr === "" ? 1 : parseInt(countStr, 10);
      const frame = stack.pop()!;
      for (const t of frame) {
        stack[stack.length - 1].push({ el: t.el, count: t.count * mult });
      }
      continue;
    }

    // Skip anything else (whitespace, etc.)
    i++;
  }

  return stack[0];
}

// Merge duplicate elements
function mergeTokens(
  tokens: Array<{ el: string; count: number }>
): Array<{ el: string; count: number }> {
  const map = new Map<string, number>();
  for (const t of tokens) {
    map.set(t.el, (map.get(t.el) || 0) + t.count);
  }
  return Array.from(map.entries()).map(([el, count]) => ({ el, count }));
}

// Expand tokens into individual atoms
function expandAtoms(tokens: Array<{ el: string; count: number }>): string[] {
  const atoms: string[] = [];
  for (const t of tokens) {
    for (let i = 0; i < t.count; i++) {
      atoms.push(t.el);
    }
  }
  return atoms;
}

// Fibonacci sphere distribution — places N points evenly on a unit sphere
function fibonacciSphere(n: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2; // y from 1 to -1
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    points.push([x * radius, y * radius, z * radius]);
  }
  return points;
}

// Tetrahedron vertices
function tetrahedron(radius: number): [number, number, number][] {
  const t = radius * 1.225; // scale so vertices are at `radius`
  return [
    [t, t, t],
    [-t, -t, t],
    [-t, t, -t],
    [t, -t, -t],
  ];
}

// Trigonal planar (3 atoms, 120°)
function trigonalPlanar(radius: number): [number, number, number][] {
  return [
    [0, 0, radius],
    [radius * 0.866, 0, -radius * 0.5],
    [-radius * 0.866, 0, -radius * 0.5],
  ];
}

// Linear
function linear(radius: number): [number, number, number][] {
  return [
    [0, 0, radius],
    [0, 0, -radius],
  ];
}

// Octahedral (6 vertices)
function octahedron(radius: number): [number, number, number][] {
  return [
    [radius, 0, 0],
    [-radius, 0, 0],
    [0, radius, 0],
    [0, -radius, 0],
    [0, 0, radius],
    [0, 0, -radius],
  ];
}

// Layout atoms in 3D. Strategy:
// - If 1 atom: at origin
// - If 2 atoms: linear
// - If 3 atoms: trigonal planar
// - If 4 atoms: tetrahedral
// - If 6 atoms: octahedral
// - Otherwise: Fibonacci sphere
//
// For multi-element molecules, place central atom(s) near origin and outer atoms around them.
function layoutAtoms(atomList: string[]): { positions: [number, number, number][]; bonds: Bond[] } {
  const n = atomList.length;
  const positions: [number, number, number][] = [];

  if (n === 0) return { positions, bonds: [] };
  if (n === 1) {
    positions.push([0, 0, 0]);
    return { positions, bonds: [] };
  }

  // Identify central atom: the one with highest valence (or first non-H, non-halogen)
  const centralIdx = findCentralAtom(atomList);
  const centralEl = atomList[centralIdx];
  const centralData = ELEMENT_DATA[centralEl];

  if (n === 2) {
    // Diatomic: linear along z-axis. Bond length = sum of covalent radii.
    const r1 = (centralData?.radius || 0.7) * 0.77; // covalent ~ 0.77 × VDW
    const r2 = (ELEMENT_DATA[atomList[1 - centralIdx]]?.radius || 0.7) * 0.77;
    const bondLen = r1 + r2;
    // Place central at -bondLen/2 * z, other at +bondLen/2 * z
    const a = centralIdx === 0 ? -1 : 1;
    positions[centralIdx] = [0, 0, a * bondLen / 2];
    positions[1 - centralIdx] = [0, 0, -a * bondLen / 2];
    return { positions, bonds: [{ a: 0, b: 1, order: guessBondOrder(centralEl, atomList[1 - centralIdx]) }] };
  }

  // For 3+ atoms, place central at origin and arrange the rest around it.
  const outerIndices = atomList.map((_, i) => i).filter((i) => i !== centralIdx);
  const outerEls = outerIndices.map((i) => atomList[i]);
  const nOuter = outerIndices.length;

  // Bond length scale: use covalent radii
  const bondRadius = Math.max(0.8, (centralData?.radius || 0.7) * 0.77 + 0.5);

  // Choose geometry based on count
  let outerPositions: [number, number, number][];
  if (nOuter === 2) {
    outerPositions = linear(bondRadius).map((p) => [p[0], p[1], p[2]]);
  } else if (nOuter === 3) {
    outerPositions = trigonalPlanar(bondRadius);
  } else if (nOuter === 4) {
    outerPositions = tetrahedron(bondRadius);
  } else if (nOuter === 6) {
    outerPositions = octahedron(bondRadius);
  } else {
    outerPositions = fibonacciSphere(nOuter, bondRadius);
  }

  // Assign positions
  positions[centralIdx] = [0, 0, 0];
  for (let i = 0; i < outerIndices.length; i++) {
    positions[outerIndices[i]] = outerPositions[i];
  }

  // Build bonds: central atom bonds to each outer atom
  const bonds: Bond[] = [];
  for (const oi of outerIndices) {
    bonds.push({
      a: centralIdx,
      b: oi,
      order: guessBondOrder(centralEl, atomList[oi]),
    });
  }

  // For larger molecules (nOuter > 4), also bond some outer atoms to each other if they're close
  if (nOuter >= 5) {
    for (let i = 0; i < outerIndices.length; i++) {
      for (let j = i + 1; j < outerIndices.length; j++) {
        const pa = positions[outerIndices[i]];
        const pb = positions[outerIndices[j]];
        const dist = Math.sqrt(
          (pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2 + (pa[2] - pb[2]) ** 2
        );
        if (dist < bondRadius * 1.3) {
          // Don't duplicate bonds
          if (!bonds.some((b) => (b.a === outerIndices[i] && b.b === outerIndices[j]) || (b.a === outerIndices[j] && b.b === outerIndices[i]))) {
            bonds.push({ a: outerIndices[i], b: outerIndices[j], order: 1 });
          }
        }
      }
    }
  }

  return { positions, bonds };
}

function findCentralAtom(atoms: string[]): number {
  // Priority: C > N > S > P > Si > B > Be > metal > other non-H > H
  // (organic chemistry convention)
  const priority: Record<string, number> = {
    C: 100,
    Si: 95,
    N: 90,
    P: 85,
    S: 80,
    B: 70,
    Be: 65,
    O: 50,
    Se: 45,
  };
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < atoms.length; i++) {
    const el = atoms[i];
    let score: number;
    if (el in priority) {
      score = priority[el];
    } else if (el === "H") {
      score = -10; // never central
    } else if (el === "F" || el === "Cl" || el === "Br" || el === "I") {
      score = -5; // halogens terminal
    } else if (el === "O") {
      score = 30;
    } else {
      // metals and other elements — moderate
      const data = ELEMENT_DATA[el];
      score = data ? data.valence * 5 : 0;
    }
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

function guessBondOrder(el1: string, el2: string): number {
  // Heuristic: C-C single, C=C double, C≡C triple, C=O double, N=O double, etc.
  const pair = [el1, el2].sort().join("");
  if (pair === "CC") return 1; // default single
  if (pair === "CN") return 1;
  if (pair === "CO") return 2; // C=O
  if (pair === "NO") return 2; // N=O
  if (pair === "OO") return 2; // O=O
  if (pair === "NN") return 3; // N≡N
  if (pair === "CS") return 2; // C=S
  if (pair === "SO") return 2; // S=O
  if (pair === "PO") return 2; // P=O
  return 1;
}

// Main entry: parse a formula and produce a 3D molecule model
export function buildMoleculeModel(formula: string): MoleculeModel {
  const cleaned = formula.replace(/\s/g, "").replace(/→/g, "");
  const tokens = mergeTokens(tokenizeFormula(cleaned));
  const atomList = expandAtoms(tokens);

  // Cap at 60 atoms to prevent performance issues
  const capped = atomList.slice(0, 60);

  const { positions, bonds } = layoutAtoms(capped);

  const atoms: Atom[] = capped.map((el, i) => ({
    element: el,
    position: positions[i] || [0, 0, 0],
    index: i,
  }));

  // Center the molecule
  const cx = atoms.reduce((s, a) => s + a.position[0], 0) / atoms.length;
  const cy = atoms.reduce((s, a) => s + a.position[1], 0) / atoms.length;
  const cz = atoms.reduce((s, a) => s + a.position[2], 0) / atoms.length;
  const centered = atoms.map((a) => ({
    ...a,
    position: [a.position[0] - cx, a.position[1] - cy, a.position[2] - cz] as [number, number, number],
  }));

  return {
    atoms: centered,
    bonds,
    center: [0, 0, 0],
    formula,
  };
}

// Get element display info
export function getElementInfo(symbol: string): {
  color: string;
  radius: number;
  name: string;
  valence: number;
} {
  const data = ELEMENT_DATA[symbol];
  const names: Record<string, string> = {
    H: "Hydrogen", He: "Helium", Li: "Lithium", Be: "Beryllium", B: "Boron",
    C: "Carbon", N: "Nitrogen", O: "Oxygen", F: "Fluorine", Ne: "Neon",
    Na: "Sodium", Mg: "Magnesium", Al: "Aluminium", Si: "Silicon", P: "Phosphorus",
    S: "Sulfur", Cl: "Chlorine", K: "Potassium", Ca: "Calcium", Fe: "Iron",
    Cu: "Copper", Zn: "Zinc", Br: "Bromine", Ag: "Silver", I: "Iodine",
    Au: "Gold", Hg: "Mercury", Pb: "Lead", Ba: "Barium", Sr: "Strontium",
    Mn: "Manganese", Co: "Cobalt", Ni: "Nickel", Cr: "Chromium", V: "Vanadium",
    Ti: "Titanium", Sn: "Tin", Bi: "Bismuth", Rb: "Rubidium", Cs: "Cesium",
    As: "Arsenic", Se: "Selenium", Ge: "Germanium", Ga: "Gallium", Cd: "Cadmium",
    Sc: "Scandium", Kr: "Krypton", D: "Deuterium",
  };
  return {
    color: data?.color || "#ff00ff",
    radius: data?.radius || 0.7,
    name: names[symbol] || symbol,
    valence: data?.valence || 0,
  };
}

// Get molecular formula breakdown for display
export function getFormulaBreakdown(formula: string): Array<{ el: string; count: number; name: string }> {
  const tokens = mergeTokens(tokenizeFormula(formula.replace(/\s/g, "")));
  return tokens.map((t) => ({
    el: t.el,
    count: t.count,
    name: getElementInfo(t.el).name,
  }));
}
