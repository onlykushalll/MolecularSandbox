"use client";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoleculeViewer3D } from "./MoleculeViewer3D";
import { getFormulaBreakdown, getElementInfo } from "@/lib/chemistry/molecule";
import type { ChemicalData } from "@/lib/chemistry/types";
import { X, Atom, Beaker, Thermometer, Gauge, Zap } from "lucide-react";

interface MoleculeModalProps {
  chemical: ChemicalData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoleculeModal({ chemical, open, onOpenChange }: MoleculeModalProps) {
  const breakdown = useMemo(
    () => (chemical ? getFormulaBreakdown(chemical.formula) : []),
    [chemical]
  );

  if (!chemical) return null;

  const stateColors: Record<string, string> = {
    solid: "bg-amber-600",
    liquid: "bg-cyan-600",
    gas: "bg-teal-500",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-slate-700 bg-slate-950 p-0 text-white">
        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-t-lg border-b border-slate-700 bg-gradient-to-br from-emerald-950/60 via-slate-950 to-cyan-950/40 p-5">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.2) 0%, transparent 50%)",
            }}
          />
          <DialogHeader className="relative">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 h-12 w-12 flex-shrink-0 rounded-xl border-2 border-white/20 shadow-lg"
                style={{ backgroundColor: chemical.hexColor }}
              />
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-white">
                  {chemical.name}
                </DialogTitle>
                <DialogDescription className="mt-0.5 font-mono text-sm text-emerald-300">
                  {chemical.formula}
                </DialogDescription>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge className={`${stateColors[chemical.stateAtSTP]} text-white`}>
                    {chemical.stateAtSTP}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {chemical.category}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    M = {chemical.molarMass} g/mol
                  </Badge>
                  {chemical.hazards.slice(0, 3).map((h) => (
                    <Badge key={h} className="bg-red-900/60 text-red-200">
                      {h.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* 3D Molecule viewer */}
        <div className="p-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <Atom className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium uppercase tracking-wider">3D Molecular Structure</span>
          </div>
          <MoleculeViewer3D formula={chemical.formula} height={340} />

          {/* Atom breakdown */}
          <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Composition
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {breakdown.map((b) => {
                const info = getElementInfo(b.el);
                return (
                  <div
                    key={b.el}
                    className="flex items-center gap-2 rounded-md bg-slate-800/50 px-2.5 py-1.5"
                  >
                    <div
                      className="h-5 w-5 flex-shrink-0 rounded-full border border-white/20"
                      style={{ backgroundColor: info.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">
                        {b.el}
                        {b.count > 1 && (
                          <span className="ml-0.5 text-emerald-400">×{b.count}</span>
                        )}
                      </div>
                      <div className="truncate text-[10px] text-slate-400">{b.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physical properties grid */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <PropertyCard
              icon={<Thermometer className="h-3.5 w-3.5" />}
              label="Boiling"
              value={`${chemical.boilingPoint}°C`}
              color="text-orange-300"
            />
            <PropertyCard
              icon={<Thermometer className="h-3.5 w-3.5" />}
              label="Melting"
              value={`${chemical.meltingPoint}°C`}
              color="text-cyan-300"
            />
            <PropertyCard
              icon={<Gauge className="h-3.5 w-3.5" />}
              label="Density"
              value={`${chemical.density} g/mL`}
              color="text-purple-300"
            />
            <PropertyCard
              icon={<Zap className="h-3.5 w-3.5" />}
              label="Heat Cap"
              value={`${chemical.specificHeatCapacity} J/g·K`}
              color="text-amber-300"
            />
          </div>

          {/* Description */}
          {chemical.description && (
            <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                About this chemical
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{chemical.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PropertyCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}
