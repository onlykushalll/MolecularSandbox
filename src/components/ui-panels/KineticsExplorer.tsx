"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Gauge,
  Thermometer,
  Zap,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Gas constant (kJ/mol·K -> J/mol·K)
const R = 8.314;
// Pre-exponential factor (1/s) — typical for many reactions
const A_PRE = 1e10;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  species: "A" | "B" | "C";
  alive: boolean;
}

interface SimParams {
  temperature: number; // K (273-800)
  concentration: number; // 10-100 (relative)
  activationEnergy: number; // kJ/mol (10-200)
  catalyst: boolean;
}

function arrhenius(tempK: number, eaKjPerMol: number, catalyst: boolean) {
  const effectiveEa = catalyst ? eaKjPerMol * 0.65 : eaKjPerMol;
  const eaJ = effectiveEa * 1000;
  const k = A_PRE * Math.exp(-eaJ / (R * tempK));
  return { k, effectiveEa };
}

function halfLifeFirstOrder(k: number) {
  return k > 0 ? Math.LN2 / k : Infinity;
}

function fmtSci(n: number) {
  if (!isFinite(n)) return "∞";
  if (n === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mantissa = n / Math.pow(10, exp);
  if (exp >= -2 && exp < 4) {
    return n.toFixed(2);
  }
  return `${mantissa.toFixed(2)} × 10^${exp}`;
}

const SPECIES_COLORS: Record<Particle["species"], string> = {
  A: "#22d3ee", // cyan
  B: "#f97316", // orange
  C: "#a3e635", // lime (product)
};

const SPECIES_GLOW: Record<Particle["species"], string> = {
  A: "rgba(34, 211, 238, 0.45)",
  B: "rgba(249, 115, 22, 0.45)",
  C: "rgba(163, 230, 53, 0.5)",
};

export function KineticsExplorer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const reactionCountRef = useRef<number>(0);
  const progressRef = useRef<{ t: number; progress: number }[]>([]);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const [params, setParams] = useState<SimParams>({
    temperature: 350,
    concentration: 50,
    activationEnergy: 80,
    catalyst: false,
  });
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({
    reactions: 0,
    remainingA: 0,
    remainingB: 0,
    products: 0,
    elapsed: 0,
    progress: 0,
  });
  const [progressData, setProgressData] = useState<{ t: number; progress: number }[]>([]);

  // Calculate derived values
  const derived = useMemo(() => {
    const { k, effectiveEa } = arrhenius(
      params.temperature,
      params.activationEnergy,
      params.catalyst
    );
    const halfLife = halfLifeFirstOrder(k);
    // Boltzmann distribution fraction with sufficient energy
    const fractionWithEnergy = Math.exp(-effectiveEa * 1000 / (R * params.temperature));
    // Average kinetic energy proportional to T
    const avgKE = (3 / 2) * R * params.temperature / 1000; // kJ/mol
    // Rate is proportional to k * [A] * [B]
    const relRate = k * (params.concentration / 50) ** 2;
    return { k, effectiveEa, halfLife, fractionWithEnergy, avgKE, relRate };
  }, [params]);

  // Initialize particles
  const initParticles = useCallback(() => {
    const count = Math.floor(params.concentration * 1.0); // 10-100 particles
    const particles: Particle[] = [];
    const W = 600;
    const H = 360;
    for (let i = 0; i < count; i++) {
      const species: Particle["species"] = i % 2 === 0 ? "A" : "B";
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.5;
      particles.push({
        x: Math.random() * (W - 20) + 10,
        y: Math.random() * (H - 20) + 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 5,
        species,
        alive: true,
      });
    }
    particlesRef.current = particles;
    reactionCountRef.current = 0;
    progressRef.current = [];
    elapsedRef.current = 0;
    startTimeRef.current = performance.now();
  }, [params.concentration]);

  // Re-init when concentration changes
  useEffect(() => {
    initParticles();
  }, [initParticles]);

  // Physics simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const tick = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(50, now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (running) {
        elapsedRef.current += dt;
        const tempScale = params.temperature / 350; // baseline 350K
        const speedScale = Math.sqrt(tempScale);

        const particles = particlesRef.current;
        // Update positions
        for (const p of particles) {
          if (!p.alive) continue;
          p.x += p.vx * speedScale * 60 * dt;
          p.y += p.vy * speedScale * 60 * dt;
          // Bounce off walls
          if (p.x < p.r) { p.x = p.r; p.vx *= -1; }
          if (p.x > W - p.r) { p.x = W - p.r; p.vx *= -1; }
          if (p.y < p.r) { p.y = p.r; p.vy *= -1; }
          if (p.y > H - p.r) { p.y = H - p.r; p.vy *= -1; }
        }
        // Collision detection + reaction
        const effectiveEa = params.catalyst
          ? params.activationEnergy * 0.65
          : params.activationEnergy;
        const eaJ = effectiveEa * 1000;
        // Visualization scaling: use a large multiplier so probabilities are visible
        // while still preserving the relative trends from the Arrhenius equation
        const probFactor = Math.exp(-eaJ / (R * params.temperature)) * 1e13;
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          if (!a.alive) continue;
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            if (!b.alive) continue;
            // Only A + B can react
            if (a.species === "C" || b.species === "C") continue;
            if (a.species === b.species) continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            const rsum = a.r + b.r;
            if (d2 < rsum * rsum) {
              // Calculate collision energy (relative speed)
              const relSpeed = Math.hypot(a.vx - b.vx, a.vy - b.vy) * speedScale;
              const collisionEnergy = relSpeed * relSpeed / 4; // simplified
              // Probability of reaction proportional to Arrhenius + collision energy
              const reactionProb = Math.min(0.95, probFactor * (1 + collisionEnergy * 0.5));
              if (Math.random() < reactionProb) {
                // React: both become C (product)
                a.species = "C";
                b.species = "C";
                // Slight position separation
                const angle = Math.atan2(dy, dx);
                a.x += Math.cos(angle) * 2;
                a.y += Math.sin(angle) * 2;
                b.x -= Math.cos(angle) * 2;
                b.y -= Math.sin(angle) * 2;
                reactionCountRef.current += 1;
              } else {
                // Elastic bounce
                const angle = Math.atan2(dy, dx);
                const vRel = (a.vx - b.vx) * Math.cos(angle) + (a.vy - b.vy) * Math.sin(angle);
                a.vx -= vRel * Math.cos(angle);
                a.vy -= vRel * Math.sin(angle);
                b.vx += vRel * Math.cos(angle);
                b.vy += vRel * Math.sin(angle);
                // Separate to avoid sticking
                const overlap = rsum - Math.sqrt(d2);
                a.x += Math.cos(angle) * overlap / 2;
                a.y += Math.sin(angle) * overlap / 2;
                b.x -= Math.cos(angle) * overlap / 2;
                b.y -= Math.sin(angle) * overlap / 2;
              }
            }
          }
        }
        // Track progress
        const totalA = particles.filter((p) => p.species === "A").length;
        const totalB = particles.filter((p) => p.species === "B").length;
        const products = particles.filter((p) => p.species === "C").length;
        const totalReactants = particles.length;
        const progress = totalReactants > 0 ? products / totalReactants : 0;
        progressRef.current.push({ t: elapsedRef.current, progress });
        if (progressRef.current.length > 200) {
          progressRef.current.shift();
        }
        setProgressData([...progressRef.current]);
        setStats({
          reactions: reactionCountRef.current,
          remainingA: totalA,
          remainingB: totalB,
          products,
          elapsed: elapsedRef.current,
          progress,
        });
      }

      // Render
      ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
      ctx.fillRect(0, 0, W, H);

      // Grid background
      ctx.strokeStyle = "rgba(34, 197, 94, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Border
      ctx.strokeStyle = "rgba(34, 197, 94, 0.2)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);

      // Particles
      const particles = particlesRef.current;
      for (const p of particles) {
        if (!p.alive) continue;
        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        grad.addColorStop(0, SPECIES_GLOW[p.species]);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.fillStyle = SPECIES_COLORS[p.species];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        // Specular highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Species label
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.font = "bold 7px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.species, p.x, p.y + 0.5);
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTimeRef.current = 0;
    };
  }, [running, params]);

  const handleReset = () => {
    initParticles();
    setStats({ reactions: 0, remainingA: 0, remainingB: 0, products: 0, elapsed: 0, progress: 0 });
    setProgressData([]);
  };

  const tempColor = params.temperature < 320 ? "text-cyan-400" :
                    params.temperature < 450 ? "text-emerald-400" :
                    params.temperature < 600 ? "text-amber-400" :
                    "text-red-400";

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-gradient-to-r from-purple-950/40 via-slate-900 to-emerald-950/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-emerald-500 shadow-md">
              <Activity className="h-4 w-4 text-white" />
              <div className="absolute inset-0 rounded-lg bg-purple-400/20 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Kinetics Explorer</h2>
              <p className="text-[10px] text-slate-400">Collision theory · Arrhenius equation</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRunning((r) => !r)}
              className={cn(
                "h-7 px-2 text-xs",
                running
                  ? "text-amber-300 hover:bg-amber-950/40 hover:text-amber-200"
                  : "text-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-200"
              )}
            >
              {running ? <><Pause className="mr-1 h-3 w-3" />Pause</> : <><Play className="mr-1 h-3 w-3" />Play</>}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="h-7 px-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {/* 2D Particle Simulation */}
        <div className="relative rounded-lg border border-slate-700/50 overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            width={600}
            height={360}
            className="block w-full h-auto"
          />
          {/* Live overlay info */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge variant="outline" className="border-cyan-500/40 bg-slate-900/80 text-cyan-300 backdrop-blur text-[10px]">
              <span className="mr-1 h-1.5 w-1.5 rounded-full" style={{ background: SPECIES_COLORS.A }} />
              A: {stats.remainingA}
            </Badge>
            <Badge variant="outline" className="border-orange-500/40 bg-slate-900/80 text-orange-300 backdrop-blur text-[10px]">
              <span className="mr-1 h-1.5 w-1.5 rounded-full" style={{ background: SPECIES_COLORS.B }} />
              B: {stats.remainingB}
            </Badge>
            <Badge variant="outline" className="border-lime-500/40 bg-slate-900/80 text-lime-300 backdrop-blur text-[10px]">
              <span className="mr-1 h-1.5 w-1.5 rounded-full" style={{ background: SPECIES_COLORS.C }} />
              C: {stats.products}
            </Badge>
          </div>
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="border-emerald-500/40 bg-slate-900/80 text-emerald-300 backdrop-blur text-[10px]">
              <Zap className="mr-1 h-2.5 w-2.5" />
              {stats.reactions} reactions
            </Badge>
          </div>
          {/* Legend bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/95 to-transparent p-2 pt-6">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>A + B → C</span>
              <span className="font-mono">t = {stats.elapsed.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3 rounded-lg border border-slate-700/50 bg-slate-950/60 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-slate-200">Reaction Conditions</span>
          </div>

          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-slate-300">
                <Thermometer className={cn("h-3 w-3", tempColor)} />
                Temperature
              </Label>
              <span className={cn("font-mono text-xs font-bold", tempColor)}>
                {params.temperature} K ({(params.temperature - 273.15).toFixed(0)}°C)
              </span>
            </div>
            <Slider
              value={[params.temperature]}
              min={273}
              max={800}
              step={1}
              onValueChange={(v) => setParams((p) => ({ ...p, temperature: v[0] }))}
              className="py-1"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0°C</span>
              <span>527°C</span>
            </div>
          </div>

          {/* Concentration */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-slate-300">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                Concentration
              </Label>
              <span className="font-mono text-xs font-bold text-emerald-300">
                {params.concentration} mol/L
              </span>
            </div>
            <Slider
              value={[params.concentration]}
              min={10}
              max={100}
              step={5}
              onValueChange={(v) => setParams((p) => ({ ...p, concentration: v[0] }))}
              className="py-1"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Dilute</span>
              <span>Concentrated</span>
            </div>
          </div>

          {/* Activation Energy */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-slate-300">
                <Flame className="h-3 w-3 text-orange-400" />
                Activation Energy (Eₐ)
              </Label>
              <span className="font-mono text-xs font-bold text-orange-300">
                {params.activationEnergy} kJ/mol
                {params.catalyst && (
                  <span className="ml-1 text-purple-400">→ {(params.activationEnergy * 0.65).toFixed(0)}</span>
                )}
              </span>
            </div>
            <Slider
              value={[params.activationEnergy]}
              min={10}
              max={200}
              step={5}
              onValueChange={(v) => setParams((p) => ({ ...p, activationEnergy: v[0] }))}
              className="py-1"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Easy</span>
              <span>Difficult</span>
            </div>
          </div>

          {/* Catalyst */}
          <div className="flex items-center justify-between rounded-md border border-slate-700/50 bg-slate-900/50 p-2">
            <Label className="flex items-center gap-1.5 text-xs text-slate-300">
              <Sparkles className={cn("h-3.5 w-3.5", params.catalyst ? "text-purple-400" : "text-slate-500")} />
              Catalyst
              <span className="text-[10px] text-slate-500">(lowers Eₐ by 35%)</span>
            </Label>
            <Switch
              checked={params.catalyst}
              onCheckedChange={(c) => setParams((p) => ({ ...p, catalyst: c }))}
            />
          </div>
        </div>

        {/* Calculated values */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">Calculated Rate Constants</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Rate constant k */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2.5">
              <div className="text-[9px] uppercase tracking-wider text-emerald-400/80">Rate Constant k</div>
              <div className="font-mono text-sm font-bold text-emerald-300">{fmtSci(derived.k)}</div>
              <div className="text-[9px] text-slate-500">s⁻¹</div>
            </div>

            {/* Half-life */}
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-2.5">
              <div className="text-[9px] uppercase tracking-wider text-cyan-400/80">Half-life t½</div>
              <div className="font-mono text-sm font-bold text-cyan-300">
                {derived.halfLife > 1e6 ? "∞" : derived.halfLife > 100 ? fmtSci(derived.halfLife) : derived.halfLife.toFixed(2) + "s"}
              </div>
              <div className="text-[9px] text-slate-500">first-order</div>
            </div>

            {/* Effective Eₐ */}
            <div className="rounded-lg border border-orange-500/30 bg-orange-950/30 p-2.5">
              <div className="text-[9px] uppercase tracking-wider text-orange-400/80">Effective Eₐ</div>
              <div className="font-mono text-sm font-bold text-orange-300">
                {derived.effectiveEa.toFixed(1)}
              </div>
              <div className="text-[9px] text-slate-500">kJ/mol</div>
            </div>

            {/* Fraction with sufficient energy */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-950/30 p-2.5">
              <div className="text-[9px] uppercase tracking-wider text-purple-400/80">Energy Fraction</div>
              <div className="font-mono text-sm font-bold text-purple-300">
                {(derived.fractionWithEnergy * 100).toFixed(2)}%
              </div>
              <div className="text-[9px] text-slate-500">molecules ≥ Eₐ</div>
            </div>
          </div>

          {/* Arrhenius equation display */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/60 p-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Arrhenius Equation</div>
            <div className="font-mono text-sm text-slate-200 text-center py-1">
              k = A · e<sup className="text-[10px]">-Eₐ/RT</sup>
            </div>
            <div className="font-mono text-[10px] text-slate-400 text-center">
              = {fmtSci(A_PRE)} · e<sup className="text-[8px]">-{derived.effectiveEa.toFixed(1)}×1000 / (8.314 × {params.temperature})</sup>
            </div>
            <div className="font-mono text-[10px] text-emerald-300 text-center mt-0.5">
              = {fmtSci(derived.k)} s⁻¹
            </div>
          </div>
        </div>

        {/* Reaction progress chart */}
        <div className="rounded-lg border border-slate-700/50 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-500">Reaction Progress</span>
            <span className="font-mono text-xs font-bold text-lime-300">
              {(stats.progress * 100).toFixed(1)}%
            </span>
          </div>
          <ProgressChart data={progressData} />
        </div>

        {/* Educational note */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-[10px] text-amber-200/90">
          <p className="font-semibold mb-1">💡 Collision Theory</p>
          <p>
            Reactions occur when molecules collide with sufficient energy (≥ Eₐ) and proper orientation.
            Increasing <span className="text-amber-300 font-medium">temperature</span> makes molecules move faster
            (more collisions, more energy). Increasing <span className="text-amber-300 font-medium">concentration</span>{" "}
            means more molecules per volume (more collisions). A{" "}
            <span className="text-amber-300 font-medium">catalyst</span> provides an alternative pathway
            with lower Eₐ.
          </p>
        </div>
      </div>
    </Card>
  );
}

// Tiny inline SVG chart for reaction progress
function ProgressChart({ data }: { data: { t: number; progress: number }[] }) {
  const W = 280;
  const H = 80;
  const maxT = data.length > 0 ? Math.max(10, data[data.length - 1].t) : 10;
  const path = data.length > 0
    ? data
        .map((d, i) => {
          const x = (d.t / maxT) * W;
          const y = H - d.progress * H;
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ")
    : "";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
      <defs>
        <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(163, 230, 53, 0.4)" />
          <stop offset="100%" stopColor="rgba(163, 230, 53, 0)" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="rgba(100, 116, 139, 0.15)" strokeWidth="0.5" />
      ))}
      {/* Fill area */}
      {path && (
        <>
          <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#progGrad)" />
          <path d={path} fill="none" stroke="#a3e635" strokeWidth="1.5" />
          {/* Endpoint */}
          {data.length > 0 && (
            <circle
              cx={(data[data.length - 1].t / maxT) * W}
              cy={H - data[data.length - 1].progress * H}
              r="3"
              fill="#a3e635"
              stroke="rgba(15, 23, 42, 0.8)"
              strokeWidth="1"
            />
          )}
        </>
      )}
      {/* Axis labels */}
      <text x="2" y={H - 2} fontSize="8" fill="rgba(148, 163, 184, 0.6)" fontFamily="monospace">
        0
      </text>
      <text x={W - 18} y={H - 2} fontSize="8" fill="rgba(148, 163, 184, 0.6)" fontFamily="monospace">
        {maxT.toFixed(0)}s
      </text>
    </svg>
  );
}
