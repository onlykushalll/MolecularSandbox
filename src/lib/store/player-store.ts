/**
 * Player Store — First-person open-world lab mode
 *
 * Manages: player position/rotation, budget, held item, coat/PPE state,
 * interactable objects in range, ordering/delivery system.
 *
 * Physics: AABB collision against lab walls and furniture bounding boxes.
 * Chemistry: integrates with existing lab-store for reactions.
 */

import { create } from "zustand";
import type { ChemicalData } from "@/lib/chemistry/types";

// === Types ===

export type PPEState = {
  coat: boolean;
  goggles: boolean;
  gloves: boolean;
  mask: boolean;
};

export type HeldItem =
  | { type: "chemical"; chemicalId: string; volume: number }
  | { type: "apparatus"; apparatusId: string }
  | null;

export type InteractableKind =
  | "chemical-bottle"
  | "beaker"
  | "bunsen-burner"
  | "fume-hood"
  | "ordering-terminal"
  | "safety-station"
  | "sink"
  | "trash"
  | "storage-shelf";

export type Interactable = {
  id: string;
  kind: InteractableKind;
  label: string;
  position: [number, number, number];
  // Optional: which chemical this bottle holds
  chemicalId?: string;
  // Optional: which container (beaker) this is
  containerId?: string;
  // Action verb shown in prompt
  action: string;
};

export type DeliveryOrder = {
  id: string;
  chemicalId: string;
  chemicalName: string;
  quantity: number;
  priceINR: number;
  orderedAt: number; // timestamp
  deliveredAt: number | null; // timestamp when delivered
  status: "pending" | "delivered";
};

export type PlayerMode = "first-person" | "menu";

interface PlayerState {
  // === Position & movement ===
  position: [number, number, number];
  rotation: [number, number]; // [yaw, pitch]
  velocity: [number, number, number];
  isMoving: boolean;
  isSprinting: boolean;
  isLocked: boolean; // pointer lock active

  // === Mode ===
  mode: PlayerMode;
  showStartScreen: boolean;

  // === Inventory & budget ===
  budgetINR: number;
  heldItem: HeldItem;
  ppe: PPEState;

  // === Interaction ===
  currentInteractable: Interactable | null;
  nearbyInteractables: Interactable[];
  hoveredInteractable: Interactable | null;

  // === Ordering ===
  orders: DeliveryOrder[];
  isOrderingTerminalOpen: boolean;

  // === Lab inventory (chemicals the player owns + has on shelf) ===
  ownedChemicals: Map<string, number>; // chemicalId -> volume (mL or g)
  shelfChemicals: string[]; // chemicalIds currently placed on the shelf

  // === Actions ===
  setPosition: (pos: [number, number, number]) => void;
  setRotation: (rot: [number, number]) => void;
  setVelocity: (vel: [number, number, number]) => void;
  setMoving: (moving: boolean) => void;
  setSprinting: (sprinting: boolean) => void;
  setLocked: (locked: boolean) => void;

  setMode: (mode: PlayerMode) => void;
  setStartScreen: (show: boolean) => void;

  spendBudget: (amount: number) => boolean;
  refundBudget: (amount: number) => void;

  setHeldItem: (item: HeldItem) => void;
  togglePPE: (key: keyof PPEState) => void;
  setPPE: (ppe: Partial<PPEState>) => void;
  hasRequiredPPE: () => boolean;

  setHoveredInteractable: (i: Interactable | null) => void;
  setCurrentInteractable: (i: Interactable | null) => void;
  registerInteractable: (i: Interactable) => void;
  unregisterInteractable: (id: string) => void;

  openOrderingTerminal: () => void;
  closeOrderingTerminal: () => void;
  placeOrder: (chemical: ChemicalData, quantity: number, priceINR: number) => boolean;
  deliverOrder: (orderId: string) => void;
  getPendingDeliveries: () => DeliveryOrder[];

