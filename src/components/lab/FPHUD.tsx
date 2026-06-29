"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/store/player-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FPHUD — MINIMAL Diegetic HUD
 *
 * Design principles (from research):
 * - No always-visible panels (Dead Space approach)
 * - Crosshair only (minimal, expands on hover)
 * - Contextual prompts (only when looking at interactable)
 * - Toast notifications (bottom center, auto-dismiss)
 * - Start screen (one-time)
 * - Budget only at terminal
 * - PPE shown on player body (diegetic)
 * - Hints fade after 10 seconds
 */

export function FPHUD({ onEnterLab }: { onEnterLab?: () => void }) {
  const hovered = usePlayerStore((s) => s.hoveredInteractable);
  const isLocked = usePlayerStore((s) => s.isLocked);
  const showStartScreen = usePlayerStore((s) => s.showStartScreen);
  const heldItem = usePlayerStore((s) => s.heldItem);
  const mode = usePlayerStore((s) => s.mode);
  const setStartScreen = usePlayerStore((s) => s.setStartScreen);
  const setMode = usePlayerStore((s) => s.setMode);

  const [showHints, setShowHints] = useState(false);
  const [hintTimer, setHintTimer] = useState(0);

  // Show hints for first 10 seconds after entering lab
  useEffect(() => {
    if (!showStartScreen && mode === "first-person") {
      setShowHints(true);
      setHintTimer(0);
      const interval = setInterval(() => {
        setHintTimer((t) => {
          if (t >= 10) {
            setShowHints(false);
            clearInterval(interval);
            return 0;
          }
          return t + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showStartScreen, mode]);

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

      {/* === CROSSHAIR — minimal dot === */}
      {!showStartScreen && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "rounded-full transition-all duration-150",
              hovered
                ? "h-3.5 w-3.5 border-2 border-emerald-400/80 bg-emerald-400/10"
                : "h-1.5 w-1.5 bg-white/40"
            )}
          />
        </div>
      )}

      {/* === CONTEXTUAL PROMPT — only when hovering interactable === */}
      {!showStartScreen && hovered && (
        <div className="absolute left-1/2 top-[56%] -translate-x-1/2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-slate-950/80 px-3 py-1.5 backdrop-blur-md">
            <kbd className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">E</kbd>
            <span className="text-xs font-medium text-emerald-300">{hovered.action}</span>
          </div>
        </div>
      )}

      {/* === HELD ITEM — minimal indicator === */}
      {!showStartScreen && heldItem && (
        <div className="absolute bottom-6 right-6">
          <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-slate-950/60 px-2.5 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-medium text-cyan-300/80">Holding item · Q to drop</span>
          </div>
        </div>
      )}

      {/* === HINTS — fade after 10s === */}
      {!showStartScreen && showHints && (
        <div
          className="absolute bottom-6 left-6 transition-opacity duration-1000"
          style={{ opacity: Math.max(0, 1 - hintTimer / 10) }}
        >
          <div className="rounded-lg bg-slate-950/50 px-3 py-2 text-[10px] text-slate-400 backdrop-blur-sm">
            <div><kbd className="text-slate-300">WASD</kbd> move · <kbd className="text-slate-300">Shift</kbd> sprint</div>
            <div><kbd className="text-slate-300">L-Click</kbd> use · <kbd className="text-slate-300">R-Click</kbd> grab</div>
            <div><kbd className="text-slate-300">Q</kbd> drop · <kbd className="text-slate-300">B</kbd> bunsen · <kbd className="text-slate-300">P</kbd> PPE</div>
          </div>
        </div>
      )}

      {/* === UNLOCKED PROMPT === */}
      {!showStartScreen && !isLocked && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-lg border border-slate-600/40 bg-slate-950/80 px-5 py-3 text-center backdrop-blur-md">
            <p className="text-sm font-medium text-white">Click to look around</p>
            <p className="mt-0.5 text-[10px] text-slate-500">Mouse will be captured · Esc to release</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StartScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg">
      <div className="max-w-md rounded-2xl border border-slate-700/50 bg-slate-900/90 p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 shadow-lg shadow-emerald-500/20">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 3h6v4l5 9a3 3 0 0 1-3 5H7a3 3 0 0 1-3-5l5-9V3z" />
            </svg>
          </div>
        </div>

        <h1 className="mb-1 text-center bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-xl font-bold text-transparent">
          The Molecular Sandbox
        </h1>
        <p className="mb-6 text-center text-xs text-slate-500">
          First-Person Chemistry Lab
        </p>

        <div className="mb-5 space-y-2.5 text-sm text-slate-300">
          {[
            { k: "WASD", v: "Walk around the lab", cls: "text-emerald-300 bg-emerald-950/50 border-emerald-500/30" },
            { k: "Right-Click", v: "Pick up bottles & items", cls: "text-cyan-300 bg-cyan-950/50 border-cyan-500/30" },
            { k: "Left-Click", v: "Use, pour, interact", cls: "text-amber-300 bg-amber-950/50 border-amber-500/30" },
            { k: "B / P", v: "Bunsen burner / PPE", cls: "text-purple-300 bg-purple-950/50 border-purple-500/30" },
          ].map((item) => (
            <div key={item.k} className="flex items-center gap-3 rounded-lg bg-slate-800/40 p-2.5">
              <kbd className={`min-w-[70px] rounded px-2 py-1 text-center text-[10px] font-bold border ${item.cls}`}>
                {item.k}
              </kbd>
              <span className="text-xs text-slate-400">{item.v}</span>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-950/10 p-2.5 text-[11px] text-amber-200/70">
          ⚠ Real chemistry — reactions follow real thermodynamics. Wear PPE before experimenting.
        </div>

        <Button
          id="enter-lab-btn"
          onClick={onEnter}
          className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500"
          size="lg"
        >
          Enter Lab
        </Button>
      </div>
    </div>
  );
}
