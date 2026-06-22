"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ChemicalShelf } from "@/components/ui-panels/ChemicalShelf";
import { InstrumentPanel } from "@/components/ui-panels/InstrumentPanel";
import { SafetyPanel } from "@/components/ui-panels/SafetyPanel";
import { LabJournal } from "@/components/ui-panels/LabJournal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  PanelLeft,
  PanelRight,
  Shield,
  BookOpen,
  Beaker,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import type { ChemicalData, ReactionData, ContainerState, GHSHazard } from "@/lib/chemistry/types";

const LabScene = dynamic(
  () => import("@/components/lab/LabScene").then((m) => m.LabScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400">Loading 3D Lab Environment...</p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializeLab = useLabStore((s) => s.initializeLab);
  const resetLab = useLabStore((s) => s.resetLab);
  const showChemicalShelf = useLabStore((s) => s.showChemicalShelf);
  const showInstrumentPanel = useLabStore((s) => s.showInstrumentPanel);
  const showLabJournal = useLabStore((s) => s.showLabJournal);
  const showSafetyPanel = useLabStore((s) => s.showSafetyPanel);
  const toggleChemicalShelf = useLabStore((s) => s.toggleChemicalShelf);
  const toggleInstrumentPanel = useLabStore((s) => s.toggleInstrumentPanel);
  const toggleLabJournal = useLabStore((s) => s.toggleLabJournal);
  const toggleSafetyPanel = useLabStore((s) => s.toggleSafetyPanel);
  const chemicals = useLabStore((s) => s.chemicals);
  const reactions = useLabStore((s) => s.reactions);

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

        // Default containers
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
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Unknown error");
        setLoading(false);
      }
    }
    load();
  }, [initializeLab]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <FlaskConical className="mb-4 h-16 w-16 animate-pulse text-emerald-400" />
        <h1 className="mb-2 text-2xl font-bold">The Molecular Sandbox</h1>
        <p className="text-slate-400">Initializing chemistry engine...</p>
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

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950">
      {/* Top header bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">The Molecular Sandbox</h1>
            <p className="text-[10px] text-slate-400">
              3D Chemistry Simulator · {chemicals.length} chemicals · {reactions.length} reactions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant={showChemicalShelf ? "default" : "ghost"}
            size="sm"
            onClick={toggleChemicalShelf}
            className={
              showChemicalShelf
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "text-slate-400 hover:text-white"
            }
          >
            <PanelLeft className="mr-1.5 h-3.5 w-3.5" />
            Shelf
          </Button>
          <Button
            variant={showInstrumentPanel ? "default" : "ghost"}
            size="sm"
            onClick={toggleInstrumentPanel}
            className={
              showInstrumentPanel
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "text-slate-400 hover:text-white"
            }
          >
            <Beaker className="mr-1.5 h-3.5 w-3.5" />
            Lab
          </Button>
          <Button
            variant={showSafetyPanel ? "default" : "ghost"}
            size="sm"
            onClick={toggleSafetyPanel}
            className={
              showSafetyPanel
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "text-slate-400 hover:text-white"
            }
          >
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Safety
          </Button>
          <Button
            variant={showLabJournal ? "default" : "ghost"}
            size="sm"
            onClick={toggleLabJournal}
            className={
              showLabJournal
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "text-slate-400 hover:text-white"
            }
          >
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Journal
          </Button>
          <div className="mx-2 h-6 w-px bg-slate-700" />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetLab}
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Chemical Shelf */}
        {showChemicalShelf && (
          <aside className="w-80 flex-shrink-0 border-r border-slate-800">
            <ChemicalShelf />
          </aside>
        )}

        {/* Center — 3D Scene */}
        <main className="relative flex-1">
          <LabScene />

          {/* Overlay: reaction info badge */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
            <Badge
              variant="outline"
              className="border-slate-600 bg-slate-900/80 px-3 py-1 text-xs text-slate-300 backdrop-blur"
            >
              Drag to rotate · Scroll to zoom · Click beaker to select
            </Badge>
          </div>
        </main>

        {/* Right panel — Instruments + Safety + Journal */}
        {(showInstrumentPanel || showSafetyPanel || showLabJournal) && (
          <aside className="flex w-80 flex-shrink-0 flex-col gap-3 overflow-y-auto border-l border-slate-800 bg-slate-950/50 p-3">
            {showInstrumentPanel && <InstrumentPanel />}
            {showSafetyPanel && <SafetyPanel />}
            {showLabJournal && <LabJournal />}
          </aside>
        )}
      </div>
    </div>
  );
}
