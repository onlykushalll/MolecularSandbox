"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { ChemicalShelf } from "@/components/ui-panels/ChemicalShelf";
import { InstrumentPanel } from "@/components/ui-panels/InstrumentPanel";
import { SafetyPanel } from "@/components/ui-panels/SafetyPanel";
import { LabJournal } from "@/components/ui-panels/LabJournal";
import { PresetExperiments } from "@/components/ui-panels/PresetExperiments";
import { AIAssistant } from "@/components/ui-panels/AIAssistant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  PanelLeft,
  Shield,
  BookOpen,
  Beaker,
  RotateCcw,
  Loader2,
  Sparkles,
  Bot,
  Wind,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import type { ChemicalData, ReactionData, ContainerState } from "@/lib/chemistry/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
type RightPanel = "instruments" | "safety" | "journal" | "assistant";

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

  // Heating tick — runs every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      heatingTick();
    }, 500);
    return () => clearInterval(interval);
  }, [heatingTick]);

  // Reaction flash effect + toast
  useEffect(() => {
    if (lastReactionResult && lastReactionResult !== prevReactionRef.current) {
      prevReactionRef.current = lastReactionResult;
      setFlashKey((k) => k + 1);
      const deltaT = lastReactionResult.temperatureChange;
      toast.success("Reaction Complete!", {
        description: `${lastReactionResult.reaction.equation} · ΔT = ${deltaT > 0 ? "+" : ""}${deltaT.toFixed(1)}°C`,
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

  const leftPanelTabs: { id: LeftPanel; label: string; icon: typeof Beaker }[] = [
    { id: "shelf", label: "Shelf", icon: Beaker },
    { id: "presets", label: "Presets", icon: Sparkles },
  ];
  const rightPanelTabs: { id: RightPanel; label: string; icon: typeof Bot; badge?: number }[] = [
    { id: "instruments", label: "Lab", icon: FlaskConical },
    { id: "safety", label: "Safety", icon: Shield, badge: dangerCount || undefined },
    { id: "assistant", label: "AI", icon: Bot },
    { id: "journal", label: "Journal", icon: BookOpen },
  ];

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

      {/* Top header bar */}
      <header className="relative flex h-16 items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 shadow-lg shadow-emerald-500/20">
            <FlaskConical className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-transparent" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-base font-bold text-transparent">
              The Molecular Sandbox
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{chemicals.length} chemicals</span>
              <span className="text-slate-600">·</span>
              <span>{reactions.length} reactions</span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", ppeCount >= 3 ? "bg-emerald-400" : "bg-yellow-400")} />
                {ppeCount}/4 PPE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Shelf / Presets */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-r border-slate-800">
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
                      ? "bg-emerald-600 text-white shadow-sm"
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
          <div className="pointer-events-none absolute left-4 top-4">
            <Badge
              variant="outline"
              className="border-slate-600/50 bg-slate-900/70 px-3 py-1 text-xs text-slate-300 backdrop-blur"
            >
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Lab Active
            </Badge>
          </div>

          {/* Bottom overlay: controls hint */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/80 px-4 py-1.5 backdrop-blur">
              <span className="text-[10px] text-slate-400">🖱️ Drag to rotate</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-slate-400">Scroll to zoom</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-slate-400">Click beaker to select</span>
            </div>
          </div>

          {/* Active alerts indicator */}
          {dangerCount > 0 && (
            <div className="absolute right-4 top-4 animate-pulse">
              <Badge className="border-red-500 bg-red-600 text-white">
                {dangerCount} Danger
              </Badge>
            </div>
          )}
        </main>

        {/* Right panel — Instruments / Safety / AI / Journal */}
        <aside className="flex w-96 flex-shrink-0 flex-col border-l border-slate-800">
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
                      ? "bg-emerald-600 text-white shadow-sm"
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
