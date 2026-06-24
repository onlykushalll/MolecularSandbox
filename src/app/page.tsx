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
import { PeriodicTable } from "@/components/ui-panels/PeriodicTable";
import { SolubilityRulesPanel } from "@/components/ui-panels/SolubilityRules";
import { AchievementsPanel } from "@/components/ui-panels/AchievementsPanel";
import { ReactionLibrary } from "@/components/ui-panels/ReactionLibrary";
import { KineticsExplorer } from "@/components/ui-panels/KineticsExplorer";
import { TitrationSimulator } from "@/components/ui-panels/TitrationSimulator";
import { AnimatedCounter } from "@/components/ui-panels/AnimatedCounter";
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
  Trophy,
  Activity,
  Droplet,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
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

type LeftPanel = "shelf" | "presets" | "reactions" | "periodic-table" | "solubility" | "kinetics";
type RightPanel = "instruments" | "safety" | "assistant" | "journal" | "saves" | "achievements" | "titration";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [leftPanel, setLeftPanel] = useState<LeftPanel>("shelf");
  const [rightPanel, setRightPanel] = useState<RightPanel>("instruments");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
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

  // Session timer — counts up every second while app is loaded
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      // [ = toggle left sidebar
      if (key === "[") {
        setLeftCollapsed((v) => !v);
        if (state.soundEnabled) getSoundManager().play("click");
        return;
      }
      // ] = toggle right sidebar
      if (key === "]") {
        setRightCollapsed((v) => !v);
        if (state.soundEnabled) getSoundManager().play("click");
        return;
      }
      // F = toggle focus/zen mode (collapse both)
      if (key === "f") {
        setFocusMode((v) => {
          const next = !v;
          if (next) {
            setLeftCollapsed(true);
            setRightCollapsed(true);
          } else {
            setLeftCollapsed(false);
            setRightCollapsed(false);
          }
          if (state.soundEnabled) getSoundManager().play("click");
          return next;
        });
        return;
      }
      // Escape = deselect (or exit focus mode first)
      if (key === "escape") {
        if (focusMode) {
          setFocusMode(false);
          setLeftCollapsed(false);
          setRightCollapsed(false);
          return;
        }
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
    focusMode,
  ]);

  // Sync focus mode with individual collapse states
  useEffect(() => {
    if (!leftCollapsed && !rightCollapsed) {
      setFocusMode(false);
    } else if (leftCollapsed && rightCollapsed) {
      setFocusMode(true);
    }
  }, [leftCollapsed, rightCollapsed]);

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

  // Achievement unlock listener — listens for custom events from the lab-store
  // and displays toast notifications for each newly unlocked achievement.
  useEffect(() => {
    const handler = () => {
      const queue = (window as unknown as { __achievementQueue?: Array<{ id: string; title: string; description: string; icon: string }> }).__achievementQueue;
      if (!queue || queue.length === 0) return;
      for (const a of queue.splice(0, queue.length)) {
        toast.success(`🏆 ${a.title}`, {
          description: a.description,
          duration: 5000,
        });
      }
      // Auto-switch to achievements tab on first unlock
      setRightPanel("achievements");
    };
    window.addEventListener("achievements-unlocked", handler);
    return () => window.removeEventListener("achievements-unlocked", handler);
  }, []);

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
        // Show welcome modal on first visit
        const hasVisited = localStorage.getItem("molecular-sandbox-visited");
        if (!hasVisited) {
          setShowWelcome(true);
          localStorage.setItem("molecular-sandbox-visited", "true");
        }
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
    { id: "reactions", label: "Rxns", icon: FlaskConical },
    { id: "kinetics", label: "Kinetics", icon: Activity },
    { id: "periodic-table", label: "Elements", icon: Atom },
    { id: "solubility", label: "Solubility", icon: BookOpen },
  ];
  const rightPanelTabs: { id: RightPanel; label: string; icon: typeof Bot; badge?: number }[] = [
    { id: "instruments", label: "Lab", icon: FlaskConical },
    { id: "titration", label: "Titrate", icon: Droplet },
    { id: "safety", label: "Safety", icon: Shield, badge: dangerCount || undefined },
    { id: "assistant", label: "AI", icon: Bot },
    { id: "saves", label: "Save", icon: Save },
    { id: "achievements", label: "Awards", icon: Trophy },
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

      {/* Welcome modal */}
      {showWelcome && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 shadow-lg shadow-emerald-500/30">
                <FlaskConical className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Welcome to The Molecular Sandbox</h2>
                <p className="text-sm text-slate-400">A 3D Chemistry Simulator</p>
              </div>
            </div>

            <div className="mb-4 space-y-3 text-sm text-slate-300">
              <p className="font-medium text-white">Get started in 3 easy steps:</p>
              <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-xs font-bold text-emerald-400">1</span>
                <div>
                  <p className="font-medium text-emerald-300">Select a beaker</p>
                  <p className="text-xs text-slate-400">Click a beaker in the 3D scene, or press 1/2/3</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/30 text-xs font-bold text-cyan-400">2</span>
                <div>
                  <p className="font-medium text-cyan-300">Add chemicals</p>
                  <p className="text-xs text-slate-400">Use the Chemical Shelf on the left to add reagents</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/30 text-xs font-bold text-purple-400">3</span>
                <div>
                  <p className="font-medium text-purple-300">React & observe</p>
                  <p className="text-xs text-slate-400">Click React (or R key) to trigger the reaction. Watch the 3D effects!</p>
                </div>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
              <p className="font-semibold">💡 Pro tips:</p>
              <ul className="mt-1 space-y-0.5 text-amber-300/80">
                <li>• Try the Presets tab for one-click experiments</li>
                <li>• Switch container types (Erlenmeyer, Test Tube, Round Flask)</li>
                <li>• Check the Elements tab for the Periodic Table</li>
                <li>• Shift-click a second beaker to pour between them</li>
                <li>• Press H to heat, T for pH strip, M to mute sounds</li>
              </ul>
            </div>

            <Button
              onClick={() => setShowWelcome(false)}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500"
            >
              Start Experimenting
            </Button>
          </div>
        </div>
      )}

      {/* Top header bar — elevated with deeper glass + depth */}
      <header className="relative flex h-16 items-center justify-between overflow-hidden border-b border-slate-800/80 header-elevated px-4">
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
        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.5), rgba(6, 182, 212, 0.5), transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 shadow-lg shadow-emerald-500/30 inner-sheen">
            <FlaskConical className="h-5 w-5 text-white relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-transparent" />
            {/* Animated pulse ring */}
            <div className="absolute inset-0 animate-ping rounded-xl bg-emerald-500/20" style={{ animationDuration: "3s" }} />
            {/* Corner accent */}
            <div className="absolute -inset-0.5 rounded-xl border border-emerald-400/30" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-base font-bold text-transparent glow-emerald">
              The Molecular Sandbox
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 hover-dot">
                <Atom className="h-2.5 w-2.5 text-emerald-400" />
                <AnimatedCounter value={chemicals.length} className="number-ticker font-medium text-slate-300" />
                <span className="text-slate-500">chemicals</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 hover-dot">
                <FlaskConical className="h-2.5 w-2.5 text-cyan-400" />
                <AnimatedCounter value={reactions.length} className="number-ticker font-medium text-slate-300" />
                <span className="text-slate-500">reactions</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 hover-dot">
                <Shield className={cn("h-2.5 w-2.5", ppeCount >= 3 ? "text-emerald-400" : "text-yellow-400")} />
                <span className={cn("h-1.5 w-1.5 rounded-full", ppeCount >= 3 ? "bg-emerald-400 status-blink" : "bg-yellow-400 status-blink")} />
                <AnimatedCounter value={ppeCount} className="number-ticker font-medium text-slate-300" />/4 PPE
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 hover-dot">
                <Droplet className="h-2.5 w-2.5 text-cyan-400" />
                <AnimatedCounter value={totalVolume} decimals={0} className="number-ticker font-medium text-cyan-300" />
                <span className="text-slate-500">mL total</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: beaker selection status */}
        <div className="relative hidden md:flex items-center gap-2">
          {selectedContainerId ? (
            <Badge className="border-emerald-500/40 bg-emerald-950/40 text-emerald-300 selection-ring-pulse">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400 status-blink" />
              {selectedContainerId.toUpperCase()}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-700 bg-slate-900/40 text-slate-500">
              No beaker selected
            </Badge>
          )}
          {secondaryContainerId && (
            <>
              <span className="text-amber-400 font-bold animate-pulse">→</span>
              <Badge className="border-amber-500/40 bg-amber-950/40 text-amber-300 secondary-ring-pulse">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-400 status-blink" />
                {secondaryContainerId.toUpperCase()}
              </Badge>
            </>
          )}
        </div>

        <div className="relative flex items-center gap-1.5">
          {/* Focus mode toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = !focusMode;
              setFocusMode(next);
              setLeftCollapsed(next);
              setRightCollapsed(next);
              if (soundEnabled) getSoundManager().play("click");
            }}
            className={cn(
              "btn-premium h-8 px-2 text-xs",
              focusMode
                ? "text-emerald-400 hover:bg-emerald-950/40"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
            title="Focus mode (F) — hide both panels"
          >
            {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          {/* Left sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLeftCollapsed((v) => !v);
              if (soundEnabled) getSoundManager().play("click");
            }}
            className={cn(
              "btn-premium h-8 px-2 text-xs",
              !leftCollapsed
                ? "text-cyan-400 hover:bg-cyan-950/40"
                : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            )}
            title="Toggle left panel ([)"
          >
            {leftCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
          </Button>
          {/* Right sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRightCollapsed((v) => !v);
              if (soundEnabled) getSoundManager().play("click");
            }}
            className={cn(
              "btn-premium h-8 px-2 text-xs",
              !rightCollapsed
                ? "text-cyan-400 hover:bg-cyan-950/40"
                : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            )}
            title="Toggle right panel (])"
          >
            {rightCollapsed ? <PanelRightOpen className="h-3.5 w-3.5" /> : <PanelRightClose className="h-3.5 w-3.5" />}
          </Button>
          <div className="mx-1 h-5 w-px bg-slate-700" />
          {/* Sound toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSound()}
            className={cn(
              "btn-premium h-8 px-2 text-xs",
              soundEnabled
                ? "text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300"
                : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            )}
            title="Toggle sound (M)"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="btn-premium h-8 px-3 text-xs text-slate-300 hover:text-white"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Shelf / Presets (collapsible) */}
        <aside
          className={cn(
            "relative flex flex-shrink-0 flex-col sidebar-transition border-r border-slate-800/60 dotted-texture",
            leftCollapsed ? "w-12 sidebar-rail" : "w-80 bg-slate-950/50"
          )}
        >
          {/* Floating toggle button on the border */}
          <button
            onClick={() => {
              setLeftCollapsed((v) => !v);
              if (soundEnabled) getSoundManager().play("click");
            }}
            className={cn(
              "sidebar-toggle-btn left",
              leftCollapsed && "collapsed toggle-hint-pulse"
            )}
            title={leftCollapsed ? "Expand left panel ( [ )" : "Collapse left panel ( [ )"}
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>

          {/* Collapsed rail — icon-only vertical tabs */}
          {leftCollapsed && (
            <div className="sidebar-slide-in flex flex-col items-center gap-1.5 py-3">
              {leftPanelTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (leftPanel === tab.id) {
                        setLeftCollapsed(false);
                      } else {
                        setLeftPanel(tab.id);
                        setLeftCollapsed(false);
                      }
                      if (soundEnabled) getSoundManager().play("click");
                    }}
                    data-tooltip={tab.label}
                    className={cn("rail-btn", leftPanel === tab.id && "active")}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Expanded panel content */}
          {!leftCollapsed && (
            <div className="sidebar-expanded-content flex h-full flex-col">
              {/* Left panel tabs */}
              <div className="flex gap-1 border-b border-slate-800 bg-slate-950/80 p-2">
                {leftPanelTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setLeftPanel(tab.id)}
                      className={cn(
                        "tab-indicator tab-switch-smooth relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium",
                        leftPanel === tab.id
                          ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm shadow-emerald-500/30 tab-glow-active inner-sheen"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-white hover:scale-105"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 transition-transform", leftPanel === tab.id && "scale-110")} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div key={`left-${leftPanel}`} className="flex-1 overflow-hidden panel-fade">
                {leftPanel === "shelf" && <ChemicalShelf />}
                {leftPanel === "presets" && <PresetExperiments />}
                {leftPanel === "reactions" && <ReactionLibrary />}
                {leftPanel === "kinetics" && <KineticsExplorer />}
                {leftPanel === "periodic-table" && <PeriodicTable />}
                {leftPanel === "solubility" && <SolubilityRulesPanel />}
              </div>
            </div>
          )}
        </aside>

        {/* Center — 3D Scene */}
        <main className="relative flex-1">
          <LabScene />

          {/* Top-left overlay: scene info */}
          <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-slate-900/80 px-3 py-1 text-xs text-emerald-300 backdrop-blur shadow-lg shadow-emerald-950/30 inner-sheen"
            >
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 status-blink" />
              Lab Active
            </Badge>
            {/* Mini stats card */}
            <div className="pointer-events-none rounded-lg border border-slate-700/60 bg-slate-900/80 px-3 py-2 backdrop-blur shadow-xl corner-accent">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="stat-tile-pop">
                  <div className="text-base font-bold text-emerald-400 glow-emerald">{containers.length}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Beakers</div>
                </div>
                <div className="stat-tile-pop">
                  <div className="text-base font-bold text-cyan-400 glow-cyan">{totalContents}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Contents</div>
                </div>
                <div className="stat-tile-pop">
                  <div className="text-base font-bold text-purple-400 glow-purple">{totalVolume.toFixed(0)}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">mL total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom overlay: controls hint — with sidebar toggle hints */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/85 px-4 py-1.5 backdrop-blur shadow-xl inner-sheen">
              <span className="text-[10px] text-slate-400">🖱️ Drag</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-slate-400">Scroll</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-slate-400">Click</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-amber-400 hover-dot">⇧+Click pour</span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 glow-emerald">
                <span className="kbd-hint">[</span>
                <span className="kbd-hint">]</span>
                <span className="kbd-hint">F</span>
                panels
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-cyan-400">⌨ 1/2/3 R H E P T M</span>
            </div>
          </div>

          {/* Reaction in-progress overlay (top center) */}
          {reactingContainerId && reactionProgress > 0 && (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-950/85 px-4 py-1.5 backdrop-blur shadow-xl shadow-amber-900/40 inner-sheen indicator-breathe">
                <Zap className="h-3 w-3 animate-pulse text-amber-400" />
                <span className="text-[10px] font-medium text-amber-200 glow-amber">
                  Reaction in {reactingContainerId.toUpperCase()}
                </span>
                <div className="ml-1 h-1 w-20 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-200 progress-shine"
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
                <Badge className="border-red-400 bg-red-600/90 text-white shadow-lg shadow-red-900/40 danger-pulse inner-sheen">
                  ⚠ {dangerCount} Danger
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className="border-amber-400 bg-amber-600/90 text-white shadow-lg shadow-amber-900/40 inner-sheen">
                  {warningCount} Warning
                </Badge>
              )}
            </div>
          )}

          {/* Quick Stats floating widget — bottom-right of 3D scene */}
          <div className="pointer-events-none absolute bottom-4 right-4">
            <div className="glass-premium rounded-lg p-2.5 shadow-xl">
              <div className="mb-1.5 flex items-center gap-1.5 border-b border-slate-700/50 pb-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 timer-pulse" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  Session
                </span>
                <span className="ml-auto font-mono text-[11px] font-bold text-emerald-300">
                  {Math.floor(sessionTime / 60)}:{String(sessionTime % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="stat-tile-pop">
                  <div className="text-sm font-bold text-emerald-400">{containers.length}</div>
                  <div className="text-[7px] uppercase text-slate-500">Beakers</div>
                </div>
                <div className="stat-tile-pop">
                  <div className="text-sm font-bold text-cyan-400">{totalContents}</div>
                  <div className="text-[7px] uppercase text-slate-500">Items</div>
                </div>
                <div className="stat-tile-pop">
                  <div className="text-sm font-bold text-purple-400">{totalVolume.toFixed(0)}</div>
                  <div className="text-[7px] uppercase text-slate-500">mL</div>
                </div>
              </div>
              {(dangerCount > 0 || warningCount > 0) && (
                <div className="mt-1.5 border-t border-slate-700/50 pt-1.5 text-center">
                  <span className={cn(
                    "text-[9px] font-medium",
                    dangerCount > 0 ? "text-red-300" : "text-amber-300"
                  )}>
                    {dangerCount > 0 ? `⚠ ${dangerCount} danger alert${dangerCount > 1 ? "s" : ""}` : `⚠ ${warningCount} warning${warningCount > 1 ? "s" : ""}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right panel — Instruments / Safety / AI / Saves / Journal (collapsible) */}
        <aside
          className={cn(
            "relative flex flex-shrink-0 flex-col sidebar-transition border-l border-slate-800/60 dotted-texture",
            rightCollapsed ? "w-12 sidebar-rail sidebar-rail-right" : "w-96 bg-slate-950/50"
          )}
        >
          {/* Floating toggle button on the border */}
          <button
            onClick={() => {
              setRightCollapsed((v) => !v);
              if (soundEnabled) getSoundManager().play("click");
            }}
            className={cn(
              "sidebar-toggle-btn right",
              rightCollapsed && "collapsed toggle-hint-pulse"
            )}
            title={rightCollapsed ? "Expand right panel ( ] )" : "Collapse right panel ( ] )"}
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </button>

          {/* Collapsed rail — icon-only vertical tabs */}
          {rightCollapsed && (
            <div className="sidebar-slide-in-right flex flex-col items-center gap-1.5 py-3">
              {rightPanelTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (rightPanel === tab.id) {
                        setRightCollapsed(false);
                      } else {
                        setRightPanel(tab.id);
                        setRightCollapsed(false);
                      }
                      if (soundEnabled) getSoundManager().play("click");
                    }}
                    data-tooltip={tab.label}
                    className={cn("rail-btn relative", rightPanel === tab.id && "active")}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.badge && tab.badge > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white status-blink border border-red-300/50">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Expanded panel content */}
          {!rightCollapsed && (
            <div className="sidebar-expanded-content flex h-full flex-col">
              {/* Right panel tabs */}
              <div className="flex gap-1 border-b border-slate-800 bg-slate-950/80 p-2">
                {rightPanelTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRightPanel(tab.id)}
                      className={cn(
                        "tab-indicator tab-switch-smooth relative flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium",
                        rightPanel === tab.id
                          ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm shadow-emerald-500/30 tab-glow-active inner-sheen"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-white hover:scale-105"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 transition-transform", rightPanel === tab.id && "scale-110")} />
                      {tab.label}
                      {tab.badge && tab.badge > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white status-blink border border-red-300/50">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div key={`right-${rightPanel}`} className="flex-1 overflow-hidden panel-fade">
                {rightPanel === "instruments" && (
                  <div className="h-full overflow-y-auto p-3">
                    <InstrumentPanel />
                  </div>
                )}
                {rightPanel === "titration" && (
                  <div className="h-full overflow-y-auto p-3">
                    <TitrationSimulator />
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
                {rightPanel === "achievements" && (
                  <div className="h-full p-3">
                    <AchievementsPanel />
                  </div>
                )}
                {rightPanel === "journal" && (
                  <div className="h-full p-3">
                    <LabJournal />
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
