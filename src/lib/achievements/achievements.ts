// Achievement definitions + evaluation logic for The Molecular Sandbox
// Tracks progress across reactions, experiments, safety, and discovery milestones.

export type AchievementCategory =
  | "firsts" // First-time milestones
  | "reactions" // Cumulative reaction counts
  | "discovery" // Discovering specific reaction types
  | "mastery" // Skill-based achievements
  | "safety" // PPE / safety-related
  | "presets"; // Completing preset experiments

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string; // emoji
  hidden?: boolean; // hidden until unlocked
  // Progress threshold (e.g. 5 for "complete 5 reactions")
  threshold?: number;
  // Optional unit label (e.g. "reactions", "preset experiments")
  unit?: string;
  color: string; // tailwind text color class for the icon
}

export interface AchievementState {
  unlocked: Record<string, number>; // achievementId → timestamp unlocked
  // Statistics tracked
  totalReactions: number;
  uniqueReactionsTried: Set<string>; // reaction ids
  uniqueChemicalsUsed: Set<string>; // chemical ids
  totalChemicalsAdded: number;
  totalPrecipitatesFormed: number;
  totalGasesEvolved: number;
  exothermicReactions: number;
  endothermicReactions: number;
  presetExperimentsCompleted: Set<string>; // preset ids
  ppeFullCount: number; // # reactions completed with full PPE
  beakersBroken: number;
  maxTemperature: number;
  minTemperature: number;
  sessionsPlayed: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Firsts
  {
    id: "first-reaction",
    title: "First Reaction",
    description: "Trigger your very first chemical reaction",
    category: "firsts",
    icon: "🧪",
    color: "text-emerald-400",
  },
  {
    id: "first-precipitate",
    title: "Precipitate Pioneer",
    description: "Form your first precipitate",
    category: "firsts",
    icon: "💎",
    color: "text-purple-400",
  },
  {
    id: "first-gas",
    title: "Gas Evolution",
    description: "Witness gas evolve from a reaction",
    category: "firsts",
    icon: "💨",
    color: "text-teal-400",
  },
  {
    id: "first-exothermic",
    title: "Feeling the Heat",
    description: "Trigger an exothermic reaction (ΔT > +20°C)",
    category: "firsts",
    icon: "🔥",
    color: "text-red-400",
  },
  {
    id: "first-endothermic",
    title: "Cold Snap",
    description: "Trigger an endothermic reaction (ΔT < 0°C)",
    category: "firsts",
    icon: "❄️",
    color: "text-cyan-400",
  },
  {
    id: "first-preset",
    title: "Guided Apprentice",
    description: "Complete your first preset experiment",
    category: "firsts",
    icon: "📋",
    color: "text-amber-400",
  },
  // Reactions — cumulative
  {
    id: "reactions-5",
    title: "Lab Novice",
    description: "Complete 5 total reactions",
    category: "reactions",
    icon: "⚡",
    threshold: 5,
    unit: "reactions",
    color: "text-yellow-400",
  },
  {
    id: "reactions-25",
    title: "Lab Adept",
    description: "Complete 25 total reactions",
    category: "reactions",
    icon: "🔋",
    threshold: 25,
    unit: "reactions",
    color: "text-orange-400",
  },
  {
    id: "reactions-100",
    title: "Lab Master",
    description: "Complete 100 total reactions",
    category: "reactions",
    icon: "👑",
    threshold: 100,
    unit: "reactions",
    color: "text-amber-400",
  },
  // Discovery
  {
    id: "discovery-5-reactions",
    title: "Curious Mind",
    description: "Try 5 different unique reactions",
    category: "discovery",
    icon: "🔬",
    threshold: 5,
    unit: "unique reactions",
    color: "text-cyan-400",
  },
  {
    id: "discovery-15-reactions",
    title: "Reaction Explorer",
    description: "Try 15 different unique reactions",
    category: "discovery",
    icon: "🧭",
    threshold: 15,
    unit: "unique reactions",
    color: "text-blue-400",
  },
  {
    id: "discovery-all-types",
    title: "Renaissance Chemist",
    description: "Trigger 7 different unique reactions (covering major reaction types)",
    category: "discovery",
    icon: "🌐",
    color: "text-purple-400",
  },
  // Mastery
  {
    id: "mastery-pour",
    title: "Steady Hand",
    description: "Successfully pour between beakers",
    category: "mastery",
    icon: "💧",
    color: "text-amber-400",
  },
  {
    id: "mastery-heat",
    title: "Master of Flame",
    description: "Heat a beaker to its boiling point",
    category: "mastery",
    icon: "🔥",
    color: "text-red-400",
  },
  {
    id: "mastery-ph-strip",
    title: "pH Detective",
    description: "Use the pH test strip to measure acidity",
    category: "mastery",
    icon: "📜",
    color: "text-pink-400",
  },
  {
    id: "mastery-container-types",
    title: "Glassware Collector",
    description: "Try all 4 container types (Beaker, Erlenmeyer, Test Tube, Round Flask)",
    category: "mastery",
    icon: "⚗️",
    color: "text-emerald-400",
  },
  // Safety
  {
    id: "safety-full-ppe",
    title: "Safety First",
    description: "Equip all 4 pieces of PPE",
    category: "safety",
    icon: "🦺",
    color: "text-yellow-400",
  },
  {
    id: "safety-broke-beaker",
    title: "OOPS!",
    description: "Break a beaker from thermal shock",
    category: "safety",
    icon: "💥",
    hidden: true,
    color: "text-red-400",
  },
  {
    id: "safety-10-safe-reactions",
    title: "Careful Chemist",
    description: "Complete 10 reactions without breaking any glass",
    category: "safety",
    icon: "🛡️",
    threshold: 10,
    unit: "safe reactions",
    color: "text-emerald-400",
  },
  // Presets
  {
    id: "presets-3",
    title: "Recipe Follower",
    description: "Complete 3 preset experiments",
    category: "presets",
    icon: "📚",
    threshold: 3,
    unit: "presets",
    color: "text-amber-400",
  },
  {
    id: "presets-all",
    title: "Curriculum Complete",
    description: "Complete all 8 preset experiments",
    category: "presets",
    icon: "🎓",
    threshold: 8,
    unit: "presets",
    color: "text-purple-400",
  },
];

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  firsts: "First Steps",
  reactions: "Cumulative",
  discovery: "Discovery",
  mastery: "Mastery",
  safety: "Safety",
  presets: "Presets",
};

