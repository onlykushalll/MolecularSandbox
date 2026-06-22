"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Trash2,
  Thermometer,
  Zap,
  Clock,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Microscope,
  Globe2,
  Info,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import {
  REACTION_TYPE_LABELS,
  REACTION_TYPE_COLORS,
} from "@/lib/chemistry/mechanisms";
import type { ReactionType } from "@/lib/chemistry/types";
import { cn } from "@/lib/utils";

export function LabJournal() {
  const journalEntries = useLabStore((s) => s.journalEntries);
  const clearJournal = useLabStore((s) => s.clearJournal);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats summary at the top
  const stats = {
    total: journalEntries.length,
    exothermic: journalEntries.filter((e) => (e.temperatureChange || 0) > 20).length,
    endothermic: journalEntries.filter((e) => (e.temperatureChange || 0) < 0).length,
    types: new Set(journalEntries.map((e) => e.reactionType).filter(Boolean)).size,
  };

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-700/50 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Lab Journal</h2>
          <Badge variant="secondary" className="bg-slate-700 text-slate-200">
            {journalEntries.length}
          </Badge>
        </div>
        {journalEntries.length > 0 && (
          <Button
            onClick={clearJournal}
            variant="ghost"
            size="sm"
            className="h-7 text-slate-400 hover:text-white"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Stats summary */}
      {journalEntries.length > 0 && (
        <div className="border-b border-slate-700/50 bg-slate-800/30 px-4 py-2">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-emerald-400">{stats.total}</div>
              <div className="text-[8px] text-slate-500 uppercase">Total</div>
            </div>
            <div>
              <div className="text-sm font-bold text-red-400">{stats.exothermic}</div>
              <div className="text-[8px] text-slate-500 uppercase">Exothermic</div>
            </div>
            <div>
              <div className="text-sm font-bold text-blue-400">{stats.endothermic}</div>
              <div className="text-[8px] text-slate-500 uppercase">Endothermic</div>
            </div>
            <div>
              <div className="text-sm font-bold text-purple-400">{stats.types}</div>
              <div className="text-[8px] text-slate-500 uppercase">Types</div>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {journalEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-2 h-10 w-10 text-slate-600" />
              <p className="text-sm text-slate-400">No experiments logged yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Perform reactions to populate your journal
              </p>
            </div>
          ) : (
            journalEntries.map((entry) => {
              const isExpanded = expandedIds.has(entry.id);
              const hasDetails = !!(entry.mechanism || entry.observation || entry.realWorldUse);
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 transition-all hover:border-slate-600/50"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">
                        {entry.reaction || "Experiment"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTime(entry.timestamp)}
                    </div>
                  </div>

                  {/* Reaction type badge */}
                  {entry.reactionType && (
                    <div className="mb-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-medium",
                          REACTION_TYPE_COLORS[entry.reactionType as ReactionType] ||
                            "border-slate-600 bg-slate-700/30 text-slate-300"
                        )}
                      >
                        {REACTION_TYPE_LABELS[entry.reactionType as ReactionType] || entry.reactionType}
                      </span>
                    </div>
                  )}

                  {entry.equation && (
                    <div className="mb-2 rounded bg-slate-950/50 px-2 py-1 font-mono text-[11px] text-cyan-300">
                      {entry.equation}
                    </div>
                  )}
                  <p className="text-xs text-slate-300">{entry.text}</p>
                  {entry.temperatureChange !== undefined &&
                    entry.temperatureChange !== 0 && (
                      <div className="mt-2 flex items-center gap-1 text-[10px]">
                        <Thermometer className="h-2.5 w-2.5" />
                        <span
                          className={
                            entry.temperatureChange > 0
                              ? "text-red-400"
                              : "text-blue-400"
                          }
                        >
                          ΔT = {entry.temperatureChange > 0 ? "+" : ""}
                          {entry.temperatureChange.toFixed(2)}°C
                        </span>
                      </div>
                    )}

                  {/* Expandable mechanism section */}
                  {hasDetails && (
                    <button
                      onClick={() => toggleExpand(entry.id)}
                      className="mt-2 flex w-full items-center gap-1 rounded border border-slate-700/50 bg-slate-900/50 px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <Info className="h-3 w-3 text-cyan-400" />
                      <span>{isExpanded ? "Hide" : "Show"} mechanism & insights</span>
                    </button>
                  )}

                  {isExpanded && hasDetails && (
                    <div className="mt-2 space-y-2">
                      {entry.mechanism && (
                        <div className="rounded-md border border-cyan-500/20 bg-cyan-950/20 p-2">
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-cyan-300">
                            <Microscope className="h-3 w-3" />
                            Mechanism
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-300">
                            {entry.mechanism}
                          </p>
                        </div>
                      )}
                      {entry.observation && (
                        <div className="rounded-md border border-amber-500/20 bg-amber-950/20 p-2">
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-amber-300">
                            <Lightbulb className="h-3 w-3" />
                            What to observe
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-300">
                            {entry.observation}
                          </p>
                        </div>
                      )}
                      {entry.realWorldUse && (
                        <div className="rounded-md border border-emerald-500/20 bg-emerald-950/20 p-2">
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                            <Globe2 className="h-3 w-3" />
                            Real-world applications
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-300">
                            {entry.realWorldUse}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
