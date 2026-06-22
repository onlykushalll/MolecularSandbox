// Zustand store for The Molecular Sandbox lab state
import { create } from "zustand";
import type {
  ChemicalData,
  ReactionData,
  ContainerState,
  ContainerContent,
  ReactionResult,
  SafetyAlert,
  JournalEntry,
} from "@/lib/chemistry/types";
import { volumeToMoles, molesToVolume } from "@/lib/chemistry/mixture";
import { checkSolubility, getPrecipitateColor } from "@/lib/chemistry/solubility";
import { getSoundManager } from "@/lib/sound/sound-manager";

interface PPEState {
  goggles: boolean;
  gloves: boolean;
  labCoat: boolean;
  mask: boolean;
}

interface LabStore {
  // Core data
  chemicals: ChemicalData[];
  reactions: ReactionData[];
  containers: ContainerState[];
  chemicalsMap: Map<string, ChemicalData>;

  // Selection
  selectedContainerId: string | null;
  secondaryContainerId: string | null;
  selectedChemicalId: string | null;
  hoveredContainerId: string | null;

  // Pouring
  isPouring: boolean;
  pourSourceId: string | null;
  pourTargetId: string | null;
  pourProgress: number;

  // Drag & drop
  isDragging: boolean;
  draggedChemicalId: string | null;
  dragVolume: number;

  // Safety
  ppeWorn: PPEState;
  safetyAlerts: SafetyAlert[];

  // UI panels
  showChemicalShelf: boolean;
  showInstrumentPanel: boolean;
  showLabJournal: boolean;
  showSafetyPanel: boolean;
  showReactionInfo: boolean;
  activeReaction: ReactionData | null;
  lastReactionResult: ReactionResult | null;

  // Reaction progress (animation)
  reactingContainerId: string | null;
  reactionProgress: number; // 0..1, decays after reaction

  // pH strip mode — when ON, a 3D paper strip appears in selected beaker
  showPHStrip: boolean;

  // Audio
  soundEnabled: boolean;

  // Glass breaking — tracks the moment a beaker breaks (for VFX)
  lastBrokenAt: number | null;
  lastBrokenContainerId: string | null;

  // Journal
  journalEntries: JournalEntry[];

  // Camera
  cameraTarget: [number, number, number] | null;

  // Actions — initialization
  initializeLab: (
    chemicals: ChemicalData[],
    reactions: ReactionData[],
    containers: ContainerState[]
  ) => void;

  // Actions — containers
  addContainer: (container: ContainerState) => void;
  removeContainer: (id: string) => void;
  updateContainer: (id: string, updates: Partial<ContainerState>) => void;
  selectContainer: (id: string | null, additive?: boolean) => void;
  setHoveredContainer: (id: string | null) => void;
  setContainerType: (id: string, containerType: import("@/lib/chemistry/types").ContainerType) => void;

  // Actions — chemicals
  selectChemical: (id: string | null) => void;
  setDragVolume: (volume: number) => void;

  // Actions — pouring
  startPour: (sourceId: string, targetId: string) => void;
  updatePourProgress: (progress: number) => void;
  completePour: () => void;
  cancelPour: () => void;
  startPourAnimation: (sourceId: string, targetId: string) => void;

  // Actions — chemical manipulation
  addChemicalToContainer: (
    containerId: string,
    chemicalId: string,
    volume: number,
    autoReact?: boolean
  ) => void;
  emptyContainer: (containerId: string) => void;
  setContainerHeating: (containerId: string, isHeating: boolean) => void;
  heatingTick: () => void;

  // Actions — reaction
  processReaction: (containerId: string, result: ReactionResult) => void;
  triggerReaction: (containerId: string) => void;
  setReactionProgress: (progress: number) => void;

  // Actions — safety
  togglePPE: (type: keyof PPEState) => void;
  addSafetyAlert: (alert: SafetyAlert) => void;
  clearSafetyAlerts: () => void;
  dismissSafetyAlert: (index: number) => void;

  // Actions — UI
  toggleChemicalShelf: () => void;
  toggleInstrumentPanel: () => void;
  toggleLabJournal: () => void;
  toggleSafetyPanel: () => void;
  setCameraTarget: (target: [number, number, number] | null) => void;
  togglePHStrip: () => void;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;