export const ACHIEVEMENT_CATEGORY_COLORS: Record<AchievementCategory, string> = {
  firsts: "from-emerald-500/20 to-emerald-700/10 border-emerald-500/30",
  reactions: "from-amber-500/20 to-amber-700/10 border-amber-500/30",
  discovery: "from-cyan-500/20 to-cyan-700/10 border-cyan-500/30",
  mastery: "from-purple-500/20 to-purple-700/10 border-purple-500/30",
  safety: "from-yellow-500/20 to-yellow-700/10 border-yellow-500/30",
  presets: "from-rose-500/20 to-rose-700/10 border-rose-500/30",
};

const STORAGE_KEY = "molecular-sandbox-achievements";

// Load saved progress from localStorage
export function loadAchievementState(): AchievementState {
  if (typeof window === "undefined") {
    return makeDefaultState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultState();
    const parsed = JSON.parse(raw);
    return {
      ...makeDefaultState(),
      ...parsed,
      uniqueReactionsTried: new Set(parsed.uniqueReactionsTried || []),
      uniqueChemicalsUsed: new Set(parsed.uniqueChemicalsUsed || []),
      presetExperimentsCompleted: new Set(parsed.presetExperimentsCompleted || []),
      unlocked: parsed.unlocked || {},
    };
  } catch {
    return makeDefaultState();
  }
}

function makeDefaultState(): AchievementState {
  return {
    unlocked: {},
    totalReactions: 0,
    uniqueReactionsTried: new Set<string>(),
    uniqueChemicalsUsed: new Set<string>(),
    totalChemicalsAdded: 0,
    totalPrecipitatesFormed: 0,
    totalGasesEvolved: 0,
    exothermicReactions: 0,
    endothermicReactions: 0,
    presetExperimentsCompleted: new Set<string>(),
    ppeFullCount: 0,
    beakersBroken: 0,
    maxTemperature: 25,
    minTemperature: 25,
    sessionsPlayed: 1,
  };
}

