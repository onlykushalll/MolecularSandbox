/**
 * ZUSTAND STORE — The Molecular Sandbox
 * Central state management for the entire lab simulation
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
export interface SubstanceInfo {
  id: string;
  iupacName: string;
  formula: string;
  molarMass: number;
  density: number;
  boilingPoint: number;
  meltingPoint: number;
  specificHeatCapacity: number;
  stateAt25C: string;
  hexColor: string;
  opacity: number;
  ghsHazards: string;
  riskRating: number;
  surfaceTension: number;
  vaporPressure: number;
  category: string;
  surfaceLuster: string;
  smellDescription: string;
  casNumber: string;
}

export interface ContainerContent {
  substanceId: string;
  massGrams: number;
}

export interface LabContainer {
  id: string;
  name: string;
  type: string;        // beaker, flask, testTube, etc.
  maxVolumeML: number;
  currentVolumeML: number;
  contents: ContainerContent[];
  temperatureK: number;
  isHeated: boolean;
  hasStopper: boolean;
  isBroken: boolean;
}

export type PPESlot = 'goggles' | 'gloves' | 'labCoat';
export type PPEState = Record<PPESlot, boolean>;

export type SafetyState = 'Safe' | 'Warning' | 'Danger' | 'Evacuation';

export interface JournalEntry {
  id: string;
  timestamp: number;
  type: 'addition' | 'reaction' | 'safety' | 'measurement' | 'observation';
  title: string;
  detail: string;
  equation?: string;
  temperatureC?: number;
  deltaH?: number;
}

export interface ReactionResult {
  reactionOccurred: boolean;
  reactionId: string | null;
  reactionType: string | null;
  balancedEquation: string | null;
  reactantsConsumed: Record<string, number>;
  productsFormed: Record<string, number>;
  newContents: Record<string, number>;
  limitingReagent: string | null;
  limitingMoles: number;
  deltaH: number;
  temperatureChangeK: number;
  newTemperatureK: number;
  newVolumeML: number;
  gasEvolved: string;
  gasSubstanceIds: string[];
  pressureKPa: number;
  explosionRisk: boolean;
  safetyWarnings: string[];
  safetyViolations: string[];
  visualEffects: string[];
  precipitationFormed: boolean;
  precipitateColor: string | null;
  colorChange: boolean;
  newColor: string | null;
}

export type LabView = 'lab' | 'mart' | 'journal' | 'prepRoom' | 'database';

export interface LabState {
  // Navigation
  currentView: LabView;
  
  // Substances database (loaded from API)
  substances: SubstanceInfo[];
  substancesLoaded: boolean;

  // Lab containers on the workbench
  containers: LabContainer[];
  selectedContainerId: string | null;
  
  // PPE / Safety
  ppe: PPEState;
  safetyState: SafetyState;
  healthPoints: number;
  maxHealth: number;
  
  // Currently held item
  heldSubstanceId: string | null;
  heldMassGrams: number;
  
  // Active reaction visual state
  activeEffects: string[];
  reactionAnimation: {
    active: boolean;
    type: string;
    color: string;
    intensity: number;
    startTime: number;
  };

  // Journal
  journalEntries: JournalEntry[];
  
  // Economy
  labCredits: number;
  ownedChemicals: Record<string, number>; // substanceId → quantity
  
  // Fume hood
  fumeHoodActive: boolean;

  // Actions
  setCurrentView: (view: LabView) => void;
  setSubstances: (substances: SubstanceInfo[]) => void;
  addContainer: (container: LabContainer) => void;
  removeContainer: (id: string) => void;
  updateContainer: (id: string, updates: Partial<LabContainer>) => void;
  selectContainer: (id: string | null) => void;
  addSubstanceToContainer: (containerId: string, substanceId: string, massGrams: number) => void;
  setPPE: (slot: PPESlot, value: boolean) => void;
  setSafetyState: (state: SafetyState) => void;
  damageHealth: (amount: number) => void;
  healHealth: (amount: number) => void;
  setHeldSubstance: (id: string | null, mass?: number) => void;
  processReactionResult: (result: ReactionResult, containerId: string) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  setLabCredits: (credits: number) => void;
  addOwnedChemical: (id: string, qty: number) => void;
  setActiveEffects: (effects: string[]) => void;
  triggerReactionAnimation: (type: string, color: string, intensity: number) => void;
  clearReactionAnimation: () => void;
  setFumeHoodActive: (active: boolean) => void;
  resetLab: () => void;
}

const initialContainers: LabContainer[] = [
  {
    id: 'beaker-1',
    name: 'Beaker A (250mL)',
    type: 'beaker',
    maxVolumeML: 250,
    currentVolumeML: 0,
    contents: [],
    temperatureK: 298.15,
    isHeated: false,
    hasStopper: false,
    isBroken: false,
  },
  {
    id: 'beaker-2',
    name: 'Beaker B (250mL)',
    type: 'beaker',
    maxVolumeML: 250,
    currentVolumeML: 0,
    contents: [],
    temperatureK: 298.15,
    isHeated: false,
    hasStopper: false,
    isBroken: false,
  },
  {
    id: 'flask-1',
    name: 'Erlenmeyer Flask (250mL)',
    type: 'flask',
    maxVolumeML: 250,
    currentVolumeML: 0,
    contents: [],
    temperatureK: 298.15,
    isHeated: false,
    hasStopper: false,
    isBroken: false,
  },
  {
    id: 'testtube-1',
    name: 'Test Tube 1',
    type: 'testTube',
    maxVolumeML: 20,
    currentVolumeML: 0,
    contents: [],
    temperatureK: 298.15,
    isHeated: false,
    hasStopper: false,
    isBroken: false,
  },
];

export const useLabStore = create<LabState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentView: 'lab',
      substances: [],
      substancesLoaded: false,
      containers: initialContainers,
      selectedContainerId: null,
      ppe: { goggles: false, gloves: false, labCoat: false },
      safetyState: 'Safe',
      healthPoints: 100,
      maxHealth: 100,
      heldSubstanceId: null,
      heldMassGrams: 10,
      activeEffects: [],
      reactionAnimation: { active: false, type: '', color: '', intensity: 0, startTime: 0 },
      journalEntries: [],
      labCredits: 500,
      ownedChemicals: {},
      fumeHoodActive: false,

      // Actions
      setCurrentView: (view) => set({ currentView: view }),

      setSubstances: (substances) => set({ substances, substancesLoaded: true }),

      addContainer: (container) => set((s) => ({ containers: [...s.containers, container] })),
      
      removeContainer: (id) => set((s) => ({
        containers: s.containers.filter((c) => c.id !== id),
        selectedContainerId: s.selectedContainerId === id ? null : s.selectedContainerId,
      })),

      updateContainer: (id, updates) => set((s) => ({
        containers: s.containers.map((c) => c.id === id ? { ...c, ...updates } : c),
      })),

      selectContainer: (id) => set({ selectedContainerId: id }),

      addSubstanceToContainer: (containerId, substanceId, massGrams) => {
        const state = get();
        const container = state.containers.find((c) => c.id === containerId);
        if (!container) return;

        const existing = container.contents.find((c) => c.substanceId === substanceId);
        let newContents: ContainerContent[];
                
        if (existing) {
          newContents = container.contents.map((c) =>
            c.substanceId === substanceId ? { ...c, massGrams: c.massGrams + massGrams } : c
          );
        } else {
          newContents = [...container.contents, { substanceId, massGrams }];
        }

        // Calculate new volume
        const substance = state.substances.find((s) => s.id === substanceId);
        let volumeAddition = 0;
        if (substance) {
          if (substance.stateAt25C === 'Liquid') {
            volumeAddition = massGrams / (substance.density || 1);
          } else if (substance.stateAt25C === 'Solid') {
            volumeAddition = massGrams / (substance.density || 1) * 0.6; // Solids displace ~60%
          }
        }

        set((s) => ({
          containers: s.containers.map((c) =>
            c.id === containerId
              ? { ...c, contents: newContents, currentVolumeML: Math.min(c.maxVolumeML, c.currentVolumeML + volumeAddition) }
              : c
          ),
        }));

        // Add journal entry
        const sub = state.substances.find((s) => s.id === substanceId);
        if (sub) {
          get().addJournalEntry({
            type: 'addition',
            title: `Added ${sub.iupacName}`,
            detail: `Added ${massGrams.toFixed(2)}g of ${sub.iupacName} (${sub.formula}) to ${container?.name}`,
            temperatureC: container.temperatureK - 273.15,
          });
        }
      },

      setPPE: (slot, value) => set((s) => {
        const newPPE = { ...s.ppe, [slot]: value };
        const allEquipped = newPPE.goggles && newPPE.gloves && newPPE.labCoat;
        return { ppe: newPPE, safetyState: allEquipped ? 'Safe' : s.safetyState };
      }),

      setSafetyState: (state) => set({ safetyState: state }),

      damageHealth: (amount) => set((s) => ({
        healthPoints: Math.max(0, s.healthPoints - amount),
        safetyState: s.healthPoints - amount <= 30 ? 'Danger' : s.safetyState,
      })),

      healHealth: (amount) => set((s) => ({
        healthPoints: Math.min(s.maxHealth, s.healthPoints + amount),
      })),

      setHeldSubstance: (id, mass) => set({ heldSubstanceId: id, heldMassGrams: mass || 10 }),

      processReactionResult: (result, containerId) => {
        if (!result.reactionOccurred) return;
        
        const state = get();
        const container = state.containers.find((c) => c.id === containerId);
        if (!container) return;

        // Update container contents from reaction result
        const newContents: ContainerContent[] = [];
        for (const [substanceId, massGrams] of Object.entries(result.newContents)) {
          if (massGrams > 0.001) {
            newContents.push({ substanceId, massGrams });
          }
        }

        set((s) => ({
          containers: s.containers.map((c) =>
            c.id === containerId
              ? {
                  ...c,
                  contents: newContents,
                  currentVolumeML: result.newVolumeML,
                  temperatureK: result.newTemperatureK,
                  isBroken: result.explosionRisk || c.isBroken,
                }
              : c
          ),
          activeEffects: result.visualEffects,
          safetyState: result.safetyViolations.length > 0 ? 'Danger' : result.safetyWarnings.length > 0 ? 'Warning' : 'Safe',
        }));

        // Process safety violations → health damage
        if (result.safetyViolations.length > 0) {
          get().damageHealth(result.safetyViolations.length * 10);
        }

        // Add journal entry
        get().addJournalEntry({
          type: 'reaction',
          title: result.reactionType || 'Chemical Reaction',
          detail: result.balancedEquation || 'Unknown reaction',
          equation: result.balancedEquation || undefined,
          temperatureC: result.newTemperatureK - 273.15,
          deltaH: result.deltaH,
        });
      },

      addJournalEntry: (entry) => set((s) => ({
        journalEntries: [
          { ...entry, id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() },
          ...s.journalEntries,
        ],
      })),

      setLabCredits: (credits) => set({ labCredits: credits }),
      
      addOwnedChemical: (id, qty) => set((s) => ({
        ownedChemicals: { ...s.ownedChemicals, [id]: (s.ownedChemicals[id] || 0) + qty },
      })),

      setActiveEffects: (effects) => set({ activeEffects: effects }),

      triggerReactionAnimation: (type, color, intensity) => set({
        reactionAnimation: { active: true, type, color, intensity, startTime: Date.now() },
      }),

      clearReactionAnimation: () => set({
        reactionAnimation: { active: false, type: '', color: '', intensity: 0, startTime: 0 },
      }),

      setFumeHoodActive: (active) => set({ fumeHoodActive: active }),

      resetLab: () => set({
        containers: initialContainers,
        selectedContainerId: null,
        ppe: { goggles: false, gloves: false, labCoat: false },
        safetyState: 'Safe',
        healthPoints: 100,
        activeEffects: [],
        reactionAnimation: { active: false, type: '', color: '', intensity: 0, startTime: 0 },
        fumeHoodActive: false,
      }),
    }),
    {
      name: 'molecular-sandbox-lab',
      partialize: (state) => ({
        containers: state.containers,
        ppe: state.ppe,
        labCredits: state.labCredits,
        ownedChemicals: state.ownedChemicals,
        journalEntries: state.journalEntries.slice(0, 100),
        fumeHoodActive: state.fumeHoodActive,
      }),
    }
  )
);
