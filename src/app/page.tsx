"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { usePlayerStore, type Interactable } from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { getSoundManager } from "@/lib/sound/sound-manager";

// Dynamically import the 3D scene (SSR disabled)
const FirstPersonScene = dynamic(
  () => import("@/components/lab/FirstPersonScene").then((m) => m.FirstPersonScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 mx-auto animate-pulse rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600" />
          <p className="text-sm text-slate-400">Loading 3D Lab Environment...</p>
        </div>
      </div>
    ),
  }
);

const FPHUD = dynamic(
  () => import("@/components/lab/FPHUD").then((m) => m.FPHUD),
  { ssr: false }
);

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player store
  const setMode = usePlayerStore((s) => s.setMode);
  const togglePPE = usePlayerStore((s) => s.togglePPE);
  const setHeldItem = usePlayerStore((s) => s.setHeldItem);
  const openOrderingTerminal = usePlayerStore((s) => s.openOrderingTerminal);

  // Lab store (chemistry)
  const initializeLab = useLabStore((s) => s.initializeLab);
  const chemicals = useLabStore((s) => s.chemicals);
  const reactions = useLabStore((s) => s.reactions);

  // === Load chemistry data on mount ===
  useEffect(() => {
    async function load() {
      try {
        const [chemRes, rxnRes] = await Promise.all([
          fetch("/api/chemicals"),
          fetch("/api/reactions"),
        ]);
        if (!chemRes.ok || !rxnRes.ok) throw new Error("Failed to load data");
        const chemData = await chemRes.json();
        const rxnData = await rxnRes.json();

        // Initialize lab store with 3 beakers on the main bench
        const containers = [
          {
            id: "beaker-1",
            type: "beaker" as const,
            position: [-1.5, 1.0, 0] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
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
            type: "beaker" as const,
            position: [0, 1.0, 0] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
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
            type: "beaker" as const,
            position: [1.5, 1.0, 0] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
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
        initializeLab(chemData, rxnData, containers);
        setLoading(false);
        toast.success("Lab initialized", {
          description: `${chemData.length} chemicals · ${rxnData.length} reactions`,
        });
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Unknown error");
        setLoading(false);
      }
    }
    load();
  }, [initializeLab]);

  // === Set first-person mode on mount ===
  useEffect(() => {
    setMode("first-person");
  }, [setMode]);

  // === Delivery check loop — check for pending orders that should be delivered ===
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      const state = usePlayerStore.getState();
      const now = Date.now();
      const pending = state.orders.filter((o) => o.status === "pending");
      for (const order of pending) {
        const elapsed = (now - order.orderedAt) / 1000;
        // Delivery takes 20-45 seconds based on order id hash
        const seed = order.id.charCodeAt(order.id.length - 1) % 26;
        const deliveryTime = 20 + seed;
        if (elapsed >= deliveryTime) {
          state.deliverOrder(order.id);
          state.addOwnedChemical(order.chemicalId, order.quantity);
          state.placeOnShelf(order.chemicalId);
          toast.success("📦 Delivery arrived!", {
            description: `${order.chemicalName} (${order.quantity}mL) is now on the shelf`,
            duration: 5000,
          });
          if (usePlayerStore.getState().heldItem === null) {
            // Auto-pickup if hand is empty? No — let player grab it from shelf
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // === Handle interactions ===
  const handleInteract = useCallback(
    (interactable: Interactable) => {
      const sm = getSoundManager();
      switch (interactable.kind) {
        case "safety-station":
          // Toggle all PPE at once (simple for now)
          const ppe = usePlayerStore.getState().ppe;
          const allOn = ppe.coat && ppe.goggles && ppe.gloves;
          usePlayerStore.getState().setPPE({
            coat: !allOn,
            goggles: !allOn,
            gloves: !allOn,
            mask: !allOn,
          });
          toast.success(allOn ? "PPE removed" : "PPE equipped", {
            description: allOn
              ? "You are now unprotected"
              : "Coat, goggles, gloves, mask equipped",
          });
          sm.play("click");
          break;

        case "ordering-terminal":
          openOrderingTerminal();
          sm.play("click");
          toast.info("Ordering Terminal", {
            description: "Browse and order chemicals — deliveries arrive in 20-45s",
          });
          break;

        case "chemical-bottle":
          // Pick up the bottle
          if (interactable.chemicalId) {
            const chem = chemicals.find((c) => c.id === interactable.chemicalId);
            if (chem) {
              setHeldItem({
                type: "chemical",
                chemicalId: chem.id,
                volume: 50,
              });
              toast.success(`Picked up ${chem.name}`, {
                description: `50mL · look at a beaker and press E to pour`,
              });
              sm.play("drop");
            }
          }
          break;

        case "beaker":
          // If holding a chemical, pour it into this beaker
          const heldItem = usePlayerStore.getState().heldItem;
          if (heldItem && heldItem.type === "chemical") {
            // Check PPE requirement
            const hasPPE = usePlayerStore.getState().hasRequiredPPE();
            if (!hasPPE) {
              toast.error("Safety violation!", {
                description: "Equip coat + goggles + gloves at the safety station first",
                duration: 4000,
              });
              return;
            }
            const containerId = interactable.containerId;
            if (containerId) {
              useLabStore
                .getState()
                .addChemicalToContainer(containerId, heldItem.chemicalId, heldItem.volume, true);
              toast.success("Poured into beaker", {
                description: `${heldItem.volume}mL added · auto-react enabled`,
              });
              sm.play("pour");
              setHeldItem(null);
            }
          } else {
            // Select the beaker (for reactions)
            if (interactable.containerId) {
              useLabStore.getState().selectContainer(interactable.containerId);
              toast.info("Beaker selected", {
                description: interactable.containerId.toUpperCase(),
              });
              sm.play("click");
            }
          }
          break;

        case "sink":
          // Get water
          setHeldItem({
            type: "chemical",
            chemicalId: chemicals.find((c) => c.name === "Water")?.id || "",
            volume: 50,
          });
          toast.success("Filled with water", {
            description: "50mL tap water",
          });
          sm.play("pour");
          break;

        case "bunsen-burner":
          toast.info("Bunsen burner", {
            description: "Heating controls coming in Phase 3",
          });
          sm.play("click");
          break;

        case "fume-hood":
          toast.info("Fume hood", {
            description: "Move dangerous reactions here (coming Phase 3)",
          });
          sm.play("click");
          break;

        default:
          toast.info(interactable.label, {
            description: interactable.action,
          });
      }
    },
    [chemicals, openOrderingTerminal, setHeldItem]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
        <div className="mb-6 h-20 w-20 animate-pulse rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600" />
        <h1 className="mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
          The Molecular Sandbox
        </h1>
        <p className="mb-4 text-slate-400">Loading chemistry engine...</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-emerald-400"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <h1 className="mb-2 text-2xl font-bold text-red-400">Failed to load</h1>
        <p className="text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-950">
      <FirstPersonScene onInteract={handleInteract} />
      <FPHUD />
    </div>
  );
}