  addOwnedChemical: (chemicalId: string, volume: number) => void;
  removeOwnedChemical: (chemicalId: string, volume: number) => void;
  placeOnShelf: (chemicalId: string) => void;
  removeFromShelf: (chemicalId: string) => void;

  resetPlayer: () => void;
}

// === Lab room dimensions (meters) — clean modern lab ===
export const LAB_DIMENSIONS = {
  width: 16, // X
  depth: 12, // Z
  height: 3.2, // Y
  wallThickness: 0.2,
};

// === Player physical constants ===
export const PLAYER = {
  height: 1.7, // eye height (meters)
  radius: 0.3, // collision radius
  walkSpeed: 2.5, // m/s
  sprintSpeed: 5.0, // m/s
  reach: 3.0, // interaction reach (meters)
};

// === Collision bounding boxes (AABB) — walls + furniture ===
// Format: [minX, minY, minZ, maxX, maxY, maxZ]
export const COLLIDERS: Array<{
  id: string;
  box: [number, number, number, number, number, number];
}> = [
  // Outer walls
  { id: "wall-north", box: [-8, 0, -6, 8, 3.2, -5.8] },
  { id: "wall-south", box: [-8, 0, 5.8, 8, 3.2, 6] },
  { id: "wall-east", box: [7.8, 0, -6, 8, 3.2, 6] },
  { id: "wall-west", box: [-8, 0, -6, -7.8, 3.2, 6] },
  // Main lab bench (center)
  { id: "bench-main", box: [-3, 0, -1, 3, 1, 1] },
  // Side bench (against west wall)
  { id: "bench-side", box: [-7.5, 0, -4, -4.5, 1, -3.8] },
  // Chemical shelf cabinet (against east wall)
  { id: "shelf-cabinet", box: [6.5, 0, -4, 7.5, 2.4, -1] },
  // Fume hood (north wall)
  { id: "fume-hood", box: [-2, 0, -5.5, 2, 2.5, -4.5] },
  // Ordering terminal desk (south-east corner)
  { id: "terminal-desk", box: [5, 0, 4, 7, 1, 5.5] },
];

// === Delivery timing ===
export const DELIVERY = {
  minDelay: 20, // seconds — minimum delivery time
  maxDelay: 45, // seconds — max delivery time
  maxPending: 3, // max pending orders at once (anti-spam)
};

// === Initial state ===
const initialState = {
  position: [0, PLAYER.height, 4] as [number, number, number],
  rotation: [0, 0] as [number, number],
  velocity: [0, 0, 0] as [number, number, number],
  isMoving: false,
  isSprinting: false,
  isLocked: false,
  mode: "menu" as PlayerMode,
  showStartScreen: true,
  budgetINR: 10000,
  heldItem: null as HeldItem,
  ppe: {
    coat: false,
    goggles: false,
    gloves: false,
    mask: false,
  } as PPEState,
  currentInteractable: null as Interactable | null,
  nearbyInteractables: [] as Interactable[],
  hoveredInteractable: null as Interactable | null,
  orders: [] as DeliveryOrder[],
  isOrderingTerminalOpen: false,
  ownedChemicals: new Map<string, number>(),
  shelfChemicals: [] as string[],
};

// === AABB collision check ===
export function checkCollision(
  pos: [number, number, number],
  radius: number = PLAYER.radius
): boolean {
  for (const { box } of COLLIDERS) {
    const [minX, minY, minZ, maxX, maxY, maxZ] = box;
    // Player is a cylinder at pos[0], pos[2] with radius; check against AABB expanded by radius
    if (
      pos[0] + radius > minX &&
      pos[0] - radius < maxX &&
      pos[2] + radius > minZ &&
      pos[2] - radius < maxZ &&
      pos[1] > minY &&
      pos[1] - PLAYER.height < maxY
    ) {
      return true;
    }
  }
  return false;
}

