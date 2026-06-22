"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Beaker,
  Droplet,
  TrendingUp,
  RotateCcw,
  Play,
  Pause,
  Target,
  FlaskConical,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Acid dissociation constants (Ka) — pKa values
const ACIDS: Record<string, { name: string; pKa: number; n: number; label: string }> = {
  hcl: { name: "HCl", pKa: -7, n: 1, label: "Strong acid (HCl)" },
  hno3: { name: "HNO₃", pKa: -1.4, n: 1, label: "Strong acid (HNO₃)" },
  h2so4: { name: "H₂SO₄", pKa: -3, n: 2, label: "Strong diprotic (H₂SO₄)" },
  ch3cooh: { name: "CH₃COOH", pKa: 4.76, n: 1, label: "Weak acid (Acetic)" },
  hf: { name: "HF", pKa: 3.17, n: 1, label: "Weak acid (HF)" },
  h3po4: { name: "H₃PO₄", pKa: 2.16, n: 1, label: "Weak triprotic (H₃PO₄)" },
  h2co3: { name: "H₂CO₃", pKa: 6.35, n: 1, label: "Carbonic acid" },
};

const BASES: Record<string, { name: string; pKb: number; n: number; label: string }> = {
  naoh: { name: "NaOH", pKb: -0.2, n: 1, label: "Strong base (NaOH)" },
  koh: { name: "KOH", pKb: -0.2, n: 1, label: "Strong base (KOH)" },
  nh3: { name: "NH₃", pKb: 4.75, n: 1, label: "Weak base (NH₃)" },
};

type TitrationMode = "acid-into-base" | "base-into-acid";

interface CurvePoint {
  v: number; // titrant volume added (mL)
  ph: number;
}

function phForStrongAcidStrongBase(
  analyteVol: number,
  analyteConc: number,
  analyteN: number,
  titrantVol: number,
  titrantConc: number,
  titrantN: number,
  isAnalyteAcid: boolean
): number {
  const molesAnalyte = analyteVol / 1000 * analyteConc * analyteN;
  const molesTitrant = titrantVol / 1000 * titrantConc * titrantN;
  const totalVol = (analyteVol + titrantVol) / 1000;
  let ph: number;
  if (isAnalyteAcid) {
    // Acid analyte, base titrant
    const net = molesAnalyte - molesTitrant;
    if (net > 1e-9) {
      // Acid excess
      const h = net / totalVol;
      ph = -Math.log10(h);
    } else if (net < -1e-9) {
      // Base excess
      const oh = -net / totalVol;
      ph = 14 + Math.log10(oh);
    } else {
      ph = 7;
    }
  } else {
    // Base analyte, acid titrant
    const net = molesAnalyte - molesTitrant;
    if (net > 1e-9) {
      const oh = net / totalVol;
      ph = 14 + Math.log10(oh);
    } else if (net < -1e-9) {
      const h = -net / totalVol;
      ph = -Math.log10(h);
    } else {
      ph = 7;
    }
  }
  return Math.max(0, Math.min(14, ph));
}

function phForWeakAcidStrongBase(
  analyteVol: number,
  acidConc: number,
  acidKa: number,
  titrantVol: number,
  baseConc: number
): number {
  const molesAcid = analyteVol / 1000 * acidConc;
  const molesBase = titrantVol / 1000 * baseConc;
  const totalVol = (analyteVol + titrantVol) / 1000;
  // Henderson-Hasselbalch regions
  if (molesBase <= 0) {
    // Initial weak acid: [H+] = sqrt(Ka * C)
    const c = acidConc;
    const h = Math.sqrt(acidKa * c);
    return -Math.log10(h);
  }
  if (molesBase < molesAcid) {
    // Buffer region
    const ratio = molesBase / (molesAcid - molesBase);
    const pKa = -Math.log10(acidKa);
    return pKa + Math.log10(ratio);
  }
  if (Math.abs(molesBase - molesAcid) < 1e-9) {
    // Equivalence point — salt hydrolysis
    const cSalt = molesAcid / totalVol;
    const kb = 1e-14 / acidKa;
    const oh = Math.sqrt(kb * cSalt);
    return 14 + Math.log10(oh);
  }
  // Beyond equivalence — excess base
  const excessBase = molesBase - molesAcid;
  const oh = excessBase / totalVol;
  return 14 + Math.log10(oh);
}