  // Actions — journal
  addJournalEntry: (
    text: string,
    reaction?: string,
    equation?: string,
    temperatureChange?: number
  ) => void;
  clearJournal: () => void;

  // Actions — drag
  setDragging: (isDragging: boolean, chemicalId?: string | null) => void;

  // Reset
  resetLab: () => void;
}

const defaultContainers: ContainerState[] = [
  {
    id: "beaker-1",
    type: "beaker",
    position: [-1.8, 0, 0],
    rotation: [0, 0, 0],
    capacity: 250,
    contents: [],
    temperature: 25,
    pressure: 101.325,
    isHeating: false,
    isBroken: false,
    precipitate: null,
    gasEmitting: null,
  },
  {
    id: "beaker-2",
    type: "beaker",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    capacity: 400,
    contents: [],
    temperature: 25,
    pressure: 101.325,
    isHeating: false,
    isBroken: false,
    precipitate: null,
    gasEmitting: null,
  },
  {
    id: "beaker-3",
    type: "beaker",
    position: [1.8, 0, 0],
    rotation: [0, 0, 0],
    capacity: 250,
    contents: [],
    temperature: 25,
    pressure: 101.325,
    isHeating: false,
    isBroken: false,
    precipitate: null,
    gasEmitting: null,
  },
];

