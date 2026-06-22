"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trash2, Thermometer, Zap, Clock } from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";

export function LabJournal() {
  const journalEntries = useLabStore((s) => s.journalEntries);
  const clearJournal = useLabStore((s) => s.clearJournal);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
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
            journalEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
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
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
