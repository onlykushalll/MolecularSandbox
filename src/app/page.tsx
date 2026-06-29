"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  usePlayerStore,
  initStartingChemicals,
  type Interactable,
} from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { getSoundManager } from "@/lib/sound/sound-manager";

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

const OrderingTerminalUI = dynamic(
  () => import("@/components/lab/OrderingTerminalUI").then((m) => m.OrderingTerminalUI),
  { ssr: false }
);

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);

  const setMode = usePlayerStore((s) => s.setMode);
  const openOrderingTerminal = usePlayerStore((s) => s.openOrderingTerminal);
  const setHeldItem = usePlayerStore((s) => s.setHeldItem);
  const togglePPE = usePlayerStore((s) => s.togglePPE);
  const toggleBunsen = usePlayerStore((s) => s.toggleBunsen);
  const removeOwnedChemical = usePlayerStore((s) => s.removeOwnedChemical);

  const initializeLab = useLabStore((s) => s.initializeLab);
  const chemicals = useLabStore((s) => s.chemicals);
  const reactions = useLabStore((s) => s.reactions);
  const heatingTick = useLabStore((s) => s.heatingTick);
  const setContainerHeating = useLabStore((s) => s.setContainerHeating);
  const selectContainer = useLabStore((s) => s.selectContainer);
  const triggerReaction = useLabStore((s) => s.triggerReaction);
  const addChemicalToContainer = useLabStore((s) => s.addChemicalToContainer);
  const lastReactionResult = useLabStore((s) => s.lastReactionResult);

  // === Load chemistry data + init starting chemicals ===
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
        // Give player starting chemicals on the shelf
        initStartingChemicals(chemData);
        setLoading(false);
        toast.success("Lab initialized", {
          description: `${chemData.length} chemicals · ${rxnData.length} reactions · 15 starter chemicals on shelf`,
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

  // === Heating tick (every 500ms) ===
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      heatingTick();
    }, 500);
    return () => clearInterval(interval);
  }, [loading, heatingTick]);

  // === Bunsen burner heating — when on, heat nearest beaker ===
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      const bunsenOn = usePlayerStore.getState().bunsenOn;
      const containers = useLabStore.getState().containers;
      // Bunsen is at [-2.5, 0.99, 0.3], nearest beaker is beaker-1 at [-1.5, 1.0, 0]
      const nearestBeaker = containers[0]; // beaker-1
      if (nearestBeaker) {
        const shouldHeat = bunsenOn;
        if (nearestBeaker.isHeating !== shouldHeat) {
          setContainerHeating(nearestBeaker.id, shouldHeat);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [loading, setContainerHeating]);

  // === Delivery check loop ===
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      const state = usePlayerStore.getState();
      const now = Date.now();
      const pending = state.orders.filter((o) => o.status === "pending");
      for (const order of pending) {
        const elapsed = (now - order.orderedAt) / 1000;
        const seed = order.id.charCodeAt(order.id.length - 1) % 26;
        const deliveryTime = 20 + seed;
        if (elapsed >= deliveryTime) {
          state.deliverOrder(order.id);
          state.addOwnedChemical(order.chemicalId, order.quantity);
          state.placeOnShelf(order.chemicalId);
          toast.success("📦 Delivery arrived!", {
            description: `${order.chemicalName} is now on the shelf`,
            duration: 5000,
          });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // === Reaction flash + toast feedback ===
  const prevReactionRef = useRef<unknown>(null);
  useEffect(() => {
    if (lastReactionResult && lastReactionResult !== prevReactionRef.current) {
      prevReactionRef.current = lastReactionResult;
      setFlashKey((k) => k + 1);
      const deltaT = lastReactionResult.temperatureChange;
      const isExo = deltaT > 0;
      const toastFn = isExo ? toast.success : toast.info;
      toastFn("Reaction Complete!", {
        description: `${lastReactionResult.reaction.equation} · ΔT = ${deltaT > 0 ? "+" : ""}${deltaT.toFixed(1)}°C${
          lastReactionResult.gasEvolved ? " · 💨 Gas" : ""
        }${
          lastReactionResult.precipitateFormed ? " · ▼ Precipitate" : ""
        }`,
        duration: 4000,
      });
      getSoundManager().play("reaction");
    }
  }, [lastReactionResult]);

  // === Handle interactions ===
  const handleInteract = useCallback(
    (interactable: Interactable) => {
      const sm = getSoundManager();
      const playerState = usePlayerStore.getState();

      switch (interactable.kind) {
        case "safety-station": {
          const ppe = playerState.ppe;
          const allOn = ppe.coat && ppe.goggles && ppe.gloves;
          usePlayerStore.getState().setPPE({
            coat: !allOn,
            goggles: !allOn,
            gloves: !allOn,
            mask: !allOn,
          });
          toast.success(allOn ? "PPE removed" : "PPE equipped", {
            description: allOn ? "You are now unprotected" : "Coat + goggles + gloves + mask",
          });
          sm.play("click");
          break;
        }

        case "ordering-terminal":
          openOrderingTerminal();
          sm.play("click");
          break;

        case "chemical-bottle": {
          if (interactable.chemicalId) {
            const chem = chemicals.find((c) => c.id === interactable.chemicalId);
            if (chem) {
              // If already holding something, swap (put down current, pick up new)
              if (playerState.heldItem) {
                toast.info("Put down current item first", {
                  description: "Press Q to drop held item",
                });
                return;
              }
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
        }

        case "beaker": {
          const heldItem = playerState.heldItem;
          if (heldItem && heldItem.type === "chemical") {
            // Check PPE requirement
            if (!playerState.hasRequiredPPE()) {
              toast.error("⚠ Safety violation!", {
                description: "Equip coat + goggles + gloves at the safety station first",
                duration: 4000,
              });
              return;
            }
            const containerId = interactable.containerId;
            if (containerId) {
              // Pour into beaker
              addChemicalToContainer(containerId, heldItem.chemicalId, heldItem.volume, true);
              // Deduct from owned chemicals
              removeOwnedChemical(heldItem.chemicalId, heldItem.volume);
              toast.success("Poured into beaker", {
                description: `${heldItem.volume}mL added · auto-react on`,
              });
              sm.play("pour");
              setHeldItem(null);
            }
          } else {
            // Select beaker
            if (interactable.containerId) {
              selectContainer(interactable.containerId);
              const container = useLabStore.getState().containers.find(c => c.id === interactable.containerId);
              toast.info("Beaker selected", {
                description: container
                  ? `${container.id.toUpperCase()} · ${container.contents.length} contents · ${container.temperature.toFixed(0)}°C`
                  : interactable.containerId.toUpperCase(),
              });
              sm.play("click");
            }
          }
          break;
        }

        case "sink":
          setHeldItem({
            type: "chemical",
            chemicalId: chemicals.find((c) => c.name === "Water")?.id || "",
            volume: 50,
          });
          toast.success("Filled with water", { description: "50mL tap water" });
          sm.play("pour");
          break;

        case "bunsen-burner":
          toggleBunsen();
          const isOn = !playerState.bunsenOn;
          toast.success(isOn ? "🔥 Bunsen ignited" : "Bunsen turned off", {
            description: isOn ? "Heating nearest beaker" : "Flame extinguished",
          });
          sm.play(isOn ? "click" : "click");
          break;

        case "fume-hood":
          toast.info("Fume Hood", {
            description: "Move dangerous reactions here — coming in Phase 4",
          });
          sm.play("click");
          break;

        default:
          toast.info(interactable.label, { description: interactable.action });
      }
    },
    [chemicals, openOrderingTerminal, setHeldItem, toggleBunsen, removeOwnedChemical, addChemicalToContainer, selectContainer]
  );

  // === Keyboard shortcuts ===
  // Q=drop, T=terminal, B=bunsen, P=PPE, R=react, X=empty, 1/2/3=select beaker
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const labState = useLabStore.getState();
      const playerState = usePlayerStore.getState();

      if (e.code === "KeyQ") {
        const held = playerState.heldItem;
        if (held) {
          setHeldItem(null);
          toast.info("Put down item");
          getSoundManager().play("click");
        }
      } else if (e.code === "KeyT") {
        const isOpen = playerState.isOrderingTerminalOpen;
        if (isOpen) usePlayerStore.getState().closeOrderingTerminal();
        else usePlayerStore.getState().openOrderingTerminal();
        getSoundManager().play("click");
      } else if (e.code === "KeyB") {
        const isOn = playerState.bunsenOn;
        usePlayerStore.getState().toggleBunsen();
        toast.success(!isOn ? "🔥 Bunsen ignited" : "Bunsen off", {
          description: !isOn ? "Heating nearest beaker" : "Flame off",
        });
        getSoundManager().play("click");
      } else if (e.code === "KeyP") {
        const ppe = playerState.ppe;
        const allOn = ppe.coat && ppe.goggles && ppe.gloves;
        usePlayerStore.getState().setPPE({
          coat: !allOn, goggles: !allOn, gloves: !allOn, mask: !allOn,
        });
        toast.success(allOn ? "PPE removed" : "PPE equipped");
        getSoundManager().play("click");
      } else if (e.code === "KeyR") {
        // Trigger reaction on selected beaker
        const sel = labState.selectedContainerId;
        if (sel) {
          const c = labState.containers.find((c) => c.id === sel);
          if (c && c.contents.length > 0 && !c.isBroken) {
            if (!playerState.hasRequiredPPE()) {
              toast.error("⚠ Safety violation!", {
                description: "Equip PPE first (press P)",
              });
              return;
            }
            labState.triggerReaction(sel);
            toast.info("⚡ Triggering reaction...", { description: sel.toUpperCase() });
            getSoundManager().play("click");
          } else {
            toast.error("Cannot react", { description: "Beaker is empty or broken" });
          }
        } else {
          toast.error("No beaker selected", { description: "Look at a beaker and press E, or press 1/2/3" });
        }
      } else if (e.code === "KeyX") {
        // Empty selected beaker
        const sel = labState.selectedContainerId;
        if (sel) {
          labState.emptyContainer(sel);
          toast.info("🗑 Beaker emptied", { description: sel.toUpperCase() });
          getSoundManager().play("click");
        } else {
          toast.error("No beaker selected", { description: "Press 1/2/3 to select" });
        }
      } else if (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3") {
        // Select beaker 1/2/3
        const idx = parseInt(e.code.replace("Digit", "")) - 1;
        const c = labState.containers[idx];
        if (c) {
          labState.selectContainer(c.id);
          toast.info("Selected", { description: c.id.toUpperCase() });
          getSoundManager().play("click");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setHeldItem]);

  // === Expose stores for debugging ===
  useEffect(() => {
    (window as any).__playerStore = usePlayerStore;
    (window as any).__labStore = useLabStore;
  }, []);

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
      {sceneReady && <FirstPersonScene onInteract={handleInteract} />}
      <FPHUD onEnterLab={() => setSceneReady(true)} />
      <OrderingTerminalUI />
      {/* Reaction flash overlay */}
      {sceneReady && (
        <div
          key={flashKey}
          className="pointer-events-none absolute inset-0 z-40"
          style={{
            background:
              "radial-gradient(circle at center, rgba(34, 197, 94, 0.18) 0%, transparent 70%)",
            animation: "flash 0.6s ease-out",
          }}
        />
      )}
    </div>
  );
}
