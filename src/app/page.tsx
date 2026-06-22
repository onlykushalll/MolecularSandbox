"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useCallback } from "react";
import { ChemicalShelf } from "@/components/ui-panels/ChemicalShelf";
import { InstrumentPanel } from "@/components/ui-panels/InstrumentPanel";
import { SafetyPanel } from "@/components/ui-panels/SafetyPanel";
import { LabJournal } from "@/components/ui-panels/LabJournal";
import { PresetExperiments } from "@/components/ui-panels/PresetExperiments";
import { AIAssistant } from "@/components/ui-panels/AIAssistant";
import { SaveLoadPanel } from "@/components/ui-panels/SaveLoadPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  Shield,
  BookOpen,
  Beaker,
  RotateCcw,
  Loader2,
  Sparkles,
  Bot,
  Save,
  Github,
  Atom,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import type { ChemicalData, ReactionData, ContainerState } from "@/lib/chemistry/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSoundManager } from "@/lib/sound/sound-manager";

const LabScene = dynamic(
  () => import("@/components/lab/LabScene").then((m) => m.LabScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <FlaskConical className="h-16 w-16 text-emerald-400 animate-pulse" />
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Loading 3D Lab Environment</p>
            <p className="text-xs text-slate-400">Initializing WebGL · physics · shaders</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

type LeftPanel = "shelf" | "presets";
type RightPanel = "instruments" | "safety" | "assistant" | "journal" | "saves";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [leftPanel, setLeftPanel] = useState<LeftPanel>("shelf");
  const [rightPanel, setRightPanel] = useState<RightPanel>("instruments");
  const prevReactionRef = useRef<unknown>(null);

  const initializeLab = useLabStore((s) => s.initializeLab);
  const resetLab = useLabStore((s) => s.resetLab);
  const heatingTick = useLabStore((s) => s.heatingTick);
  const chemicals = useLabStore((s) => s.chemicals);
  const reactions = useLabStore((s) => s.reactions);
  const lastReactionResult = useLabStore((s) => s.lastReactionResult);
  const safetyAlerts = useLabStore((s) => s.safetyAlerts);
  const ppeWorn = useLabStore((s) => s.ppeWorn);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const secondaryContainerId = useLabStore((s) => s.secondaryContainerId);
  const containers = useLabStore((s) => s.containers);
  const selectContainer = useLabStore((s) => s.selectContainer);
  const triggerReaction = useLabStore((s) => s.triggerReaction);
  const setContainerHeating = useLabStore((s) => s.setContainerHeating);
  const emptyContainer = useLabStore((s) => s.emptyContainer);
  const startPourAnimation = useLabStore((s) => s.startPourAnimation);
  const togglePHStrip = useLabStore((s) => s.togglePHStrip);
  const toggleSound = useLabStore((s) => s.toggleSound);
  const soundEnabled = useLabStore((s) => s.soundEnabled);
  const reactionProgress = useLabStore((s) => s.reactionProgress);
  const reactingContainerId = useLabStore((s) => s.reactingContainerId);
  const setReactionProgress = useLabStore((s) => s.setReactionProgress);

  // Heating tick — runs every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      heatingTick();
    }, 500);
    return () => clearInterval(interval);
  }, [heatingTick]);

  // Reaction progress decay — animate the reaction ring down to 0 over ~1.2s
  useEffect(() => {
    if (reactionProgress > 0) {
      const startTime = Date.now();
      const duration = 1200;
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const p = Math.max(0, 1 - elapsed / duration);
        setReactionProgress(p);
        if (p <= 0) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [reactionProgress, setReactionProgress]);

  // Unlock audio on first user interaction (any click)
  useEffect(() => {
    const unlock = () => {
      getSoundManager().unlock();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const key = e.key.toLowerCase();
      const state = useLabStore.getState();
      const { containers, selectedContainerId, secondaryContainerId } = state;
      // Select beakers 1/2/3
      if (key === "1" || key === "2" || key === "3") {
        const idx = parseInt(key, 10) - 1;
        if (containers[idx]) {
          selectContainer(containers[idx].id, e.shiftKey);
          if (state.soundEnabled) getSoundManager().play("click");
        }
        return;
      }
      // R = react on selected beaker
      if (key === "r" && selectedContainerId) {
        const c = containers.find((c) => c.id === selectedContainerId);
        if (c && c.contents.length > 0 && !c.isBroken) {
          triggerReaction(selectedContainerId);
        }
        return;
      }
      // H = toggle heat on selected beaker
      if (key === "h" && selectedContainerId) {
        const c = containers.find((c) => c.id === selectedContainerId);
        if (c && !c.isBroken) {
          setContainerHeating(selectedContainerId, !c.isHeating);
        }
        return;
      }
      // E = empty selected beaker
      if (key === "e" && selectedContainerId) {
        emptyContainer(selectedContainerId);
        toast.info("Beaker emptied", { description: selectedContainerId.toUpperCase() });
        return;
      }
      // P = pour (needs primary + secondary)
      if (key === "p" && selectedContainerId && secondaryContainerId) {
        const src = containers.find((c) => c.id === selectedContainerId);
        if (src && src.contents.length > 0) {
          startPourAnimation(selectedContainerId, secondaryContainerId);
          toast.info("Pouring...", { description: `${selectedContainerId} → ${secondaryContainerId}` });
        }
        return;
      }
      // T = toggle pH strip
      if (key === "t") {
        togglePHStrip();
        return;
      }
      // M = toggle mute
      if (key === "m") {
        toggleSound();
        return;
      }
      // Escape = deselect
      if (key === "escape") {
        selectContainer(null);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    selectContainer,
    triggerReaction,
    setContainerHeating,
    emptyContainer,
    startPourAnimation,
    togglePHStrip,
    toggleSound,
  ]);

  // Reaction flash effect + toast
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
    }
  }, [lastReactionResult]);

  // Load data on mount
  useEffect(() => {
    async function load() {
      try {
        const [chemRes, rxnRes] = await Promise.all([
          fetch("/api/chemicals"),
          fetch("/api/reactions"),
        ]);
        if (!chemRes.ok || !rxnRes.ok) throw new Error("Failed to load data");
        const chemData: ChemicalData[] = await chemRes.json();
        const rxnData: ReactionData[] = await rxnRes.json();

        const containers: ContainerState[] = [
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
        initializeLab(chemData, rxnData, containers);
        setLoading(false);
        toast.success("Lab initialized", {
          description: `${chemData.length} chemicals · ${rxnData.length} reactions loaded`,
        });
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Unknown error");
        setLoading(false);
      }
    }
    load();
  }, [initializeLab]);

  const handleReset = () => {
    resetLab();
    toast.info("Lab reset", {
      description: "All beakers emptied, temperature reset to 25°C",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
        <div className="relative mb-6">
          <FlaskConical className="h-20 w-20 animate-pulse text-emerald-400" />
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
        </div>
        <h1 className="mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
          The Molecular Sandbox
        </h1>
        <p className="mb-4 text-slate-400">Initializing chemistry engine...</p>
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
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const ppeCount = Object.values(ppeWorn).filter(Boolean).length;
  const dangerCount = safetyAlerts.filter((a) => a.severity === "danger").length;
  const warningCount = safetyAlerts.filter((a) => a.severity === "warning").length;

  const leftPanelTabs: { id: LeftPanel; label: string; icon: typeof Beaker }[] = [
    { id: "shelf", label: "Shelf", icon: Beaker },
    { id: "presets", label: "Presets", icon: Sparkles },
  ];
  const rightPanelTabs: { id: RightPanel; label: string; icon: typeof Bot; badge?: number }[] = [
    { id: "instruments", label: "Lab", icon: FlaskConical },
    { id: "safety", label: "Safety", icon: Shield, badge: dangerCount || undefined },
    { id: "assistant", label: "AI", icon: Bot },
    { id: "saves", label: "Save", icon: Save },
    { id: "journal", label: "Journal", icon: BookOpen },
  ];

  // Total contents across all beakers (for stats)
  const totalContents = containers.reduce((s, c) => s + c.contents.length, 0);
  const totalVolume = containers.reduce(
    (s, c) => s + c.contents.reduce((ss, cc) => ss + cc.volume, 0),
    0
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950">
      {/* Reaction flash overlay */}
      <div
        key={flashKey}
        className="pointer-events-none absolute inset-0 z-50 animate-[flash_0.6s_ease-out]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(34, 197, 94, 0.25) 0%, transparent 70%)",
        }}
      />

      {/* Top header bar — enhanced with animated gradient background */}
      <header className="relative flex h-16 items-center justify-between overflow-hidden border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 backdrop-blur">
        {/* Animated background dots */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 shadow-lg shadow-emerald-500/30">
            <FlaskConical className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-transparent" />
            {/* Animated pulse ring */}
            <div className="absolute inset-0 animate-ping rounded-xl bg-emerald-500/20" style={{ animationDuration: "3s" }} />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-base font-bold text-transparent">
              The Molecular Sandbox
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Atom className="h-2.5 w-2.5 text-emerald-400" />
                {chemicals.length} chemicals
              </span>
              <span className="text-slate-600">·</span>
              <span>{reactions.length} reactions</span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", ppeCount >= 3 ? "bg-emerald-400" : "bg-yellow-400")} />
                {ppeCount}/4 PPE
              </span>
              <span className="text-slate-600">·</span>
              <span>{totalVolume.toFixed(0)} mL total</span>
            </div>
          </div>
        </div>

        {/* Center: beaker selection status */}
        <div className="relative hidden md:flex items-center gap-2">
          {selectedContainerId ? (
            <Badge className="border-emerald-500/40 bg-emerald-950/40 text-emerald-300">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {selectedContainerId.toUpperCase()}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-700 bg-slate-900/40 text-slate-500">
              No beaker selected
            </Badge>
          )}
          {secondaryContainerId && (
            <>
              <span className="text-slate-600">→</span>
              <Badge className="border-amber-500/40 bg-amber-950/40 text-amber-300">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                {secondaryContainerId.toUpperCase()}
              </Badge>
            </>
          )}
        </div>

        <div className="relative flex items-center gap-1.5">
          {/* Sound toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSound()}
            className={
              soundEnabled
                ? "text-emerald-400 hover:bg-slate-800 hover:text-emerald-300"
                : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            }
            title="Toggle sound (M)"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Shelf / Presets */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-950/50">
          {/* Left panel tabs */}
          <div className="flex gap-1 border-b border-slate-800 bg-slate-950/50 p-2">
            {leftPanelTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setLeftPanel(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                    leftPanel === tab.id
                      ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm shadow-emerald-500/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-hidden">
            {leftPanel === "shelf" && <ChemicalShelf />}
            {leftPanel === "presets" && <PresetExperiments />}
          </div>
        </aside>

        {/* Center — 3D Scene */}
        <main className="relative flex-1">
          <LabScene />

          {/* Top-left overlay: scene info */}
          <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
            <Badge
              variant="outline"
              className="border-slate-600/50 bg-slate-900/70 px-3 py-1 text-xs text-slate-300 backdrop-blur"
            >
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Lab Active
            </Badge>
            {/* Mini stats card */}
            <div className="pointer-events-none rounded-lg border border-slate-700/50 bg-slate-900/70 px-3 py-2 backdrop-blur">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-base font-bold text-emerald-400">{containers.length}</div>
                  <div className="text-[9px] text-slate-500">Beakers</div>
                </div>
                <div>
                  <div className="text-base font-bold text-cyan-400">{totalContents}</div>
                  <div className="text-[9px] text-slate-500">Contents</div>
                </div>
                <div>
                  <div className="text-base font-bold text-purple-400">{totalVolume.toFixed(0)}</div>
                  <div className="text-[9px] text-slate-500">mL total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom overlay: controls hint */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/80 px-4 py-1.5 backdrop-blur">
              <span className="text-[10px] text-slate-400">🖱️ Drag rotate</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-slate-400">Scroll zoom</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-slate-400">Click select</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-amber-400">⇧+Click pour</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-emerald-400">⌨ 1/2/3 R H E P T M</span>
            </div>
          </div>

          {/* Reaction in-progress overlay (top center) */}
          {reactingContainerId && reactionProgress > 0 && (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/80 px-4 py-1.5 backdrop-blur">
                <Zap className="h-3 w-3 animate-pulse text-amber-400" />
                <span className="text-[10px] font-medium text-amber-200">
                  Reaction in {reactingContainerId.toUpperCase()}
                </span>
                <div className="ml-1 h-1 w-16 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-200"
                    style={{ width: `${reactionProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active alerts indicator */}
          {(dangerCount > 0 || warningCount > 0) && (
            <div className="absolute right-4 top-4 flex flex-col gap-1">
              {dangerCount > 0 && (
                <Badge className="animate-pulse border-red-500 bg-red-600 text-white">
                  ⚠ {dangerCount} Danger
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className="border-amber-500 bg-amber-600 text-white">
                  {warningCount} Warning
                </Badge>
              )}
            </div>
          )}
        </main>

        {/* Right panel — Instruments / Safety / AI / Saves / Journal */}
        <aside className="flex w-96 flex-shrink-0 flex-col border-l border-slate-800 bg-slate-950/50">
          {/* Right panel tabs */}
          <div className="flex gap-1 border-b border-slate-800 bg-slate-950/50 p-2">
            {rightPanelTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRightPanel(tab.id)}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all",
                    rightPanel === tab.id
                      ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm shadow-emerald-500/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-hidden">
            {rightPanel === "instruments" && (
              <div className="h-full overflow-y-auto p-3">
                <InstrumentPanel />
              </div>
            )}
            {rightPanel === "safety" && (
              <div className="h-full overflow-y-auto p-3">
                <SafetyPanel />
              </div>
            )}
            {rightPanel === "assistant" && <AIAssistant />}
            {rightPanel === "saves" && (
              <div className="h-full p-3">
                <SaveLoadPanel />
              </div>
            )}
            {rightPanel === "journal" && (
              <div className="h-full p-3">
                <LabJournal />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