export function saveAchievementState(state: AchievementState): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = {
      ...state,
      uniqueReactionsTried: Array.from(state.uniqueReactionsTried),
      uniqueChemicalsUsed: Array.from(state.uniqueChemicalsUsed),
      presetExperimentsCompleted: Array.from(state.presetExperimentsCompleted),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // ignore quota errors
  }
}

export interface AchievementCheckResult {
  state: AchievementState;
  newlyUnlocked: Achievement[];
}

// Check which achievements should be unlocked given the current state.
// Also takes "context" describing what just happened so we can check thresholds.
export interface AchievementContext {
  reactionType?: string;
  presetId?: string;
  ppeWorn?: { goggles: boolean; gloves: boolean; labCoat: boolean; mask: boolean };
  containerTypesUsed?: string[];
  justHeatedToBoiling?: boolean;
  justUsedPHStrip?: boolean;
  justPoured?: boolean;
  justBrokeBeaker?: boolean;
}

export function checkAchievements(
  prev: AchievementState,
  ctx: AchievementContext = {}
): AchievementCheckResult {
  const state: AchievementState = {
    ...prev,
    uniqueReactionsTried: new Set(prev.uniqueReactionsTried),
    uniqueChemicalsUsed: new Set(prev.uniqueChemicalsUsed),
    presetExperimentsCompleted: new Set(prev.presetExperimentsCompleted),
    unlocked: { ...prev.unlocked },
  };

  const newlyUnlocked: Achievement[] = [];
  const unlock = (a: Achievement) => {
    if (!state.unlocked[a.id]) {
      state.unlocked[a.id] = Date.now();
      newlyUnlocked.push(a);
    }
  };

  for (const a of ACHIEVEMENTS) {
    if (state.unlocked[a.id]) continue;
    let condition = false;
    switch (a.id) {
      case "first-reaction":
        condition = state.totalReactions >= 1;
        break;
      case "first-precipitate":
        condition = state.totalPrecipitatesFormed >= 1;
        break;
      case "first-gas":
        condition = state.totalGasesEvolved >= 1;
        break;
      case "first-exothermic":
        condition = state.exothermicReactions >= 1;
        break;
      case "first-endothermic":
        condition = state.endothermicReactions >= 1;
        break;
      case "first-preset":
        condition = state.presetExperimentsCompleted.size >= 1;
        break;
      case "reactions-5":
        condition = state.totalReactions >= 5;
        break;
      case "reactions-25":
        condition = state.totalReactions >= 25;
        break;
      case "reactions-100":
        condition = state.totalReactions >= 100;
        break;
      case "discovery-5-reactions":
        condition = state.uniqueReactionsTried.size >= 5;
        break;
      case "discovery-15-reactions":
        condition = state.uniqueReactionsTried.size >= 15;
        break;
      case "discovery-all-types":
        condition = state.uniqueReactionsTried.size >= 7;
        break;
      case "mastery-pour":
        condition = !!ctx.justPoured;
        break;
      case "mastery-heat":
        condition = !!ctx.justHeatedToBoiling;
        break;
      case "mastery-ph-strip":
        condition = !!ctx.justUsedPHStrip;
        break;
      case "mastery-container-types":
        condition = (ctx.containerTypesUsed?.length || 0) >= 4;
        break;
      case "safety-full-ppe":
        if (ctx.ppeWorn) {
          condition =
            ctx.ppeWorn.goggles &&
            ctx.ppeWorn.gloves &&
            ctx.ppeWorn.labCoat &&
            ctx.ppeWorn.mask;
        }
        break;
      case "safety-broke-beaker":
        condition = state.beakersBroken >= 1 || !!ctx.justBrokeBeaker;
        break;
      case "safety-10-safe-reactions":
        condition = state.totalReactions >= 10 && state.beakersBroken === 0;
        break;
      case "presets-3":
        condition = state.presetExperimentsCompleted.size >= 3;
        break;
      case "presets-all":
        condition = state.presetExperimentsCompleted.size >= 8;
        break;
    }
    if (condition) unlock(a);
  }

  return { state, newlyUnlocked };
}
