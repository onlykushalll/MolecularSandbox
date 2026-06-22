// Default mechanism & observation notes by reaction type.
// Used when a reaction doesn't have an explicit `mechanism` field set in the DB.
import type { ReactionType } from "./types";

interface MechanismInfo {
  mechanism: string;
  observation: string;
  realWorldUse?: string;
}

const DEFAULT_MECHANISMS: Record<ReactionType, MechanismInfo> = {
  acid_base: {
    mechanism:
      "H⁺ from the acid transfers to OH⁻ from the base (Brønsted–Lowry proton transfer), forming water. The spectator ions remain in solution as a neutral salt.",
    observation:
      "Temperature rises (exothermic). pH moves toward 7. Color may shift if an indicator is present.",
    realWorldUse:
      "Antacid tablets, soap-making (saponification), soil pH adjustment, titration analyses.",
  },
  redox: {
    mechanism:
      "Electrons transfer from the reducing agent (loses e⁻, oxidized) to the oxidizing agent (gains e⁻, reduced). Oxidation states change.",
    observation:
      "Color change as metal ions change oxidation state. Solid metal may deposit. Gas may evolve if H⁺ is reduced to H₂.",
    realWorldUse:
      "Batteries, rust formation, electroplating, photosynthesis, cellular respiration.",
  },
  precipitation: {
    mechanism:
      "Two soluble salts exchange ions (double displacement). An insoluble product has a lattice energy greater than its hydration energy, so it crashes out as a solid.",
    observation:
      "Cloudiness appears immediately as fine solid particles form and settle to the bottom.",
    realWorldUse:
      "Water purification, pigment manufacture, qualitative analysis, kidney stone formation.",
  },
  synthesis: {
    mechanism:
      "Two or more reactants combine to form a single, more complex product. Bonds form, releasing energy.",
    observation:
      "Mass is conserved. Product often has different state/color than reactants. Often exothermic.",
    realWorldUse:
      "Haber process (NH₃), rust formation, polymer synthesis, photosynthesis.",
  },
  decomposition: {
    mechanism:
      "A single compound breaks into two or more simpler substances. Energy input (heat, light, or electricity) breaks bonds.",
    observation:
      "Often requires continuous heating. Gas bubbles may evolve. Solid color changes as composition shifts.",
    realWorldUse:
      "Electrolysis of water, calcium carbonate calcination, hydrogen peroxide decomposition, explosive demolition.",
  },
  single_replacement: {
    mechanism:
      "A more reactive element displaces a less reactive one from its compound. Activity series predicts direction (more reactive → less reactive).",
    observation:
      "Solid metal disappears on one side, new solid appears on the other. Color of solution changes as ion changes.",
    realWorldUse:
      "Thermite welding, extracting metals from ores, sacrificial anodes, iron smelting.",
  },
  double_replacement: {
    mechanism:
      "Two compounds exchange ions (AB + CD → AD + CB). Driven by formation of a precipitate, gas, or weak electrolyte (e.g. water).",
    observation:
      "Depends on driving force — precipitate, gas bubbles, or neutralization heat.",
    realWorldUse:
      "Wastewater treatment, drug synthesis, identification of unknown ions, baking (acid + base → CO₂).",
  },
  combustion: {
    mechanism:
      "A fuel reacts rapidly with an oxidizer (usually O₂), releasing heat and light. Free-radical chain reaction sustains the flame.",
    observation:
      "Flame, heat, often visible smoke. Products are typically CO₂ and H₂O for hydrocarbons.",
    realWorldUse:
      "Energy production, engines, heating, fireworks, accidental fires.",
  },
};

export function getMechanismInfo(
  reactionType: ReactionType,
  overrides?: Partial<MechanismInfo>
): MechanismInfo {
  const base = DEFAULT_MECHANISMS[reactionType] || DEFAULT_MECHANISMS.synthesis;
  return {
    mechanism: overrides?.mechanism || base.mechanism,
    observation: overrides?.observation || base.observation,
    realWorldUse: overrides?.realWorldUse || base.realWorldUse,
  };
}

export const REACTION_TYPE_LABELS: Record<ReactionType, string> = {
  acid_base: "Acid-Base",
  redox: "Redox",
  precipitation: "Precipitation",
  synthesis: "Synthesis",
  decomposition: "Decomposition",
  single_replacement: "Single Replacement",
  double_replacement: "Double Replacement",
  combustion: "Combustion",
};

export const REACTION_TYPE_COLORS: Record<ReactionType, string> = {
  acid_base: "text-rose-400 bg-rose-500/15 border-rose-500/30",
  redox: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  precipitation: "text-purple-400 bg-purple-500/15 border-purple-500/30",
  synthesis: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  decomposition: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  single_replacement: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30",
  double_replacement: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  combustion: "text-red-400 bg-red-500/15 border-red-500/30",
};
