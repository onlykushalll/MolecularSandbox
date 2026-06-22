"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import {
  Search,
  FlaskConical,
  Play,
  ArrowRight,
  Thermometer,
  Zap,
  Beaker,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import { cn } from "@/lib/utils";
import type { ReactionType, ReactionData } from "@/lib/chemistry/types";
import {
  REACTION_TYPE_LABELS,
  REACTION_TYPE_COLORS,
  getMechanismInfo,
} from "@/lib/chemistry/mechanisms";
import { toast } from "sonner";

export function ReactionLibrary() {
  const reactions = useLabStore((s) => s.reactions);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const containers = useLabStore((s) => s.containers);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const addChemicalToContainer = useLabStore((s) => s.addChemicalToContainer);
  const triggerReaction = useLabStore((s) => s.triggerReaction);
  const emptyContainer = useLabStore((s) => s.emptyContainer);
  const dragVolume = useLabStore((s) => s.dragVolume);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reactions.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.equation.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || r.reactionType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [reactions, search, typeFilter]);

  // Count reactions by type for the filter dropdown
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reactions) {
      counts[r.reactionType] = (counts[r.reactionType] || 0) + 1;
    }
    return counts;
  }, [reactions]);

  const handleTryIt = (reaction: ReactionData) => {
    if (!selectedContainerId) {
      toast.error("Select a beaker first", {
        description: "Click a beaker in the 3D scene (or press 1/2/3)",
      });
      return;
    }
    const container = containers.find((c) => c.id === selectedContainerId);
    if (!container) return;
    // Empty the beaker first for a clean demo
    emptyContainer(selectedContainerId);
    // Add each reactant with default volume
    setTimeout(() => {
      for (const reactant of reaction.reactants) {
        const chem = chemicalsMap.get(reactant.chemicalId);
        if (!chem) continue;
        // Use 50 mL per reactant (or 25 for solids)
        const vol = chem.stateAtSTP === "solid" ? Math.min(25, dragVolume) : Math.min(50, dragVolume);
        addChemicalToContainer(selectedContainerId, reactant.chemicalId, vol, false);
      }
      // Auto-trigger the reaction after a short delay
      setTimeout(() => {
        triggerReaction(selectedContainerId);
        toast.success(`Reaction triggered: ${reaction.name}`, {
          description: reaction.equation,
        });
      }, 400);
    }, 100);
  };

  const handleLoadReactants = (reaction: ReactionData) => {
    if (!selectedContainerId) {
      toast.error("Select a beaker first", {
        description: "Click a beaker in the 3D scene (or press 1/2/3)",
      });
      return;
    }
    for (const reactant of reaction.reactants) {
      const chem = chemicalsMap.get(reactant.chemicalId);
      if (!chem) continue;
      const vol = chem.stateAtSTP === "solid" ? Math.min(25, dragVolume) : Math.min(50, dragVolume);
      addChemicalToContainer(selectedContainerId, reactant.chemicalId, vol, false);
    }
    toast.info(`Reactants loaded`, {
      description: `${reaction.reactants.length} chemicals added to ${selectedContainerId.toUpperCase()}`,
    });
  };

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="border-b border-slate-700/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Reaction Library</h2>
          <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-200">
            {filtered.length}
          </Badge>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search reactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-700 bg-slate-800 pl-8 text-white placeholder:text-slate-500"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="all">All Types ({reactions.length})</SelectItem>
            {(Object.keys(REACTION_TYPE_LABELS) as ReactionType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {REACTION_TYPE_LABELS[type]} ({typeCounts[type] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
              <Search className="mx-auto mb-2 h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-500">No reactions match your search</p>
            </div>
          ) : (
            filtered.map((reaction) => {
              const isExpanded = expandedId === reaction.id;
              const mechInfo = getMechanismInfo(reaction.reactionType, {
                mechanism: reaction.mechanism,
                observation: reaction.observation,
                realWorldUse: reaction.realWorldUse,
              });
              const isExothermic = reaction.deltaH < 0;
              const typeColor = REACTION_TYPE_COLORS[reaction.reactionType];
              const borderClass = `border-l-${reaction.reactionType.replace(/_/g, "-")}`;
              return (
                <div
                  key={reaction.id}
                  className={cn(
                    "group rounded-lg border bg-slate-800/50 transition-all",
                    borderClass,
                    isExpanded
                      ? "border-purple-500/50 bg-slate-800 reaction-card-expanded"
                      : "border-slate-700/50 hover:border-purple-500/40 hover:bg-slate-800 hover-lift"
                  )}
                >
                  {/* Card header — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : reaction.id)}
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-white">
                            {reaction.name}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-xs text-slate-300">
                          {reaction.equation}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", typeColor)}>
                        {REACTION_TYPE_LABELS[reaction.reactionType]}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium",
                          isExothermic
                            ? "bg-red-500/15 text-red-300"
                            : "bg-blue-500/15 text-blue-300"
                        )}
                      >
                        <Thermometer className="h-2.5 w-2.5" />
                        {isExothermic ? "Exo" : "Endo"} · {reaction.deltaH} kJ/mol
                      </span>
                      {reaction.isReversible && (
                        <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] text-cyan-300">
                          ⇌ Reversible
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/50 p-3 fade-in-up">
                      {/* Reactants → Products breakdown */}
                      <div className="mb-3">
                        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Participants
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {reaction.reactants.map((r, i) => {
                            const chem = chemicalsMap.get(r.chemicalId);
                            return (
                              <div key={i} className="flex items-center gap-1">
                                {i > 0 && <span className="text-slate-500">+</span>}
                                <div className="flex items-center gap-1 rounded bg-slate-900/60 px-1.5 py-0.5">
                                  <div
                                    className="h-2 w-2 rounded-full border border-white/20"
                                    style={{ backgroundColor: chem?.hexColor || "#888" }}
                                  />
                                  <span className="text-[10px] text-slate-200">
                                    {r.coefficient > 1 ? `${r.coefficient}×` : ""}
                                    {chem?.name || "?"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          <ArrowRight className="h-3 w-3 text-slate-500" />
                          {reaction.products.map((p, i) => {
                            const chem = chemicalsMap.get(p.chemicalId);
                            return (
                              <div key={i} className="flex items-center gap-1">
                                {i > 0 && <span className="text-slate-500">+</span>}
                                <div className="flex items-center gap-1 rounded bg-emerald-900/30 px-1.5 py-0.5 ring-1 ring-emerald-500/20">
                                  <div
                                    className="h-2 w-2 rounded-full border border-white/20"
                                    style={{ backgroundColor: chem?.hexColor || "#888" }}
                                  />
                                  <span className="text-[10px] text-emerald-200">
                                    {p.coefficient > 1 ? `${p.coefficient}×` : ""}
                                    {chem?.name || "?"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mechanism */}
                      <div className="mb-3 rounded-md bg-slate-900/40 p-2">
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                          <Zap className="h-2.5 w-2.5" /> Mechanism
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {mechInfo.mechanism}
                        </p>
                      </div>

                      {/* Observation */}
                      <div className="mb-3 rounded-md bg-slate-900/40 p-2">
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                          <Sparkles className="h-2.5 w-2.5" /> What to observe
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {mechInfo.observation}
                        </p>
                      </div>

                      {/* Real-world use */}
                      {mechInfo.realWorldUse && (
                        <div className="mb-3 rounded-md bg-slate-900/40 p-2">
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                            <Beaker className="h-2.5 w-2.5" /> Real-world uses
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-300">
                            {mechInfo.realWorldUse}
                          </p>
                        </div>
                      )}

                      {/* Description */}
                      {reaction.description && (
                        <p className="mb-3 text-[11px] italic text-slate-400">
                          {reaction.description}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleTryIt(reaction)}
                          disabled={!selectedContainerId}
                          className="flex-1 bg-emerald-600 text-xs hover:bg-emerald-500 disabled:opacity-40"
                          title="Empty beaker, add reactants, and trigger the reaction"
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Try it
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadReactants(reaction)}
                          disabled={!selectedContainerId}
                          className="border-slate-600 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                          title="Add reactants without triggering"
                        >
                          Load reactants
                        </Button>
                      </div>
                      {!selectedContainerId && (
                        <p className="mt-1.5 text-center text-[9px] text-slate-500">
                          Select a beaker first
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {selectedContainerId && (
        <div className="border-t border-slate-700/50 bg-slate-950/50 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Beaker className="h-3 w-3" />
            <span>
              Target:{" "}
              <span className="font-mono text-emerald-400">
                {selectedContainerId}
              </span>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
