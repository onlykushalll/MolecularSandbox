"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SolubilityRule {
  id: number;
  title: string;
  description: string;
  soluble: string[];
  exceptions: string[];
  icon: "check" | "cross" | "alert";
}

const SOLUBILITY_RULES: SolubilityRule[] = [
  {
    id: 1,
    title: "Alkali Metal & Ammonium Salts",
    description: "All salts of alkali metals (Li⁺, Na⁺, K⁺, Rb⁺, Cs⁺) and ammonium (NH₄⁺) are soluble.",
    soluble: ["NaCl", "K₂SO₄", "NH₄NO₃", "LiBr", "Na₂CO₃"],
    exceptions: [],
    icon: "check",
  },
  {
    id: 2,
    title: "Nitrate & Acetate Salts",
    description: "All nitrates (NO₃⁻) and acetates (CH₃COO⁻) are soluble.",
    soluble: ["AgNO₃", "Pb(NO₃)₂", "NaCH₃COO", "Ca(NO₃)₂"],
    exceptions: [],
    icon: "check",
  },
  {
    id: 3,
    title: "Chlorides, Bromides, Iodides",
    description: "Most halides (Cl⁻, Br⁻, I⁻) are soluble, except with Ag⁺, Pb²⁺, and Hg₂²⁺.",
    soluble: ["NaCl", "KBr", "CaI₂", "FeCl₃"],
    exceptions: ["AgCl ↓", "PbCl₂ ↓", "Hg₂Cl₂ ↓"],
    icon: "alert",
  },
  {
    id: 4,
    title: "Sulfates",
    description: "Most sulfates (SO₄²⁻) are soluble, except Ba²⁺, Pb²⁺, Ca²⁺, and Ag⁺.",
    soluble: ["Na₂SO₄", "K₂SO₄", "MgSO₄", "ZnSO₄"],
    exceptions: ["BaSO₄ ↓", "PbSO₄ ↓", "CaSO₄ ↓ (slightly)", "Ag₂SO₄ ↓ (slightly)"],
    icon: "alert",
  },
  {
    id: 5,
    title: "Carbonates & Phosphates",
    description: "Most carbonates (CO₃²⁻) and phosphates (PO₄³⁻) are insoluble, except with alkali metals and NH₄⁺.",
    soluble: ["Na₂CO₃", "K₃PO₄", "(NH₄)₂CO₃"],
    exceptions: ["CaCO₃ ↓", "BaCO₃ ↓", "FePO₄ ↓", "Ag₃PO₄ ↓"],
    icon: "cross",
  },
  {
    id: 6,
    title: "Hydroxides",
    description: "Most hydroxides (OH⁻) are insoluble, except alkali metals and Ba²⁺. Ca(OH)₂ is slightly soluble.",
    soluble: ["NaOH", "KOH", "Ba(OH)₂", "Ca(OH)₂ (slightly)"],
    exceptions: ["Fe(OH)₃ ↓", "Cu(OH)₂ ↓", "Mg(OH)₂ ↓", "Al(OH)₃ ↓"],
    icon: "cross",
  },
  {
    id: 7,
    title: "Sulfides",
    description: "Most sulfides (S²⁻) are insoluble, except with alkali metals, NH₄⁺, and alkaline earth metals.",
    soluble: ["Na₂S", "K₂S", "(NH₄)₂S", "CaS"],
    exceptions: ["CuS ↓", "FeS ↓", "PbS ↓", "ZnS ↓", "Ag₂S ↓"],
    icon: "cross",
  },
  {
    id: 8,
    title: "Oxides",
    description: "Most oxides (O²⁻) are insoluble. Alkali metal oxides react with water to form hydroxides.",
    soluble: ["Na₂O → NaOH", "K₂O → KOH", "CaO → Ca(OH)₂"],
    exceptions: ["Fe₂O₃ ↓", "CuO ↓", "Al₂O₃ ↓", "MgO ↓ (slightly)"],
    icon: "cross",
  },
];

const ruleIconMap = {
  check: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  cross: <XCircle className="h-4 w-4 text-red-400" />,
  alert: <AlertCircle className="h-4 w-4 text-amber-400" />,
};

const ruleColorMap = {
  check: "border-emerald-500/30 bg-emerald-950/20",
  cross: "border-red-500/30 bg-red-950/20",
  alert: "border-amber-500/30 bg-amber-950/20",
};

export function SolubilityRulesPanel() {
  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="border-b border-slate-700/50 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Solubility Rules</h2>
          <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-200">
            8 rules
          </Badge>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Reference chart for predicting precipitation reactions
        </p>
        {/* Legend */}
        <div className="mt-3 flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span className="text-slate-400">Always soluble</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-amber-400" />
            <span className="text-slate-400">Mostly soluble</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-400" />
            <span className="text-slate-400">Mostly insoluble</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {SOLUBILITY_RULES.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "rounded-lg border p-3 transition-all hover:scale-[1.01]",
                ruleColorMap[rule.icon]
              )}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex-shrink-0">{ruleIconMap[rule.icon]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Rule {rule.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {rule.title}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    {rule.description}
                  </p>

                  {/* Soluble examples */}
                  {rule.soluble.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[9px] font-semibold uppercase text-emerald-400/80">
                        ✓ Soluble
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {rule.soluble.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-emerald-900/30 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exceptions */}
                  {rule.exceptions.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[9px] font-semibold uppercase text-red-400/80">
                        ✗ Insoluble / Exceptions
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {rule.exceptions.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-red-900/30 px-1.5 py-0.5 text-[10px] font-mono text-red-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Quick reference tip */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3">
            <div className="text-[10px] font-semibold text-slate-300 mb-1">💡 Quick Tip</div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              When two solutions mix, check if any combination of cation + anion forms an insoluble salt.
              If yes, a precipitate will form. For example: AgNO₃ + NaCl → AgCl↓ (insoluble by Rule 3).
            </p>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
