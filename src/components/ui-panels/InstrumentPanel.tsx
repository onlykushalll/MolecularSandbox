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
  Droplets,
  ArrowRightLeft,
  Snowflake,
  TestTube,
  Volume2,
  VolumeX,
  Keyboard,
  AlertTriangle,
  FlaskRound,
  TestTubes,
  Beaker as BeakerIcon,
} from "lucide-react";
import type { ContainerType } from "@/lib/chemistry/types";
import { useLabStore } from "@/lib/store/lab-store";
import { calculatePH, phToColor, phLabel } from "@/lib/chemistry/mixture";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function InstrumentPanel() {
  const containers = useLabStore((s) => s.containers);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const secondaryContainerId = useLabStore((s) => s.secondaryContainerId);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const triggerReaction = useLabStore((s) => s.triggerReaction);
  const emptyContainer = useLabStore((s) => s.emptyContainer);
  const setContainerHeating = useLabStore((s) => s.setContainerHeating);
  const startPourAnimation = useLabStore((s) => s.startPourAnimation);
  const lastReactionResult = useLabStore((s) => s.lastReactionResult);
  const showPHStrip = useLabStore((s) => s.showPHStrip);
  const togglePHStrip = useLabStore((s) => s.togglePHStrip);
  const soundEnabled = useLabStore((s) => s.soundEnabled);
  const toggleSound = useLabStore((s) => s.toggleSound);
  const reactionProgress = useLabStore((s) => s.reactionProgress);
  const reactingContainerId = useLabStore((s) => s.reactingContainerId);
  const setContainerType = useLabStore((s) => s.setContainerType);

  const selected = containers.find((c) => c.id === selectedContainerId);
  const secondary = containers.find((c) => c.id === secondaryContainerId);

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
        <div className="mt-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 text-[11px] text-slate-400">
          <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-slate-300">
            <Keyboard className="h-3 w-3" /> Keyboard Shortcuts
          </p>
          <ul className="space-y-1">
            <li><kbd className="rounded bg-slate-700 px-1">1/2/3</kbd> select beaker</li>
            <li><kbd className="rounded bg-slate-700 px-1">R</kbd> react · <kbd className="rounded bg-slate-700 px-1">H</kbd> heat · <kbd className="rounded bg-slate-700 px-1">E</kbd> empty</li>
            <li><kbd className="rounded bg-slate-700 px-1">P</kbd> pour · <kbd className="rounded bg-slate-700 px-1">T</kbd> pH strip</li>
            <li><kbd className="rounded bg-slate-700 px-1">M</kbd> mute · <kbd className="rounded bg-slate-700 px-1">Drag</kbd> rotate · <kbd className="rounded bg-slate-700 px-1">Scroll</kbd> zoom</li>
          </ul>
        </div>
      </Card>
    );
  }

  const totalVolume = selected.contents.reduce((s, c) => s + c.volume, 0);
  const fillPercent = (totalVolume / selected.capacity) * 100;
  const tempColor =
    selected.temperature > 60 ? "#ef4444" : selected.temperature < 10 ? "#3b82f6" : "#22c55e";

  // Calculate pH
  const pH = calculatePH(selected.contents, chemicalsMap);
  const pHColor = phToColor(pH);
  const pHTargetVolume = secondary ? secondary.contents.reduce((s, c) => s + c.volume, 0) : 0;
  const canPour = !!secondary && totalVolume > 0;

  return (
    <Card className="border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/40">
              <FlaskConical className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {selected.id.toUpperCase()}
              </h2>
              <p className="text-[10px] text-slate-400">
                {selected.isBroken ? "⚠ BROKEN" : selected.isHeating ? "🔥 Heating" : "⚪ Idle"} · {selected.contents.length} contents
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => togglePHStrip()}
              className={
                showPHStrip
                  ? "h-7 bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                  : "h-7 text-slate-400 hover:bg-slate-800 hover:text-white"
              }
              title="Toggle pH test strip (T)"
            >
              <TestTube className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleSound()}
              className={
                soundEnabled
                  ? "h-7 text-emerald-300 hover:bg-slate-800"
                  : "h-7 text-slate-500 hover:bg-slate-800"
              }
              title="Toggle sound (M)"
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </Button>
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {selected.capacity} mL max
            </Badge>
          </div>
        </div>
      </div>

      {/* Container type selector */}
      {!selected.isBroken && (
        <div className="border-b border-slate-700/50 bg-slate-800/30 px-4 py-2">
          <div className="mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Container Type</div>
          <div className="flex gap-1">
            {([
              { type: "beaker" as ContainerType, icon: BeakerIcon, label: "Beaker", color: "emerald" },
              { type: "erlenmeyer" as ContainerType, icon: FlaskConical, label: "Erlenmeyer", color: "amber" },
              { type: "test_tube" as ContainerType, icon: TestTubes, label: "Test Tube", color: "purple" },
              { type: "flask" as ContainerType, icon: FlaskRound, label: "Round Flask", color: "cyan" },
            ]).map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => setContainerType(selected.id, type)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
                  selected.type === type
                    ? color === "emerald" ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/40"
                      : color === "amber" ? "bg-amber-500/30 text-amber-300 ring-1 ring-amber-500/40"
                      : color === "purple" ? "bg-purple-500/30 text-purple-300 ring-1 ring-purple-500/40"
                      : "bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/40"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white"
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Broken beaker warning banner */}
      {selected.isBroken && (
        <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-950/40 px-4 py-2 text-xs text-red-200">
          <AlertTriangle className="h-4 w-4 animate-pulse" />
          <span className="font-medium">This beaker is broken!</span>
          <span className="text-red-300/70">Empty and reset to use again.</span>
        </div>
      )}

      {/* Reaction progress bar */}
      {reactingContainerId === selected.id && reactionProgress > 0 && (
        <div className="border-b border-amber-500/30 bg-amber-950/30 px-4 py-1.5 fade-in-up">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 animate-pulse text-amber-400" />
            <span className="text-[10px] font-medium text-amber-300">Reacting...</span>
            <div className="ml-auto h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700">
              <div
                className="progress-shine h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-100"
                style={{ width: `${reactionProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 p-4">
        {/* Temperature gauge */}
        <div className="rounded-lg border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Thermometer className="h-4 w-4" style={{ color: tempColor }} />
            <span className="text-xs font-medium text-slate-300">Temperature</span>
            <span className="ml-auto text-[10px] text-slate-500">
              {selected.temperature > 60 ? "Hot" : selected.temperature < 10 ? "Cold" : "Ambient"}
            </span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold tabular-nums" style={{ color: tempColor }}>
              {selected.temperature.toFixed(1)}
            </span>
            <span className="mb-1 text-xs text-slate-400">°C</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (selected.temperature / 120) * 100)}%`,
                background: `linear-gradient(90deg, #3b82f6 0%, #22c55e 50%, #ef4444 100%)`,
              }}
            />
          </div>
        </div>

        {/* pH Indicator */}
        <div className="rounded-lg border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Droplets className="h-4 w-4" style={{ color: pHColor }} />
            <span className="text-xs font-medium text-slate-300">pH Level</span>
            <span className="ml-auto text-[10px] font-medium" style={{ color: pHColor }}>
              {phLabel(pH)}
            </span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold tabular-nums" style={{ color: pHColor }}>
              {pH.toFixed(2)}
            </span>
            <span className="mb-1 text-xs text-slate-400">/ 14</span>
          </div>
          {/* pH color bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full"
               style={{
                 background: "linear-gradient(90deg, #dc2626 0%, #ea580c 15%, #facc15 30%, #84cc16 45%, #22c55e 50%, #14b8a6 60%, #3b82f6 75%, #6366f1 88%, #8b5cf6 100%)",
               }}>
            <div
              className="relative h-full"
              style={{ width: `${(pH / 14) * 100}%` }}
            >
              <div
                className="absolute right-0 top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-full bg-white shadow-lg ring-1 ring-slate-900"
              />
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[8px] text-slate-500">
            <span>0</span><span>7</span><span>14</span>
          </div>
        </div>

        {/* Volume gauge */}
        <div className="rounded-lg border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-300">Volume</span>
            {fillPercent > 85 && (
              <span className="ml-auto text-[10px] text-amber-400">⚠ Near full</span>
            )}
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold tabular-nums text-cyan-400">
              {totalVolume.toFixed(1)}
            </span>
            <span className="mb-1 text-xs text-slate-400">/ {selected.capacity} mL</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Pressure */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[10px] font-medium text-slate-300">Pressure</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold tabular-nums text-purple-400">
                {selected.pressure.toFixed(1)}
              </span>
              <span className="mb-0.5 text-[10px] text-slate-400">kPa</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Snowflake className="h-3.5 w-3.5 text-blue-300" />
              <span className="text-[10px] font-medium text-slate-300">State</span>
            </div>
            <div className="text-sm font-bold text-blue-300">
              {selected.temperature < 0 ? "Frozen" :
               selected.temperature > 100 ? "Boiling" :
               selected.isHeating ? "Heating" : "Liquid"}
            </div>
          </div>
        </div>

        {/* Contents list */}
        <div className="rounded-lg border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              Contents ({selected.contents.length})
            </span>
            {selected.precipitate && selected.precipitate.length > 0 && (
              <span className="text-[10px] text-purple-300">
                + precipitate: {selected.precipitate.reduce((s, p) => s + p.moles, 0).toFixed(2)} mol
              </span>
            )}
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
                    className="flex items-center gap-2 rounded-md bg-slate-900/40 px-2 py-1 text-xs"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full border border-white/20 shadow-sm"
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
              {selected.precipitate && selected.precipitate.map((p) => {
                const pchem = chemicalsMap.get(p.chemicalId);
                return (
                  <div key={p.chemicalId} className="flex items-center gap-2 rounded-md bg-purple-900/20 px-2 py-1 text-xs ring-1 ring-purple-500/20">
                    <div
                      className="h-2.5 w-2.5 rounded-sm border border-white/20"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="flex-1 truncate text-purple-200">
                      {pchem?.name || "Precipitate"} (solid)
                    </span>
                    <span className="font-mono text-purple-300">
                      {p.moles.toFixed(3)}mol
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Last reaction result */}
        {lastReactionResult && (
          <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-900/40 p-3 ring-1 ring-emerald-500/10">
            <div className="mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">
                Last Reaction
              </span>
              {lastReactionResult.gasEvolved && (
                <span className="ml-auto rounded bg-teal-500/20 px-1.5 py-0.5 text-[9px] text-teal-300">
                  💨 Gas
                </span>
              )}
              {lastReactionResult.precipitateFormed && (
                <span className="ml-auto rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] text-purple-300">
                  ▼ Precipitate
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-slate-200">
              {lastReactionResult.reaction.equation}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded bg-slate-800/50 px-1.5 py-1">
                <span className="text-slate-500">ΔH: </span>
                <span className={lastReactionResult.reaction.deltaH < 0 ? "text-red-400" : "text-blue-400"}>
                  {lastReactionResult.reaction.deltaH} kJ/mol
                </span>
              </div>
              <div className="rounded bg-slate-800/50 px-1.5 py-1">
                <span className="text-slate-500">ΔT: </span>
                <span className={lastReactionResult.temperatureChange > 0 ? "text-red-400" : "text-blue-400"}>
                  {lastReactionResult.temperatureChange > 0 ? "+" : ""}{lastReactionResult.temperatureChange.toFixed(2)}°C
                </span>
              </div>
              <div className="rounded bg-slate-800/50 px-1.5 py-1">
                <span className="text-slate-500">Heat: </span>
                <span className="text-amber-400">{lastReactionResult.heatReleased.toFixed(2)} kJ</span>
              </div>
              <div className="rounded bg-slate-800/50 px-1.5 py-1">
                <span className="text-slate-500">Moles: </span>
                <span className="text-cyan-400">{lastReactionResult.molesReacted.toFixed(4)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pour bar (when secondary selected) */}
        {secondary && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 ring-1 ring-amber-500/10">
            <div className="mb-2 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">Pour Mode</span>
            </div>
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-mono text-emerald-400">{selected.id.toUpperCase()}</span>
              <ArrowRightLeft className="h-3 w-3 text-amber-400" />
              <span className="font-mono text-amber-400">{secondary.id.toUpperCase()}</span>
              <span className="text-slate-500">({pHTargetVolume.toFixed(0)}mL)</span>
            </div>
            <Button
              onClick={() => {
                startPourAnimation(selected.id, secondary.id);
                toast.info("Pouring...", {
                  description: `${selected.id} → ${secondary.id}`,
                });
              }}
              disabled={!canPour}
              size="sm"
              className="w-full bg-amber-600 hover:bg-amber-500"
            >
              <ArrowRightLeft className="mr-1 h-3 w-3" />
              Pour from {selected.id.toUpperCase()} to {secondary.id.toUpperCase()}
            </Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => triggerReaction(selected.id)}
            disabled={selected.contents.length === 0 || selected.isBroken}
            className="bg-emerald-600 hover:bg-emerald-500"
            size="sm"
          >
            <Play className="mr-1 h-3 w-3" />
            React
          </Button>
          <Button
            onClick={() => setContainerHeating(selected.id, !selected.isHeating)}
            disabled={selected.isBroken}
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
