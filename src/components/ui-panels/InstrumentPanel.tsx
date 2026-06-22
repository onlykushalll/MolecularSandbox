"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Thermometer,
  Gauge,
  FlaskConical,
  Flame,
  Zap,
  Trash2,
  Play,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";

export function InstrumentPanel() {
  const containers = useLabStore((s) => s.containers);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const triggerReaction = useLabStore((s) => s.triggerReaction);
  const emptyContainer = useLabStore((s) => s.emptyContainer);
  const setContainerHeating = useLabStore((s) => s.setContainerHeating);
  const lastReactionResult = useLabStore((s) => s.lastReactionResult);

  const selected = containers.find((c) => c.id === selectedContainerId);

  if (!selected) {
    return (
      <Card className="border-slate-700/50 bg-slate-900/95 p-4 backdrop-blur">
        <div className="flex items-center gap-2 text-slate-400">
          <FlaskConical className="h-5 w-5" />
          <h2 className="text-sm font-semibold">Instruments</h2>
        </div>
        <Separator className="my-3 bg-slate-700" />
        <p className="text-xs text-slate-500">
          Click a beaker in the scene to view instrument readings.
        </p>
      </Card>
    );
  }

  const totalVolume = selected.contents.reduce((s, c) => s + c.volume, 0);
  const fillPercent = (totalVolume / selected.capacity) * 100;
  const tempColor =
    selected.temperature > 60 ? "#ef4444" : selected.temperature < 10 ? "#3b82f6" : "#22c55e";

  return (
    <Card className="border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">
              {selected.id.toUpperCase()}
            </h2>
          </div>
          <Badge variant="outline" className="border-slate-600 text-slate-300">
            {selected.capacity} mL max
          </Badge>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* Temperature gauge */}
        <div className="rounded-lg bg-slate-800/50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Thermometer className="h-4 w-4" style={{ color: tempColor }} />
            <span className="text-xs font-medium text-slate-300">Temperature</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold" style={{ color: tempColor }}>
              {selected.temperature.toFixed(1)}
            </span>
            <span className="mb-1 text-xs text-slate-400">°C</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (selected.temperature / 100) * 100)}%`,
                backgroundColor: tempColor,
              }}
            />
          </div>
        </div>

        {/* Volume gauge */}
        <div className="rounded-lg bg-slate-800/50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-300">Volume</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-cyan-400">
              {totalVolume.toFixed(1)}
            </span>
            <span className="mb-1 text-xs text-slate-400">/ {selected.capacity} mL</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Pressure */}
        <div className="rounded-lg bg-slate-800/50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-slate-300">Pressure</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-purple-400">
              {selected.pressure.toFixed(1)}
            </span>
            <span className="mb-1 text-xs text-slate-400">kPa</span>
          </div>
        </div>

        {/* Contents list */}
        <div className="rounded-lg bg-slate-800/50 p-3">
          <div className="mb-2 text-xs font-medium text-slate-300">
            Contents ({selected.contents.length})
          </div>
          {selected.contents.length === 0 ? (
            <p className="text-xs text-slate-500">Empty beaker</p>
          ) : (
            <div className="space-y-1.5">
              {selected.contents.map((c) => {
                const chem = chemicalsMap.get(c.chemicalId);
                return (
                  <div
                    key={c.chemicalId}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: chem?.hexColor || "#888" }}
                    />
                    <span className="flex-1 truncate text-slate-200">
                      {chem?.name || "Unknown"}
                    </span>
                    <span className="font-mono text-slate-400">
                      {c.volume.toFixed(1)}mL
                    </span>
                    <span className="font-mono text-slate-500">
                      {c.moles.toFixed(3)}mol
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Last reaction result */}
        {lastReactionResult && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">
                Last Reaction
              </span>
            </div>
            <div className="text-xs text-slate-300">
              {lastReactionResult.reaction.equation}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div>ΔH: {lastReactionResult.reaction.deltaH} kJ/mol</div>
              <div>ΔT: +{lastReactionResult.temperatureChange.toFixed(2)}°C</div>
              <div>Heat: {lastReactionResult.heatReleased.toFixed(2)} kJ</div>
              <div>Moles: {lastReactionResult.molesReacted.toFixed(4)}</div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => triggerReaction(selected.id)}
            disabled={selected.contents.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500"
            size="sm"
          >
            <Play className="mr-1 h-3 w-3" />
            React
          </Button>
          <Button
            onClick={() => setContainerHeating(selected.id, !selected.isHeating)}
            variant={selected.isHeating ? "destructive" : "outline"}
            size="sm"
            className={
              !selected.isHeating
                ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : ""
            }
          >
            <Flame className="mr-1 h-3 w-3" />
            {selected.isHeating ? "Stop" : "Heat"}
          </Button>
        </div>
        <Button
          onClick={() => emptyContainer(selected.id)}
          variant="outline"
          size="sm"
          className="w-full border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Empty beaker
        </Button>
      </div>
    </Card>
  );
}
