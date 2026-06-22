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
  selectContainer: (id: string | null) => void;
  setHoveredContainer: (id: string | null) => void;

  // Actions — chemicals
  selectChemical: (id: string | null) => void;
  setDragVolume: (volume: number) => void;

  // Actions — pouring
  startPour: (sourceId: string, targetId: string) => void;
  updatePourProgress: (progress: number) => void;
  completePour: () => void;
  cancelPour: () => void;

  // Actions — chemical manipulation
  addChemicalToContainer: (
    containerId: string,
    chemicalId: string,
    volume: number
  ) => void;
  emptyContainer: (containerId: string) => void;
  setContainerHeating: (containerId: string, isHeating: boolean) => void;

  // Actions — reaction
  processReaction: (containerId: string, result: ReactionResult) => void;
  triggerReaction: (containerId: string) => void;

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
  },
];

export const useLabStore = create<LabStore>((set, get) => ({
  chemicals: [],
  reactions: [],
  containers: defaultContainers,
  chemicalsMap: new Map(),

  selectedContainerId: null,
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

  selectContainer: (id) => set({ selectedContainerId: id }),
  setHoveredContainer: (id) => set({ hoveredContainerId: id }),

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

  addChemicalToContainer: (containerId, chemicalId, volume) => {
    const state = get();
    const chem = state.chemicalsMap.get(chemicalId);
    if (!chem) return;

    let moles: number;
    if (chem.stateAtSTP === "solid" || chem.category === "metal") {
      moles = (volume * chem.density) / chem.molarMass;
    } else {
      moles = volumeToMoles(volume, chem);
    }

    set({
      containers: state.containers.map((c) => {
        if (c.id !== containerId) return c;
        const existing = c.contents.find((cc) => cc.chemicalId === chemicalId);
        let newContents: ContainerContent[];
        if (existing) {
          newContents = c.contents.map((cc) =>
            cc.chemicalId === chemicalId
              ? { ...cc, volume: cc.volume + volume, moles: cc.moles + moles }
              : cc
          );
        } else {
          newContents = [...c.contents, { chemicalId, volume, moles }];
        }
        return { ...c, contents: newContents };
      }),
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
  },

  emptyContainer: (containerId) =>
    set((state) => ({
      containers: state.containers.map((c) =>
        c.id === containerId
          ? { ...c, contents: [], temperature: 25, isHeating: false }
          : c
      ),
    })),

  setContainerHeating: (containerId, isHeating) =>
    set((state) => ({
      containers: state.containers.map((c) =>
        c.id === containerId ? { ...c, isHeating } : c
      ),
    })),

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
        return {
          ...c,
          contents: newContents,
          temperature: newTemp,
        };
      }),
      lastReactionResult: result,
      activeReaction: result.reaction,
      showReactionInfo: true,
    });

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
        if (allLiquid) {
          precipitateFormed = true;
          precipitateChemicalId = product.chemicalId;
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

  resetLab: () =>
    set({
      containers: defaultContainers,
      selectedContainerId: null,
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
    }),
}));