function phForWeakBaseStrongAcid(
  analyteVol: number,
  baseConc: number,
  baseKb: number,
  titrantVol: number,
  acidConc: number
): number {
  const molesBase = analyteVol / 1000 * baseConc;
  const molesAcid = titrantVol / 1000 * acidConc;
  const totalVol = (analyteVol + titrantVol) / 1000;
  if (molesAcid <= 0) {
    const c = baseConc;
    const oh = Math.sqrt(baseKb * c);
    return 14 + Math.log10(oh);
  }
  if (molesAcid < molesBase) {
    const ratio = molesAcid / (molesBase - molesAcid);
    const pKb = -Math.log10(baseKb);
    const pOH = pKb + Math.log10(ratio);
    return 14 - pOH;
  }
  if (Math.abs(molesAcid - molesBase) < 1e-9) {
    const cSalt = molesBase / totalVol;
    const ka = 1e-14 / baseKb;
    const h = Math.sqrt(ka * cSalt);
    return -Math.log10(h);
  }
  const excessAcid = molesAcid - molesBase;
  const h = excessAcid / totalVol;
  return -Math.log10(h);
}

export function TitrationSimulator() {
  const [analyteId, setAnalyteId] = useState<string>("ch3cooh");
  const [titrantId, setTitrantId] = useState<string>("naoh");
  const [analyteVol, setAnalyteVol] = useState<number>(25); // mL
  const [analyteConc, setAnalyteConc] = useState<number>(0.1); // M
  const [titrantConc, setTitrantConc] = useState<number>(0.1); // M
  const [addedVol, setAddedVol] = useState<number>(0);
  const [autoTitrating, setAutoTitrating] = useState<boolean>(false);
  const autoRef = useRef<number | null>(null);

  const analyteIsAcid = ACIDS[analyteId] !== undefined;
  const analyte = analyteIsAcid ? ACIDS[analyteId] : BASES[analyteId];
  const titrantIsAcid = ACIDS[titrantId] !== undefined;
  const titrant = titrantIsAcid ? ACIDS[titrantId] : BASES[titrantId];

  // Compute equivalence volume
  const equivalenceVol = useMemo(() => {
    if (!analyte || !titrant) return 25;
    const molesAnalyte = (analyteVol / 1000) * analyteConc * analyte.n;
    return (molesAnalyte / (titrantConc * titrant.n)) * 1000;
  }, [analyte, titrant, analyteVol, analyteConc, titrantConc]);

  // Max volume to display (150% of equivalence)
  const maxVol = useMemo(() => Math.ceil(equivalenceVol * 1.6), [equivalenceVol]);

  // Generate full curve
  const curve = useMemo<CurvePoint[]>(() => {
    if (!analyte || !titrant) return [];
    const points: CurvePoint[] = [];
    const steps = 200;
    const acidEntry = analyteIsAcid ? analyte : undefined;
    const baseEntry = !analyteIsAcid ? analyte : undefined;
    const acidTitrant = titrantIsAcid ? titrant : undefined;
    const baseTitrant = !titrantIsAcid ? titrant : undefined;
    const isStrongStrong =
      (acidEntry && acidEntry.pKa < 0) || (baseEntry && baseEntry.pKb < 0);
    for (let i = 0; i <= steps; i++) {
      const v = (i / steps) * maxVol;
      let ph: number;
      if (analyteIsAcid) {
        // Acid analyte, base titrant
        const acid = acidEntry!;
        if (acid.pKa < 0 && baseTitrant && baseTitrant.pKb < 0) {
          // Strong acid + strong base
          ph = phForStrongAcidStrongBase(
            analyteVol, analyteConc, acid.n,
            v, titrantConc, baseTitrant.n, true
          );
        } else if (acid.pKa < 0) {
          // Strong acid + weak base (rare but possible)
          ph = phForStrongAcidStrongBase(
            analyteVol, analyteConc, acid.n,
            v, titrantConc, baseTitrant?.n ?? 1, true
          );
        } else {
          // Weak acid + strong base
          const ka = Math.pow(10, -acid.pKa);
          ph = phForWeakAcidStrongBase(analyteVol, analyteConc, ka, v, titrantConc);
        }
      } else {
        // Base analyte, acid titrant
        const base = baseEntry!;
        if (base.pKb < 0 && acidTitrant && acidTitrant.pKa < 0) {
          ph = phForStrongAcidStrongBase(
            analyteVol, analyteConc, base.n,
            v, titrantConc, acidTitrant.n, false
          );
        } else if (base.pKb < 0) {
          ph = phForStrongAcidStrongBase(
            analyteVol, analyteConc, base.n,
            v, titrantConc, acidTitrant?.n ?? 1, false
          );
        } else {
          const kb = Math.pow(10, -base.pKb);
          ph = phForWeakBaseStrongAcid(analyteVol, analyteConc, kb, v, titrantConc);
        }
      }
      points.push({ v, ph: Math.max(0, Math.min(14, ph)) });
    }
    return points;
  }, [analyte, titrant, analyteIsAcid, titrantIsAcid, analyteVol, analyteConc, titrantConc, maxVol]);

  // Current pH
  const currentPH = useMemo(() => {
    if (curve.length === 0) return 7;
    // Find closest point
    let closest = curve[0];
    let minDiff = Math.abs(closest.v - addedVol);
    for (const p of curve) {
      const d = Math.abs(p.v - addedVol);
      if (d < minDiff) {
        minDiff = d;
        closest = p;
      }
    }
    return closest.ph;
  }, [curve, addedVol]);

  // Indicator color (universal indicator)
  const indicatorColor = phToColor(currentPH);
  const indicatorName = phToIndicatorName(currentPH);

  // Auto-titration effect — slowly increase volume
  useEffect(() => {
    if (autoTitrating) {
      autoRef.current = window.setInterval(() => {
        setAddedVol((v) => {
          const next = v + maxVol / 100;
          if (next >= maxVol) {
            setAutoTitrating(false);
            return maxVol;
          }
          return next;
        });
      }, 80);
      return () => {
        if (autoRef.current) clearInterval(autoRef.current);
      };
    }
  }, [autoTitrating, maxVol]);

  const handleReset = () => {
    setAddedVol(0);
    setAutoTitrating(false);
  };

  // Detect equivalence point proximity
  const atEquivalence = Math.abs(addedVol - equivalenceVol) < maxVol * 0.005;

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-purple-950/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 shadow-md">
              <Droplet className="h-4 w-4 text-white" />
              <div className="absolute inset-0 rounded-lg bg-cyan-400/20 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Titration Simulator</h2>
              <p className="text-[10px] text-slate-400">Acid-base titration curves · Henderson-Hasselbalch</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAutoTitrating((a) => !a)}
              className={cn(
                "h-7 px-2 text-xs",
                autoTitrating
                  ? "text-amber-300 hover:bg-amber-950/40"
                  : "text-emerald-300 hover:bg-emerald-950/40"
              )}
            >
              {autoTitrating ? <><Pause className="mr-1 h-3 w-3" />Stop</> : <><Play className="mr-1 h-3 w-3" />Auto</>}
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
        {/* Configuration */}
        <div className="grid grid-cols-2 gap-2">
          {/* Analyte selector */}
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-slate-500">Analyte (in flask)</Label>
            <Select value={analyteId} onValueChange={setAnalyteId}>
              <SelectTrigger className="h-8 bg-slate-950/60 border-slate-700 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACIDS).map(([id, a]) => (
                  <SelectItem key={id} value={id} className="text-xs">
                    <span className="text-red-400 font-mono mr-1">A</span>{a.label}
                  </SelectItem>
                ))}
                {Object.entries(BASES).map(([id, b]) => (
                  <SelectItem key={id} value={id} className="text-xs">
                    <span className="text-blue-400 font-mono mr-1">B</span>{b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Titrant selector */}
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-slate-500">Titrant (in burette)</Label>
            <Select value={titrantId} onValueChange={setTitrantId}>
              <SelectTrigger className="h-8 bg-slate-950/60 border-slate-700 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACIDS).map(([id, a]) => (
                  <SelectItem key={id} value={id} className="text-xs">
                    <span className="text-red-400 font-mono mr-1">A</span>{a.label}
                  </SelectItem>
                ))}
                {Object.entries(BASES).map(([id, b]) => (
                  <SelectItem key={id} value={id} className="text-xs">
                    <span className="text-blue-400 font-mono mr-1">B</span>{b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Validate pairing */}
        {analyteIsAcid === titrantIsAcid && (
          <div className="rounded-md border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-[10px] text-amber-200">
            ⚠ Titrant should be opposite type to analyte for proper titration.
          </div>
        )}

        {/* Concentration sliders */}
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-700/50 bg-slate-950/60 p-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-slate-400">Analyte conc.</Label>
              <span className="font-mono text-xs font-bold text-cyan-300">{analyteConc.toFixed(2)} M</span>
            </div>
            <Slider
              value={[analyteConc * 100]}
              min={5}
              max={200}
              step={5}
              onValueChange={(v) => setAnalyteConc(v[0] / 100)}
              className="py-1"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-slate-400">Titrant conc.</Label>
              <span className="font-mono text-xs font-bold text-purple-300">{titrantConc.toFixed(2)} M</span>
            </div>
            <Slider
              value={[titrantConc * 100]}
              min={5}
              max={200}
              step={5}
              onValueChange={(v) => setTitrantConc(v[0] / 100)}
              className="py-1"
            />
          </div>
        </div>

        {/* Volume slider */}
        <div className="rounded-lg border border-slate-700/50 bg-slate-950/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-300 flex items-center gap-1.5">
              <Droplet className="h-3 w-3 text-cyan-400" />
              Titrant volume added
            </Label>
            <span className="font-mono text-sm font-bold text-cyan-300">
              {addedVol.toFixed(2)} mL
            </span>
          </div>
          <Slider
            value={[addedVol]}
            min={0}
            max={maxVol}
            step={0.05}
            onValueChange={(v) => setAddedVol(v[0])}
            className="py-1"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>0 mL</span>
            <span className="text-amber-400 font-medium">≡ {equivalenceVol.toFixed(2)} mL</span>
            <span>{maxVol.toFixed(0)} mL</span>
          </div>
        </div>

        {/* Live readings */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/60 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Current pH</div>
            <div
              className="font-mono text-lg font-bold"
              style={{ color: indicatorColor }}
            >
              {currentPH.toFixed(2)}
            </div>
            <div className="text-[9px]" style={{ color: indicatorColor }}>{indicatorName}</div>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-amber-400/80">Equivalence</div>
            <div className="font-mono text-sm font-bold text-amber-300">
              {equivalenceVol.toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-500">mL titrant</div>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-emerald-400/80">Progress</div>
            <div className="font-mono text-sm font-bold text-emerald-300">
              {Math.min(100, (addedVol / equivalenceVol) * 100).toFixed(0)}%
            </div>
            <div className="text-[9px] text-slate-500">to equiv.</div>
          </div>
        </div>

        {/* Beaker visualization with indicator color */}
        <div className="relative rounded-lg border border-slate-700/50 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-500">Beaker (with universal indicator)</span>
            {atEquivalence && (
              <Badge className="bg-amber-500 text-white text-[9px] animate-pulse">
                <Target className="mr-1 h-2.5 w-2.5" />
                At equivalence!
              </Badge>
            )}
          </div>
          <div className="flex items-end justify-center gap-3 py-2">
            {/* Burette */}
            <div className="relative flex flex-col items-center">
              <div className="text-[9px] text-slate-400 mb-1">Burette</div>
              <div className="relative h-32 w-3 rounded-t-full border-l border-r border-t border-slate-600 bg-slate-900/80 overflow-hidden">
                {/* Liquid level */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-purple-300 transition-all duration-200"
                  style={{
                    height: `${Math.max(0, 100 - (addedVol / maxVol) * 100)}%`,
                  }}
                />
                {/* Tick marks */}
                {[0.25, 0.5, 0.75].map((t) => (
                  <div
                    key={t}
                    className="absolute left-0 right-0 border-t border-slate-600/50"
                    style={{ bottom: `${t * 100}%` }}
                  />
                ))}
              </div>
              {/* Stopcock */}
              <div className="h-2 w-4 bg-slate-700 rounded-sm" />
              {/* Drop */}
              {autoTitrating && (
                <div
                  className="absolute top-32 h-2 w-2 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDuration: "0.4s" }}
                />
              )}
            </div>

            {/* Erlenmeyer flask */}
            <div className="flex flex-col items-center">
              <div className="text-[9px] text-slate-400 mb-1">Flask ({analyte?.name})</div>
              <svg viewBox="0 0 100 130" className="w-24 h-32">
                <defs>
                  <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={indicatorColor} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={indicatorColor} stopOpacity="0.95" />
                  </linearGradient>
                </defs>
                {/* Flask outline */}
                <path
                  d="M 40 10 L 40 40 L 20 110 Q 18 122 30 122 L 70 122 Q 82 122 80 110 L 60 40 L 60 10 Z"
                  fill="rgba(15, 23, 42, 0.4)"
                  stroke="rgba(148, 163, 184, 0.6)"
                  strokeWidth="1.5"
                />
                {/* Liquid */}
                <path
                  d={`M ${42 - 2} ${50 + (1 - analyteVol / 50) * 60} L ${58 + 2} ${50 + (1 - analyteVol / 50) * 60} L ${80 - 2} 110 Q 82 120 70 120 L 30 120 Q 18 120 20 110 Z`}
                  fill="url(#liquidGrad)"
                  className="transition-all duration-300"
                />
                {/* Surface ripple */}
                <ellipse
                  cx="50"
                  cy={50 + (1 - analyteVol / 50) * 60}
                  rx="10"
                  ry="2"
                  fill={indicatorColor}
                  opacity="0.7"
                />
                {/* Volume label */}
                <text
                  x="50"
                  y="100"
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgba(255, 255, 255, 0.85)"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {analyteVol + addedVol.toFixed(1)} mL
                </text>
              </svg>
              <div
                className="text-[10px] font-mono mt-1 px-2 py-0.5 rounded"
                style={{
                  background: `${indicatorColor}20`,
                  color: indicatorColor,
                }}
              >
                pH {currentPH.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Titration curve */}
        <div className="rounded-lg border border-slate-700/50 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-500">Titration Curve</span>
            <span className="text-[9px] text-slate-400">pH vs Volume</span>
          </div>
          <TitrationChart
            curve={curve}
            addedVol={addedVol}
            equivalenceVol={equivalenceVol}
            maxVol={maxVol}
          />
        </div>

        {/* Indicator legend */}
        <div className="rounded-lg border border-slate-700/50 bg-slate-950/60 p-3">
          <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-2">pH Color Spectrum</div>
          <div className="h-3 rounded-full overflow-hidden" style={{
            background: "linear-gradient(to right, #dc2626, #f97316, #eab308, #84cc16, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #d946ef)"
          }} />
          <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
            <span>0</span><span>2</span><span>4</span><span>6</span><span>7</span><span>8</span><span>10</span><span>12</span><span>14</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Current indicator color:{" "}
            <span className="font-mono font-bold" style={{ color: indicatorColor }}>
              {indicatorName}
            </span>
          </div>
        </div>

        {/* Educational note */}
        <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3 text-[10px] text-purple-200/90">
          <p className="font-semibold mb-1">💡 Henderson-Hasselbalch Equation</p>
          <p className="font-mono text-center my-1 text-purple-300">
            pH = pKₐ + log([A⁻]/[HA])
          </p>
          <p>
            At the <span className="text-amber-300 font-medium">half-equivalence point</span> (V = ½ V_eq),
            pH = pKₐ of the weak acid. At the{" "}
            <span className="text-amber-300 font-medium">equivalence point</span>, moles of titrant = moles of analyte.
            For weak acid + strong base, equivalence pH &gt; 7 (basic salt).
          </p>
        </div>
      </div>
    </Card>
  );
}

function TitrationChart({
  curve,
  addedVol,
  equivalenceVol,
  maxVol,
}: {
  curve: CurvePoint[];
  addedVol: number;
  equivalenceVol: number;
  maxVol: number;
}) {
  const W = 320;
  const H = 180;
  const padL = 30;
  const padB = 24;
  const padT = 10;
  const padR = 10;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xScale = (v: number) => padL + (v / maxVol) * plotW;
  const yScale = (ph: number) => padT + (1 - ph / 14) * plotH;

  const path = curve.length > 0
    ? curve.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.v).toFixed(1)},${yScale(p.ph).toFixed(1)}`).join(" ")
    : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect x={padL} y={padT} width={plotW} height={plotH} fill="rgba(2, 6, 23, 0.5)" />
      {/* Grid lines (horizontal pH) */}
      {[0, 2, 4, 7, 9, 11, 14].map((ph) => (
        <g key={ph}>
          <line
            x1={padL} x2={W - padR}
            y1={yScale(ph)} y2={yScale(ph)}
            stroke={ph === 7 ? "rgba(34, 197, 94, 0.25)" : "rgba(100, 116, 139, 0.15)"}
            strokeWidth="0.5"
            strokeDasharray={ph === 7 ? "3,2" : "2,2"}
          />
          <text x={padL - 4} y={yScale(ph) + 3} fontSize="8" fill="rgba(148, 163, 184, 0.7)" textAnchor="end" fontFamily="monospace">
            {ph}
          </text>
        </g>
      ))}
      {/* Vertical grid (volume) */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const v = t * maxVol;
        return (
          <g key={t}>
            <line
              x1={xScale(v)} x2={xScale(v)}
              y1={padT} y2={H - padB}
              stroke="rgba(100, 116, 139, 0.12)"
              strokeWidth="0.5"
            />
            <text x={xScale(v)} y={H - padB + 12} fontSize="8" fill="rgba(148, 163, 184, 0.7)" textAnchor="middle" fontFamily="monospace">
              {v.toFixed(0)}
            </text>
          </g>
        );
      })}
      {/* Equivalence point vertical line */}
      <line
        x1={xScale(equivalenceVol)} x2={xScale(equivalenceVol)}
        y1={padT} y2={H - padB}
        stroke="rgba(251, 191, 36, 0.6)"
        strokeWidth="1"
        strokeDasharray="4,2"
      />
      <text
        x={xScale(equivalenceVol)}
        y={padT + 8}
        fontSize="8"
        fill="rgba(251, 191, 36, 0.9)"
        textAnchor="middle"
        fontFamily="monospace"
      >
        V_eq
      </text>
      {/* Curve */}
      {path && (
        <>
          {/* Fill area under curve */}
          <path
            d={`${path} L${xScale(curve[curve.length - 1].v).toFixed(1)},${yScale(0).toFixed(1)} L${xScale(curve[0].v).toFixed(1)},${yScale(0).toFixed(1)} Z`}
            fill="rgba(139, 92, 246, 0.08)"
          />
          <path d={path} fill="none" stroke="url(#curveGrad)" strokeWidth="2" />
        </>
      )}
      {/* Current position dot */}
      <circle
        cx={xScale(addedVol)}
        cy={yScale(curve.length > 0 ? curve[Math.min(curve.length - 1, Math.floor((addedVol / maxVol) * curve.length))].ph : 7)}
        r="4"
        fill="#22d3ee"
        stroke="rgba(15, 23, 42, 0.9)"
        strokeWidth="1.5"
      />
      <circle
        cx={xScale(addedVol)}
        cy={yScale(curve.length > 0 ? curve[Math.min(curve.length - 1, Math.floor((addedVol / maxVol) * curve.length))].ph : 7)}
        r="8"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="0.5"
        opacity="0.4"
      />
      {/* Axis labels */}
      <text x={(padL + W - padR) / 2} y={H - 2} fontSize="9" fill="rgba(148, 163, 184, 0.7)" textAnchor="middle">
        Volume titrant (mL)
      </text>
      <text x={8} y={(padT + H - padB) / 2} fontSize="9" fill="rgba(148, 163, 184, 0.7)" textAnchor="middle" transform={`rotate(-90 8 ${(padT + H - padB) / 2})`}>
        pH
      </text>
    </svg>
  );
}

function phToColor(ph: number): string {
  // Universal indicator approximate colors
  if (ph < 2) return "#dc2626"; // red
  if (ph < 3.5) return "#f97316"; // orange
  if (ph < 5) return "#eab308"; // yellow
  if (ph < 6) return "#84cc16"; // yellow-green
  if (ph < 7.5) return "#22c55e"; // green
  if (ph < 8.5) return "#06b6d4"; // teal
  if (ph < 10) return "#3b82f6"; // blue
  if (ph < 12) return "#8b5cf6"; // violet
  return "#d946ef"; // purple
}

function phToIndicatorName(ph: number): string {
  if (ph < 3) return "Strongly Acidic";
  if (ph < 6) return "Acidic";
  if (ph < 8) return "Neutral";
  if (ph < 11) return "Basic";
  return "Strongly Basic";
}
