"use client";
import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Flame,
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  Award,
  Lock,
  CheckCircle2,
} from "lucide-react";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_CATEGORY_COLORS,
  type Achievement,
  type AchievementCategory,
  type AchievementState,
  loadAchievementState,
  saveAchievementState,
  checkAchievements,
  type AchievementContext,
} from "@/lib/achievements/achievements";
import { useLabStore } from "@/lib/store/lab-store";
import { cn } from "@/lib/utils";

// Singleton in-memory cache of achievement state shared across panel instances.
// The lab-store writes to this; the panel reads from it.
let memoryState: AchievementState | null = null;
const subscribers = new Set<() => void>();

export function getAchievementState(): AchievementState {
  if (!memoryState) {
    memoryState = loadAchievementState();
  }
  return memoryState;
}

export function notifyAchievementSubscribers() {
  for (const fn of subscribers) fn();
}

// Called by the lab-store (or any module) after a reaction completes or other event.
export function recordAchievementEvent(ctx: AchievementContext): Achievement[] {
  const prev = getAchievementState();
  const { state, newlyUnlocked } = checkAchievements(prev, ctx);
  memoryState = state;
  saveAchievementState(state);
  notifyAchievementSubscribers();
  return newlyUnlocked;
}

// Hook used by the panel
function useAchievementState(): AchievementState {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  }, []);
  return getAchievementState();
}

function useAchievementReady(): boolean {
  // Hydrate after first paint so we don't read localStorage during SSR.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Defer to next microtask so we don't trigger a synchronous re-render
    Promise.resolve().then(() => setReady(true));
  }, []);
  return ready;
}