// === Store ===
export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initialState,

  setPosition: (pos) => set({ position: pos }),
  setRotation: (rot) => set({ rotation: rot }),
  setVelocity: (vel) => set({ velocity: vel }),
  setMoving: (moving) => set({ isMoving: moving }),
  setSprinting: (sprinting) => set({ isSprinting: sprinting }),
  setLocked: (locked) => set({ isLocked: locked }),

  setMode: (mode) => set({ mode }),
  setStartScreen: (show) => set({ showStartScreen: show }),

  spendBudget: (amount) => {
    const current = get().budgetINR;
    if (current < amount) return false;
    set({ budgetINR: current - amount });
    return true;
  },
  refundBudget: (amount) =>
    set((s) => ({ budgetINR: s.budgetINR + amount })),

  setHeldItem: (item) => set({ heldItem: item }),

  togglePPE: (key) =>
    set((s) => ({ ppe: { ...s.ppe, [key]: !s.ppe[key] } })),

  setPPE: (ppe) => set((s) => ({ ppe: { ...s.ppe, ...ppe } })),

  hasRequiredPPE: () => {
    const { coat, goggles, gloves } = get().ppe;
    return coat && goggles && gloves;
  },

  setHoveredInteractable: (i) => set({ hoveredInteractable: i }),
  setCurrentInteractable: (i) => set({ currentInteractable: i }),
  registerInteractable: (i) =>
    set((s) => ({
      nearbyInteractables: [
        ...s.nearbyInteractables.filter((x) => x.id !== i.id),
        i,
      ],
    })),
  unregisterInteractable: (id) =>
    set((s) => ({
      nearbyInteractables: s.nearbyInteractables.filter((x) => x.id !== id),
      hoveredInteractable:
        s.hoveredInteractable?.id === id ? null : s.hoveredInteractable,
    })),

  openOrderingTerminal: () => set({ isOrderingTerminalOpen: true }),
  closeOrderingTerminal: () => set({ isOrderingTerminalOpen: false }),

  placeOrder: (chemical, quantity, priceINR) => {
    const state = get();
    const pendingCount = state.orders.filter((o) => o.status === "pending").length;
    if (pendingCount >= DELIVERY.maxPending) return false;
    if (state.budgetINR < priceINR) return false;

    const order: DeliveryOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      chemicalId: chemical.id,
      chemicalName: chemical.name,
      quantity,
      priceINR,
      orderedAt: Date.now(),
      deliveredAt: null,
      status: "pending",
    };

    set({
      orders: [...state.orders, order],
      budgetINR: state.budgetINR - priceINR,
    });
    return true;
  },

  deliverOrder: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: "delivered" as const, deliveredAt: Date.now() }
          : o
      ),
    })),

  getPendingDeliveries: () =>
    get().orders.filter((o) => o.status === "pending"),

  addOwnedChemical: (chemicalId, volume) =>
    set((s) => {
      const owned = new Map(s.ownedChemicals);
      owned.set(chemicalId, (owned.get(chemicalId) || 0) + volume);
      return { ownedChemicals: owned };
    }),

  removeOwnedChemical: (chemicalId, volume) =>
    set((s) => {
      const owned = new Map(s.ownedChemicals);
      const current = owned.get(chemicalId) || 0;
      if (current <= volume) {
        owned.delete(chemicalId);
      } else {
        owned.set(chemicalId, current - volume);
      }
      return { ownedChemicals: owned };
    }),

  placeOnShelf: (chemicalId) =>
    set((s) =>
      s.shelfChemicals.includes(chemicalId)
        ? s
        : { shelfChemicals: [...s.shelfChemicals, chemicalId] }
    ),

  removeFromShelf: (chemicalId) =>
    set((s) => ({
      shelfChemicals: s.shelfChemicals.filter((c) => c !== chemicalId),
    })),

  resetPlayer: () => set({ ...initialState, showStartScreen: false }),
}));
