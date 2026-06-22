"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles,
  FlaskConical,
  AlertTriangle,
  Eye,
  Play,
  CheckCircle2,
  Beaker as BeakerIcon,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import { presetExperiments, type PresetExperiment } from "@/lib/chemistry/presets";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const difficultyColors: Record<PresetExperiment["difficulty"], string> = {
  beginner: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  intermediate: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  advanced: "bg-red-500/20 text-red-300 border-red-500/30",
};

const categoryIcons: Record<PresetExperiment["category"], string> = {
  "acid-base": "⚗️",
  precipitation: "💎",
  gas: "💨",
  displacement: "🔄",
  decomposition: "🔥",
};

export function PresetExperiments() {
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const containers = useLabStore((s) => s.containers);
  const addChemicalToContainer = useLabStore((s) => s.addChemicalToContainer);
  const emptyContainer = useLabStore((s) => s.emptyContainer);
  const selectContainer = useLabStore((s) => s.selectContainer);
  const triggerReaction = useLabStore((s) => s.triggerReaction);
  const resetLab = useLabStore((s) => s.resetLab);
  const [runningId, setRunningId] = useState<string | null>(null);

  const runExperiment = (exp: PresetExperiment) => {
    setRunningId(exp.id);
    // Reset lab first
    resetLab();
    // Wait a tick for reset to apply, then add chemicals
    setTimeout(() => {
      let addedCount = 0;
      for (const step of exp.steps) {
        const chem = Array.from(chemicalsMap.values()).find(
          (c) => c.name === step.chemicalName
        );
        if (chem) {
          addChemicalToContainer(step.beakerId, chem.id, step.volume);
          addedCount++;
        }
      }
      toast.success(`Loaded "${exp.name}"`, {
        description: `${addedCount} chemicals added. Select a beaker and click React!`,
      });
      setRunningId(null);
    }, 100);
  };

  const runAndReact = (exp: PresetExperiment) => {
    setRunningId(exp.id);
    resetLab();
    setTimeout(() => {
      // Add all reactants to beaker-1 to trigger reaction
      for (const step of exp.steps) {
        const chem = Array.from(chemicalsMap.values()).find(
          (c) => c.name === step.chemicalName
        );
        if (chem) {
          addChemicalToContainer("beaker-1", chem.id, step.volume);
        }
      }
      // Trigger reaction after a short delay
      setTimeout(() => {
        selectContainer("beaker-1");
        triggerReaction("beaker-1");
        toast.success(`Reaction triggered: ${exp.name}`, {
          description: exp.expectedEquation,
        });
        setRunningId(null);
      }, 300);
    }, 100);
  };

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="border-b border-slate-700/50 p-4">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Preset Experiments</h2>
        </div>
        <p className="text-xs text-slate-400">
          One-click guided recipes. Loads chemicals into beakers automatically.
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {presetExperiments.map((exp) => (
            <div
              key={exp.id}
              className="group overflow-hidden rounded-lg border border-slate-700/50 bg-slate-800/40 transition-all hover:border-slate-600"
            >
              {/* Header with color stripe */}
              <div
                className="h-1 w-full"
                style={{ backgroundColor: exp.color }}
              />
              <div className="p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[exp.category]}</span>
                    <h3 className="text-sm font-bold text-white">{exp.name}</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border text-[9px] uppercase",
                      difficultyColors[exp.difficulty]
                    )}
                  >
                    {exp.difficulty}
                  </Badge>
                </div>

                <p className="mb-2 text-xs text-slate-400">{exp.description}</p>

                {/* Equation */}
                <div className="mb-2 rounded bg-slate-950/60 px-2 py-1.5 font-mono text-[11px] text-cyan-300">
                  {exp.expectedEquation}
                </div>

                {/* Stats */}
                <div className="mb-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <FlaskConical className="h-2.5 w-2.5" />
                    {exp.steps.length} reagents
                  </span>
                  <span className="flex items-center gap-1">
                    🔥 ΔH = {exp.expectedDeltaH} kJ/mol
                  </span>
                </div>

                {/* Safety note */}
                {exp.safetyNote && (
                  <div className="mb-2 flex items-start gap-1.5 rounded bg-yellow-950/30 p-2 text-[10px] text-yellow-300">
                    <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                    <span>{exp.safetyNote}</span>
                  </div>
                )}

                {/* Steps accordion */}
                <Accordion type="single" collapsible>
                  <AccordionItem value={`steps-${exp.id}`} className="border-0">
                    <AccordionTrigger className="py-1.5 text-xs text-slate-400 hover:no-underline">
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3 w-3" />
                        View steps & expected result
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-1.5">
                        {exp.steps.map((step, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded bg-slate-800/60 px-2 py-1 text-[11px]"
                          >
                            <BeakerIcon className="h-3 w-3 text-emerald-400" />
                            <span className="font-mono text-slate-500">
                              {step.beakerId}
                            </span>
                            <span className="flex-1 text-slate-300">
                              {step.chemicalName}
                            </span>
                            <span className="font-mono text-cyan-300">
                              {step.volume}mL
                            </span>
                          </div>
                        ))}
                        <div className="mt-2 rounded bg-emerald-950/30 p-2 text-[10px] text-emerald-300">
                          <strong>Expected:</strong> {exp.observation}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Action buttons */}
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runExperiment(exp)}
                    disabled={runningId === exp.id}
                    className="h-7 border-slate-600 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Load
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => runAndReact(exp)}
                    disabled={runningId === exp.id}
                    className="h-7 bg-emerald-600 text-xs hover:bg-emerald-500"
                  >
                    <Play className="mr-1 h-3 w-3" />
                    Run & React
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