export const useLabStore = create<LabStore>((set, get) => ({
  chemicals: [],
  reactions: [],
  containers: defaultContainers,
  chemicalsMap: new Map(),

  selectedContainerId: null,
  secondaryContainerId: null,
  selectedChemicalId: null,
  hoveredContainerId: null,

  isPouring: false,
  pourSourceId: null,
  pourTargetId: null,
  pourProgress: 0,

  isDragging: false,
  draggedChemicalId: null,
  dragVolume: 50,

  ppeWorn: {
    goggles: true,
    gloves: true,
    labCoat: true,
    mask: false,
  },
  safetyAlerts: [],

  showChemicalShelf: true,
  showInstrumentPanel: true,
  showLabJournal: false,
  showSafetyPanel: false,
  showReactionInfo: false,
  activeReaction: null,
  lastReactionResult: null,

  reactingContainerId: null,
  reactionProgress: 0,

  showPHStrip: false,
  soundEnabled: true,
  lastBrokenAt: null,
  lastBrokenContainerId: null,

  journalEntries: [],

  cameraTarget: null,

  initializeLab: (chemicals, reactions, containers) => {
    const map = new Map(chemicals.map((c) => [c.id, c]));
    set({
      chemicals,
      reactions,
      chemicalsMap: map,
      containers: containers.length > 0 ? containers : defaultContainers,
    });
  },

  addContainer: (container) =>
    set((state) => ({ containers: [...state.containers, container] })),

  removeContainer: (id) =>
    set((state) => ({
      containers: state.containers.filter((c) => c.id !== id),
      selectedContainerId:
        state.selectedContainerId === id ? null : state.selectedContainerId,
    })),

  updateContainer: (id, updates) =>
    set((state) => ({
      containers: state.containers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  selectContainer: (id, additive = false) =>
    set((state) => {
      if (additive && id && state.selectedContainerId && state.selectedContainerId !== id) {
        // Shift-click: set secondary (for pour target)
        return { secondaryContainerId: id };
      }
      if (additive && id && state.selectedContainerId === id) {
        // Shift-click same beaker: deselect secondary
        return { secondaryContainerId: null };
      }
      return { selectedContainerId: id, secondaryContainerId: null };
    }),
  setHoveredContainer: (id) => set({ hoveredContainerId: id }),

  setContainerType: (id, containerType) =>
    set((state) => ({
      containers: state.containers.map((c) =>
        c.id === id ? { ...c, type: containerType } : c
      ),
    })),

  selectChemical: (id) => set({ selectedChemicalId: id }),
  setDragVolume: (volume) => set({ dragVolume: volume }),

  startPour: (sourceId, targetId) =>
    set({
      isPouring: true,
      pourSourceId: sourceId,
      pourTargetId: targetId,
      pourProgress: 0,
    }),

  updatePourProgress: (progress) => set({ pourProgress: progress }),

  completePour: () => {
    const state = get();
    if (!state.pourSourceId || !state.pourTargetId) return;
    const source = state.containers.find((c) => c.id === state.pourSourceId);
    const target = state.containers.find((c) => c.id === state.pourTargetId);
    if (!source || !target) return;

    const totalSourceVolume = source.contents.reduce((s, c) => s + c.volume, 0);
    const transferVolume = Math.min(30, totalSourceVolume);
    if (transferVolume <= 0) {
      set({ isPouring: false, pourSourceId: null, pourTargetId: null, pourProgress: 0 });
      return;
    }

    const newSourceContents: ContainerContent[] = [];
    const newTargetContents = [...target.contents];

    for (const content of source.contents) {
      const ratio = totalSourceVolume > 0 ? transferVolume / totalSourceVolume : 0;
      const transferredVolume = content.volume * ratio;
      const transferredMoles = content.moles * ratio;
      const remainingVolume = content.volume - transferredVolume;
      const remainingMoles = content.moles - transferredMoles;

      if (remainingVolume > 0.01) {
        newSourceContents.push({
          chemicalId: content.chemicalId,
          volume: remainingVolume,
          moles: remainingMoles,
        });
      }

      const existing = newTargetContents.find(
        (c) => c.chemicalId === content.chemicalId
      );
      if (existing) {
        existing.volume += transferredVolume;
        existing.moles += transferredMoles;
      } else {
        newTargetContents.push({
          chemicalId: content.chemicalId,
          volume: transferredVolume,
          moles: transferredMoles,
        });
      }
    }

    set({
      containers: state.containers.map((c) => {
        if (c.id === source.id) return { ...c, contents: newSourceContents };
        if (c.id === target.id) return { ...c, contents: newTargetContents };
        return c;
      }),
      isPouring: false,
      pourSourceId: null,
      pourTargetId: null,
      pourProgress: 0,
    });
  },

  cancelPour: () =>
    set({
      isPouring: false,
      pourSourceId: null,
      pourTargetId: null,
      pourProgress: 0,
    }),

  startPourAnimation: (sourceId, targetId) => {
    const state = get();
    const source = state.containers.find((c) => c.id === sourceId);
    if (!source) return;
    const totalSourceVolume = source.contents.reduce((s, c) => s + c.volume, 0);
    if (totalSourceVolume <= 0) return;
    // Play pour sound
    if (get().soundEnabled) getSoundManager().play("pour");
    // Torricelli's theorem: v = √(2gh) → flow rate proportional to √height
    // Use a 2-second animation for visual clarity
    get().startPour(sourceId, targetId);
    const startTime = Date.now();
    const duration = 2000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      get().updatePourProgress(progress);
      if (progress >= 1) {
        clearInterval(interval);
        get().completePour();
      }
    }, 50);
  },

  addChemicalToContainer: (containerId, chemicalId, volume, autoReact = false) => {
    const state = get();
    const chem = state.chemicalsMap.get(chemicalId);
    if (!chem) return;

    let moles: number;
    if (chem.stateAtSTP === "solid" || chem.category === "metal") {
      moles = (volume * chem.density) / chem.molarMass;
    } else {
      moles = volumeToMoles(volume, chem);
    }

    // Find the container and calculate new contents
    const container = state.containers.find((c) => c.id === containerId);
    if (!container) return;

    const existing = container.contents.find((cc) => cc.chemicalId === chemicalId);
    let newContents: ContainerContent[];
    if (existing) {
      newContents = container.contents.map((cc) =>
        cc.chemicalId === chemicalId
          ? { ...cc, volume: cc.volume + volume, moles: cc.moles + moles }
          : cc
      );
    } else {
      newContents = [...container.contents, { chemicalId, volume, moles }];
    }

    set({
      containers: state.containers.map((c) =>
        c.id === containerId ? { ...c, contents: newContents } : c
      ),
    });

    // Check for safety alerts
    const hazards = chem.hazards;
    if (hazards.includes("corrosive") || hazards.includes("toxic")) {
      const ppe = get().ppeWorn;
      if (!ppe.goggles || !ppe.gloves) {
        get().addSafetyAlert({
          type: "corrosive",
          message: `${chem.name} is ${hazards.includes("corrosive") ? "corrosive" : "toxic"}! Wear PPE.`,
          severity: "danger",
        });
      }
    }

    // Play drop sound
    if (get().soundEnabled) {
      getSoundManager().play("drop");
    }

    // Auto-trigger reaction if enabled and a matching reaction exists
    if (autoReact) {
      const presentIds = new Set(newContents.map((c) => c.chemicalId));
      const matchingReaction = state.reactions.find((r) =>
        r.reactants.every((rr) => presentIds.has(rr.chemicalId))
      );
      if (matchingReaction) {
        // Slight delay for visual feedback
        setTimeout(() => {
          get().triggerReaction(containerId);
        }, 300);
      }
    }
  },

  emptyContainer: (containerId) =>
    set((state) => ({
      containers: state.containers.map((c) =>
        c.id === containerId
          ? { ...c, contents: [], temperature: 25, isHeating: false, precipitate: null, gasEmitting: null, lastReactionAt: undefined }
          : c
      ),
    })),

  setContainerHeating: (containerId, isHeating) => {
    const state = get();
    const container = state.containers.find((c) => c.id === containerId);
    // Don't allow heating a broken beaker
    if (isHeating && container?.isBroken) return;
    set((s) => ({
      containers: s.containers.map((c) =>
        c.id === containerId ? { ...c, isHeating } : c
      ),
    }));
    // Manage hiss sound (Bunsen burner)
    const sm = getSoundManager();
    if (isHeating) {
      if (get().soundEnabled) sm.startHiss();
      if (get().soundEnabled) sm.startBubbling();
    } else {
      // Only stop if no other beaker is heating
      const stillHeating = get().containers.some((c) => c.id !== containerId && c.isHeating);
      if (!stillHeating) {
        sm.stopHiss();
        sm.stopBubbling();
      }
    }
  },

  heatingTick: () => {
    const state = get();
    let changed = false;
    let brokenNow = false;
    let brokenContainerId: string | null = null;
    const newContainers = state.containers.map((c) => {
      // Decay gas emission intensity over time
      let gasEmitting = c.gasEmitting;
      if (gasEmitting) {
        const newIntensity = gasEmitting.intensity - 0.05;
        if (newIntensity <= 0) {
          gasEmitting = null;
          changed = true;
        } else if (newIntensity !== gasEmitting.intensity) {
          gasEmitting = { ...gasEmitting, intensity: newIntensity };
          changed = true;
        }
      }

      if (!c.isHeating || c.contents.length === 0) {
        // Cool down slowly when not heating
        if (c.temperature > 25.5) {
          changed = true;
          return { ...c, temperature: Math.max(25, c.temperature - 0.3), gasEmitting };
        }
        return gasEmitting !== c.gasEmitting ? { ...c, gasEmitting } : c;
      }
      // Calculate boiling point cap — only LIQUID contents contribute (solids don't boil)
      const liquidBoilingPoints = c.contents.map((cc) => {
        const chem = state.chemicalsMap.get(cc.chemicalId);
        if (!chem) return 100;
        if (chem.stateAtSTP === "liquid") return chem.boilingPoint;
        return 100; // non-liquids default to water-like
      });
      const maxBP = Math.max(...liquidBoilingPoints, 100);
      // Heat up — rate depends on volume (smaller heats faster)
      const totalVolume = c.contents.reduce((s, cc) => s + cc.volume, 0);
      const heatRate = Math.max(0.5, 3 - totalVolume / 100);
      const prevTemp = c.temperature;
      const newTemp = Math.min(c.temperature + heatRate, maxBP + 5);
      if (newTemp !== c.temperature) changed = true;

      // Thermal shock detection — rapid temperature rise > 60°C in one tick
      // (heatingTick runs every 500ms, so this is a very fast spike)
      if (!c.isBroken && prevTemp < 50 && newTemp - prevTemp >= 25 && totalVolume > 30) {
        // Glass breaks on extreme thermal shock (rare but possible)
        // Only trigger if temperature delta is dramatic AND beaker has substantial liquid mass
        if (newTemp > 80 && Math.random() < 0.15) {
          brokenNow = true;
          brokenContainerId = c.id;
          changed = true;
          return {
            ...c,
            temperature: newTemp,
            isBroken: true,
            isHeating: false,
            gasEmitting,
          };
        }
      }

      // Evaporate a small amount when at boiling
      let newContents = c.contents;
      if (newTemp >= maxBP - 1) {
        newContents = c.contents
          .map((cc) => {
            const chem = state.chemicalsMap.get(cc.chemicalId);
            if (!chem) return cc;
            // Evaporate liquids at boiling point
            if (chem.stateAtSTP === "liquid" && chem.boilingPoint <= newTemp + 1) {
              const evapVolume = Math.min(0.5, cc.volume);
              const evapMoles = (evapVolume / cc.volume) * cc.moles;
              return {
                chemicalId: cc.chemicalId,
                volume: cc.volume - evapVolume,
                moles: cc.moles - evapMoles,
              };
            }
            return cc;
          })
          .filter((cc) => cc.volume > 0.1);
      }
      return { ...c, temperature: newTemp, contents: newContents, gasEmitting };
    });
    if (changed) set({ containers: newContainers });

    // If a beaker broke this tick, play breaking sound + alert
    if (brokenNow && brokenContainerId) {
      const sm = getSoundManager();
      if (get().soundEnabled) sm.play("break");
      sm.stopHiss();
      sm.stopBubbling();
      get().addSafetyAlert({
        type: "explosion",
        message: `💥 ${brokenContainerId.toUpperCase()} broke from thermal shock!`,
        severity: "danger",
      });
      set({ lastBrokenAt: Date.now(), lastBrokenContainerId: brokenContainerId });
    }
  },

  processReaction: (containerId, result) => {
    const state = get();
    set({
      containers: state.containers.map((c) => {
        if (c.id !== containerId) return c;
        let newContents = c.contents.map((content) => {
          const consumed = result.reactantsConsumed.find(
            (r) => r.chemicalId === content.chemicalId
          );
          if (consumed) {
            const chem = state.chemicalsMap.get(content.chemicalId);
            const consumedVolume = chem
              ? (consumed.moles * chem.molarMass) / chem.density
              : 0;
            return {
              chemicalId: content.chemicalId,
              volume: Math.max(0, content.volume - consumedVolume),
              moles: Math.max(0, content.moles - consumed.moles),
            };
          }
          return content;
        }).filter((c) => c.moles > 0.0001);

        for (const product of result.productsProduced) {
          const chem = state.chemicalsMap.get(product.chemicalId);
          if (!chem) continue;
          if (chem.stateAtSTP === "gas") {
            continue;
          }
          // Solids that form from liquid/aqueous reactions become precipitate — settle at bottom
          if (chem.stateAtSTP === "solid" && result.precipitateFormed) {
            // Tracked separately as precipitate, not in liquid contents
            continue;
          }
          const volume = product.volume || molesToVolume(product.moles, chem);
          const existing = newContents.find(
            (cc) => cc.chemicalId === product.chemicalId
          );
          if (existing) {
            existing.volume += volume;
            existing.moles += product.moles;
          } else {
            newContents.push({
              chemicalId: product.chemicalId,
              volume,
              moles: product.moles,
            });
          }
        }

        const newTemp = c.temperature + result.temperatureChange;
        // Cap temperature at the boiling point of the mixture
        // Only consider LIQUID contents for the cap (solids don't boil away)
        const liquidBoilingPoints = c.contents
          .concat(newContents)
          .map((cc) => {
            const chem = state.chemicalsMap.get(cc.chemicalId);
            if (!chem) return 100;
            // Only liquids contribute to boiling point cap
            if (chem.stateAtSTP === "liquid") return chem.boilingPoint;
            return 100; // default water-like for non-liquids
          });
        const maxBoilingPoint = Math.max(...liquidBoilingPoints, 100);
        const cappedTemp = Math.min(newTemp, maxBoilingPoint + 5);

        // Track VFX state: only INSOLUBLE solid products become precipitate (solubility rules)
        let precipitate = c.precipitate ? [...c.precipitate] : null;
        if (result.precipitateFormed) {
          if (!precipitate) precipitate = [];
          for (const product of result.productsProduced) {
            const chem = state.chemicalsMap.get(product.chemicalId);
            if (!chem || chem.stateAtSTP !== "solid") continue;
            // Apply solubility rules: only add as precipitate if insoluble
            const sol = checkSolubility(chem.formula);
            if (sol.solubility === "soluble") continue;
            // Use proper precipitate color (overrides DB hexColor)
            const precipColor = getPrecipitateColor(chem.formula, chem.hexColor);
            const existing = precipitate.find((p) => p.chemicalId === product.chemicalId);
            if (existing) {
              existing.moles += product.moles;
            } else {
              precipitate.push({
                chemicalId: product.chemicalId,
                moles: product.moles,
                color: precipColor,
              });
            }
          }
        }
        let gasEmitting = c.gasEmitting || null;
        if (result.gasEvolved && result.gasChemicalId) {
          const gchem = state.chemicalsMap.get(result.gasChemicalId);
          gasEmitting = {
            chemicalId: result.gasChemicalId,
            intensity: 1.0,
            color: gchem?.hexColor || "#dddddd",
          };
        }

        return {
          ...c,
          contents: newContents,
          temperature: cappedTemp,
          precipitate,
          gasEmitting,
          lastReactionAt: Date.now(),
        };
      }),
      lastReactionResult: result,
      activeReaction: result.reaction,
      showReactionInfo: true,
      reactingContainerId: containerId,
      reactionProgress: 1,
    });

    // Play reaction sound
    if (get().soundEnabled) {
      const sm = getSoundManager();
      sm.play("reaction");
      if (result.gasEvolved) sm.startBubbling();
    }

    if (result.temperatureChange > 20) {
      get().addSafetyAlert({
        type: "thermal",
        message: `Exothermic reaction! Temperature +${result.temperatureChange.toFixed(1)}°C`,
        severity: result.temperatureChange > 50 ? "danger" : "warning",
      });
    }
    if (result.gasEvolved) {
      get().addSafetyAlert({
        type: "gas",
        message: `Gas evolved — ensure ventilation`,
        severity: "warning",
      });
    }

    get().addJournalEntry(
      `${result.reaction.name}: ${result.molesReacted.toFixed(4)} mol reacted`,
      result.reaction.name,
      result.reaction.equation,
      result.temperatureChange
    );
  },

  setReactionProgress: (progress) =>
    set((state) => ({
      reactionProgress: progress,
      reactingContainerId: progress <= 0 ? null : state.reactingContainerId,
    })),

  triggerReaction: (containerId) => {
    const state = get();
    const container = state.containers.find((c) => c.id === containerId);
    if (!container) return;
    const presentIds = new Set(container.contents.map((c) => c.chemicalId));
    const reaction = state.reactions.find((r) =>
      r.reactants.every((rr) => presentIds.has(rr.chemicalId))
    );
    if (!reaction) return;

    let minPerMole = Infinity;
    let limitingChemId = "";
    for (const reactant of reaction.reactants) {
      const content = container.contents.find((c) => c.chemicalId === reactant.chemicalId);
      const available = content ? content.moles : 0;
      const perMole = available / reactant.coefficient;
      if (perMole < minPerMole) {
        minPerMole = perMole;
        limitingChemId = reactant.chemicalId;
      }
    }
    const molesReacted = minPerMole === Infinity ? 0 : minPerMole;
    if (molesReacted <= 0) return;

    const productsProduced = reaction.products.map((p) => {
      const chem = state.chemicalsMap.get(p.chemicalId);
      const moles = molesReacted * p.coefficient;
      const volume = chem ? molesToVolume(moles, chem) : undefined;
      return { chemicalId: p.chemicalId, moles, volume };
    });

    const reactantsConsumed = reaction.reactants.map((r) => ({
      chemicalId: r.chemicalId,
      moles: molesReacted * r.coefficient,
    }));

    const totalMass = container.contents.reduce((sum, content) => {
      const chem = state.chemicalsMap.get(content.chemicalId);
      if (!chem) return sum;
      const mass =
        chem.stateAtSTP === "liquid"
          ? content.volume * chem.density
          : content.moles * chem.molarMass;
      return sum + mass;
    }, 0);
    const avgSpecificHeat =
      container.contents.reduce((sum, content) => {
        const chem = state.chemicalsMap.get(content.chemicalId);
        if (!chem) return sum;
        const mass =
          chem.stateAtSTP === "liquid"
            ? content.volume * chem.density
            : content.moles * chem.molarMass;
        return sum + mass * chem.specificHeatCapacity;
      }, 0) / Math.max(1, totalMass);

    const heatReleased = reaction.deltaH * molesReacted;
    const temperatureChange =
      totalMass > 0 && avgSpecificHeat > 0
        ? (-reaction.deltaH * 1000 * molesReacted) / (totalMass * avgSpecificHeat)
        : 0;

    let gasEvolved = false;
    let gasChemicalId: string | undefined;
    let precipitateFormed = false;
    let precipitateChemicalId: string | undefined;
    for (const product of productsProduced) {
      const chem = state.chemicalsMap.get(product.chemicalId);
      if (!chem) continue;
      if (chem.stateAtSTP === "gas") {
        gasEvolved = true;
        gasChemicalId = product.chemicalId;
      }
      if (chem.stateAtSTP === "solid") {
        const allLiquid = reaction.reactants.every((r) => {
          const rc = state.chemicalsMap.get(r.chemicalId);
          return rc && (rc.stateAtSTP === "liquid" || rc.stateAtSTP === "solid");
        });
        // Use solubility rules: only insoluble solids count as precipitates
        if (allLiquid) {
          const sol = checkSolubility(chem.formula);
          if (sol.solubility !== "soluble") {
            precipitateFormed = true;
            precipitateChemicalId = product.chemicalId;
          }
        }
      }
    }

    const result: ReactionResult = {
      reaction,
      molesReacted,
      limitingReagent: limitingChemId,
      temperatureChange,
      productsProduced,
      reactantsConsumed,
      heatReleased,
      isComplete: molesReacted <= 0.001,
      gasEvolved,
      gasChemicalId,
      precipitateFormed,
      precipitateChemicalId,
    };

    get().processReaction(containerId, result);
  },

  togglePPE: (type) =>
    set((state) => ({
      ppeWorn: { ...state.ppeWorn, [type]: !state.ppeWorn[type] },
    })),

  addSafetyAlert: (alert) =>
    set((state) => ({
      safetyAlerts: [...state.safetyAlerts, alert].slice(-10),
    })),

  clearSafetyAlerts: () => set({ safetyAlerts: [] }),

  dismissSafetyAlert: (index) =>
    set((state) => ({
      safetyAlerts: state.safetyAlerts.filter((_, i) => i !== index),
    })),

  toggleChemicalShelf: () =>
    set((state) => ({ showChemicalShelf: !state.showChemicalShelf })),
  toggleInstrumentPanel: () =>
    set((state) => ({ showInstrumentPanel: !state.showInstrumentPanel })),
  toggleLabJournal: () =>
    set((state) => ({ showLabJournal: !state.showLabJournal })),
  toggleSafetyPanel: () =>
    set((state) => ({ showSafetyPanel: !state.showSafetyPanel })),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  togglePHStrip: () => set((state) => ({ showPHStrip: !state.showPHStrip })),
  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    const sm = getSoundManager();
    sm.setMuted(!next);
    if (!next) {
      sm.stopHiss();
      sm.stopBubbling();
    }
  },
  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
    const sm = getSoundManager();
    sm.setMuted(!enabled);
  },

  addJournalEntry: (text, reaction, equation, temperatureChange) =>
    set((state) => ({
      journalEntries: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
          text,
          reaction,
          equation,
          temperatureChange,
        },
        ...state.journalEntries,
      ].slice(0, 50),
    })),

  clearJournal: () => set({ journalEntries: [] }),

  setDragging: (isDragging, chemicalId = null) =>
    set({ isDragging, draggedChemicalId: chemicalId }),

  resetLab: () => {
    // Stop ambient sounds
    const sm = getSoundManager();
    sm.stopHiss();
    sm.stopBubbling();
    if (get().soundEnabled) sm.play("click");
    set({
      containers: defaultContainers,
      selectedContainerId: null,
      secondaryContainerId: null,
      selectedChemicalId: null,
      safetyAlerts: [],
      journalEntries: [],
      isPouring: false,
      pourSourceId: null,
      pourTargetId: null,
      pourProgress: 0,
      lastReactionResult: null,
      activeReaction: null,
      showReactionInfo: false,
      reactingContainerId: null,
      reactionProgress: 0,
      lastBrokenAt: null,
      lastBrokenContainerId: null,
    });
  },
}));