export function AchievementsPanel() {
  const state = useAchievementState();
  const ready = useAchievementReady();
  const [filter, setFilter] = useState<AchievementCategory | "all">("all");
  const chemicals = useLabStore((s) => s.chemicals);
  const reactions = useLabStore((s) => s.reactions);
  const journalEntries = useLabStore((s) => s.journalEntries);

  // Compute live statistics
  const stats = useMemo(() => {
    const totalReactions = state.totalReactions;
    const unlockedCount = Object.keys(state.unlocked).length;
    const totalCount = ACHIEVEMENTS.length;
    const progressPct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
    return {
      totalReactions,
      unlockedCount,
      totalCount,
      progressPct,
      uniqueReactions: state.uniqueReactionsTried.size,
      uniqueChemicals: state.uniqueChemicalsUsed.size,
      totalChemicalsAvailable: chemicals.length,
      totalReactionsAvailable: reactions.length,
      beakersBroken: state.beakersBroken,
      presetsCompleted: state.presetExperimentsCompleted.size,
      exothermic: state.exothermicReactions,
      endothermic: state.endothermicReactions,
      maxTemp: state.maxTemperature,
      precipitates: state.totalPrecipitatesFormed,
      gases: state.totalGasesEvolved,
      journalEntries: journalEntries.length,
    };
  }, [state, chemicals.length, reactions.length, journalEntries.length]);

  const filteredAchievements = useMemo(() => {
    if (filter === "all") return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter((a) => a.category === filter);
  }, [filter]);

  const categories: (AchievementCategory | "all")[] = [
    "all",
    "firsts",
    "reactions",
    "discovery",
    "mastery",
    "safety",
    "presets",
  ];

  if (!ready) {
    return (
      <Card className="flex h-full items-center justify-center bg-slate-900/95 p-4 backdrop-blur">
        <p className="text-xs text-slate-500">Loading achievements...</p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      {/* Header with progress */}
      <div className="border-b border-slate-700/50 bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/30 to-purple-500/30 ring-1 ring-amber-500/30">
            <Trophy className="h-4 w-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Achievements</h2>
            <p className="text-[10px] text-slate-400">
              {stats.unlockedCount} / {stats.totalCount} unlocked
            </p>
          </div>
          <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-purple-500 text-white">
            {stats.progressPct.toFixed(0)}%
          </Badge>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 transition-all duration-500"
            style={{ width: `${stats.progressPct}%` }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {/* Statistics dashboard */}
          <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-slate-900/30 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300">
                Lab Statistics
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatTile
                label="Reactions"
                value={stats.totalReactions}
                color="text-emerald-400"
                icon={<Zap className="h-2.5 w-2.5" />}
              />
              <StatTile
                label="Unique RXNs"
                value={stats.uniqueReactions}
                sub={`/ ${stats.totalReactionsAvailable}`}
                color="text-cyan-400"
                icon={<Target className="h-2.5 w-2.5" />}
              />
              <StatTile
                label="Chemicals"
                value={stats.uniqueChemicals}
                sub={`/ ${stats.totalChemicalsAvailable}`}
                color="text-purple-400"
                icon={<FlaskIconSmall />}
              />
              <StatTile
                label="Exothermic"
                value={stats.exothermic}
                color="text-red-400"
                icon={<Flame className="h-2.5 w-2.5" />}
              />
              <StatTile
                label="Endothermic"
                value={stats.endothermic}
                color="text-blue-400"
                icon={<Sparkles className="h-2.5 w-2.5" />}
              />
              <StatTile
                label="Max Temp"
                value={stats.maxTemp}
                sub="°C"
                color="text-orange-400"
                icon={<Flame className="h-2.5 w-2.5" />}
              />
              <StatTile
                label="Precipitates"
                value={stats.precipitates}
                color="text-fuchsia-400"
              />
              <StatTile
                label="Gases"
                value={stats.gases}
                color="text-teal-400"
              />
              <StatTile
                label="Broken"
                value={stats.beakersBroken}
                color="text-rose-400"
              />
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium transition-all",
                  filter === cat
                    ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm"
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white"
                )}
              >
                {cat === "all" ? "All" : ACHIEVEMENT_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Achievements grid */}
          <div className="space-y-2">
            {filteredAchievements.map((a) => {
              const unlockedAt = state.unlocked[a.id];
              const isUnlocked = !!unlockedAt;
              const isHidden = a.hidden && !isUnlocked;
              return (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  unlocked={isUnlocked}
                  unlockedAt={unlockedAt}
                  hidden={isHidden}
                  state={state}
                />
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 text-[10px] text-slate-400">
            <p className="font-semibold text-slate-300">💡 Tip:</p>
            <p className="mt-1">
              Achievements & statistics are saved to your browser&apos;s local storage and persist
              across sessions. Perform more experiments to unlock them all!
            </p>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}

function StatTile({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: number;
  sub?: string;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-700/40 bg-slate-900/40 px-1.5 py-1.5">
      <div className="flex items-center justify-center gap-0.5 text-[8px] text-slate-500 uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className={cn("text-base font-bold tabular-nums", color)}>
        {value}
        {sub && <span className="text-[9px] text-slate-500">{sub}</span>}
      </div>
    </div>
  );
}

function FlaskIconSmall() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3h6v5l4 7a3 3 0 0 1-3 5H8a3 3 0 0 1-3-5l4-7V3z" />
      <path d="M7 14h10" />
    </svg>
  );
}

function AchievementCard({
  achievement,
  unlocked,
  unlockedAt,
  hidden,
  state,
}: {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: number;
  hidden: boolean;
  state: AchievementState;
}) {
  // Compute current progress toward threshold
  let progress: { current: number; target: number } | null = null;
  if (achievement.threshold) {
    let current = 0;
    switch (achievement.id) {
      case "reactions-5":
      case "reactions-25":
      case "reactions-100":
        current = state.totalReactions;
        break;
      case "discovery-5-reactions":
      case "discovery-15-reactions":
      case "discovery-all-types":
        current = state.uniqueReactionsTried.size;
        break;
      case "safety-10-safe-reactions":
        current = state.totalReactions;
        break;
      case "presets-3":
      case "presets-all":
        current = state.presetExperimentsCompleted.size;
        break;
    }
    progress = { current, target: achievement.threshold };
  }

  if (hidden) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-600">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Hidden Achievement</p>
            <p className="text-[10px] text-slate-600">Keep experimenting to reveal...</p>
          </div>
        </div>
      </div>
    );
  }

  const cardClasses = cn(
    "rounded-lg border p-3 transition-all",
    unlocked
      ? cn(
          "bg-gradient-to-br achievement-sheen",
          ACHIEVEMENT_CATEGORY_COLORS[achievement.category],
          "ring-1 ring-white/5 hover:ring-white/10"
        )
      : "border-slate-700/40 bg-slate-800/30 opacity-70"
  );

  return (
    <div className={cardClasses}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl icon-wiggle",
            unlocked
              ? "bg-slate-900/50 ring-1 ring-white/20"
              : "bg-slate-900/40 grayscale"
          )}
        >
          {unlocked ? achievement.icon : "🔒"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p
              className={cn(
                "truncate text-sm font-bold",
                unlocked ? "text-white" : "text-slate-400"
              )}
            >
              {achievement.title}
            </p>
            {unlocked && (
              <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-400" />
            )}
          </div>
          <p
            className={cn(
              "mt-0.5 text-[11px]",
              unlocked ? "text-slate-300" : "text-slate-500"
            )}
          >
            {achievement.description}
          </p>
          {progress && !unlocked && (
            <div className="mt-1.5">
              <div className="mb-0.5 flex items-center justify-between text-[9px] text-slate-500">
                <span>
                  {progress.current} / {progress.target} {achievement.unit}
                </span>
                <span>
                  {((progress.current / progress.target) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-700/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (progress.current / progress.target) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
          {unlocked && unlockedAt && (
            <p className="mt-1 text-[9px] text-slate-400">
              <Award className="mr-0.5 inline h-2 w-2" />
              Unlocked {new Date(unlockedAt).toLocaleDateString()} ·{" "}
              {new Date(unlockedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
