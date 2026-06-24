"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/store/player-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FPHUD — First-Person Heads-Up Display
 *
 * Overlays on top of the 3D canvas:
 * - Crosshair (center dot)
 * - Interaction prompt (bottom center, "[E] Pick up HCl bottle")
 * - Budget indicator (top right)
 * - PPE status (top left — coat, goggles, gloves)
 * - Start screen (overlay with "Enter Lab" button)
 * - Locked/unlocked indicator
 * - Held item indicator (bottom right)
 * - Movement hint (bottom left)
 */

export function FPHUD({
  onEnterLab,
}: {
  onEnterLab?: () => void;
}) {
  const hovered = usePlayerStore((s) => s.hoveredInteractable);
  const isLocked = usePlayerStore((s) => s.isLocked);
  const showStartScreen = usePlayerStore((s) => s.showStartScreen);
  const budget = usePlayerStore((s) => s.budgetINR);
  const ppe = usePlayerStore((s) => s.ppe);
  const heldItem = usePlayerStore((s) => s.heldItem);
  const mode = usePlayerStore((s) => s.mode);
  const setStartScreen = usePlayerStore((s) => s.setStartScreen);
  const setMode = usePlayerStore((s) => s.setMode);

  if (mode !== "first-person") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 select-none">
      {/* === START SCREEN === */}
      {showStartScreen && (
        <StartScreen
          onEnter={() => {
            setStartScreen(false);
            setMode("first-person");
            onEnterLab?.();
          }}
        />
      )}

      {/* === CROSSHAIR === */}
      {!showStartScreen && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "rounded-full border-2 transition-all duration-150",
              hovered
                ? "h-4 w-4 border-emerald-400 bg-emerald-400/20"
                : "h-2 w-2 border-white/70 bg-white/20"
            )}
          />
        </div>
      )}

      {/* === INTERACTION PROMPT === */}
      {!showStartScreen && hovered && (
        <div className="absolute left-1/2 top-[55%] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-slate-950/85 px-4 py-2 backdrop-blur-md shadow-xl">
            <kbd className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
              E
            </kbd>
            <span className="text-sm font-medium text-emerald-300">
              {hovered.action}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-300">{hovered.label}</span>
          </div>
        </div>
      )}

      {/* === BUDGET (top right) === */}
      {!showStartScreen && (
        <div className="absolute right-4 top-4">
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-slate-950/85 px-3 py-2 backdrop-blur-md shadow-xl">
            <span className="text-xs text-amber-400">₹</span>
            <span className="font-mono text-lg font-bold text-amber-300">
              {budget.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-slate-500">budget</span>
          </div>
        </div>
      )}

      {/* === PPE STATUS (top left) === */}
      {!showStartScreen && (
        <div className="absolute left-4 top-4">
          <div className="flex flex-col gap-1.5">
            <PPEIndicator label="Coat" on={ppe.coat} color="emerald" />
            <PPEIndicator label="Goggles" on={ppe.goggles} color="cyan" />
            <PPEIndicator label="Gloves" on={ppe.gloves} color="purple" />
            <PPEIndicator label="Mask" on={ppe.mask} color="amber" />
          </div>
        </div>
      )}

      {/* === HELD ITEM (bottom right) === */}
      {!showStartScreen && heldItem && (
        <div className="absolute bottom-4 right-4">
          <div className="flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-slate-950/85 px-3 py-2 backdrop-blur-md shadow-xl">
            <span className="text-xs text-cyan-400">✋</span>
            <span className="text-sm font-medium text-cyan-300">
              {heldItem.type === "chemical"
                ? `Bottle (${heldItem.volume}mL)`
                : "Apparatus"}
            </span>
          </div>
        </div>
      )}

      {/* === MOVEMENT HINT (bottom left) === */}
      {!showStartScreen && (
        <div className="absolute bottom-4 left-4">
          <div className="flex flex-col gap-1 rounded-lg border border-slate-700/50 bg-slate-950/70 px-3 py-2 backdrop-blur-md text-[10px] text-slate-400">
            <span><kbd className="text-slate-300">WASD</kbd> move · <kbd className="text-slate-300">Shift</kbd> sprint</span>
            <span><kbd className="text-slate-300">E</kbd>/Click interact · <kbd className="text-slate-300">Q</kbd> drop</span>
            <span><kbd className="text-slate-300">1</kbd>/<kbd className="text-slate-300">2</kbd>/<kbd className="text-slate-300">3</kbd> select · <kbd className="text-slate-300">R</kbd> react · <kbd className="text-slate-300">X</kbd> empty</span>
            <span><kbd className="text-slate-300">T</kbd> terminal · <kbd className="text-slate-300">B</kbd> bunsen · <kbd className="text-slate-300">P</kbd> PPE</span>
            <span><kbd className="text-slate-300">Esc</kbd> release mouse</span>
          </div>
        </div>
      )}

      {/* === UNLOCKED PROMPT === */}
      {!showStartScreen && !isLocked && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-lg border border-slate-600 bg-slate-950/90 px-6 py-4 text-center backdrop-blur-md shadow-2xl">
            <p className="text-sm font-medium text-white">Click to resume</p>
            <p className="mt-1 text-xs text-slate-400">Mouse will be captured for looking around</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PPEIndicator({
  label,
  on,
  color,
}: {
  label: string;
  on: boolean;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500 bg-emerald-950/80 text-emerald-300",
    cyan: "border-cyan-500 bg-cyan-950/80 text-cyan-300",
    purple: "border-purple-500 bg-purple-950/80 text-purple-300",
    amber: "border-amber-500 bg-amber-950/80 text-amber-300",
  };
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md transition-all",
        on
          ? colorMap[color]
          : "border-slate-700 bg-slate-950/60 text-slate-500"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-current" : "bg-slate-600")} />
      {label}
    </div>
  );
}

function StartScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg">
      <div className="max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 shadow-lg shadow-emerald-500/30">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 3h6v4l5 9a3 3 0 0 1-3 5H7a3 3 0 0 1-3-5l5-9V3z" />
              <line x1="9" y1="3" x2="15" y2="3" />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-center bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-2xl font-bold text-transparent">
          The Molecular Sandbox
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          First-Person Chemistry Lab · Open World Mode
        </p>

        <div className="mb-6 space-y-3 text-sm text-slate-300">
          <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-xs font-bold text-emerald-400">1</span>
            <div>
              <p className="font-medium text-emerald-300">Walk around the lab</p>
              <p className="text-xs text-slate-400">WASD to move, mouse to look, Shift to sprint</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/30 text-xs font-bold text-cyan-400">2</span>
            <div>
              <p className="font-medium text-cyan-300">Interact with objects</p>
              <p className="text-xs text-slate-400">Look at bottles, beakers, terminals and press E (or click)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/30 text-xs font-bold text-amber-400">3</span>
            <div>
              <p className="font-medium text-amber-300">Order chemicals</p>
              <p className="text-xs text-slate-400">Use the ordering terminal · ₹10,000 budget · deliveries take time</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/30 text-xs font-bold text-purple-400">4</span>
            <div>
              <p className="font-medium text-purple-300">Safety first</p>
              <p className="text-xs text-slate-400">Equip coat + goggles + gloves at the safety station before reactions</p>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
          <p className="font-semibold">⚠ Real chemistry, real consequences</p>
          <p className="mt-0.5 text-amber-300/80">Reactions follow real thermodynamics. Dangerous reactions require the fume hood. No PPE = no reaction.</p>
        </div>

        <Button
          id="enter-lab-btn"
          onClick={onEnter}
          className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500"
          size="lg"
        >
          Enter Lab
        </Button>
        <p className="mt-3 text-center text-[10px] text-slate-500">
          Mouse will be captured for first-person view · Press Esc to release
        </p>
      </div>
    </div>
  );
}
