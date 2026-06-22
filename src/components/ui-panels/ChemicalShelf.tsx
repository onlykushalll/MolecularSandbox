"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FlaskConical,
  Search,
  Droplets,
  Beaker as BeakerIcon,
  Zap,
  Atom,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import { cn } from "@/lib/utils";
import type { ChemicalCategory, ChemicalData } from "@/lib/chemistry/types";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MoleculeModal } from "@/components/molecule/MoleculeModal";

const categoryColors: Record<ChemicalCategory, string> = {
  reagent: "bg-slate-500",
  acid: "bg-red-500",
  base: "bg-blue-500",
  salt: "bg-purple-500",
  organic: "bg-orange-500",
  indicator: "bg-pink-500",
  solvent: "bg-cyan-500",
  metal: "bg-gray-500",
  gas: "bg-teal-500",
  oxidizer: "bg-yellow-500",
};

const categoryLabels: Record<ChemicalCategory, string> = {
  reagent: "Reagent",
  acid: "Acid",
  base: "Base",
  salt: "Salt",
  organic: "Organic",
  indicator: "Indicator",
  solvent: "Solvent",
  metal: "Metal",
  gas: "Gas",
  oxidizer: "Oxidizer",
};

export function ChemicalShelf() {
  const chemicals = useLabStore((s) => s.chemicals);
  const containers = useLabStore((s) => s.containers);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const addChemicalToContainer = useLabStore((s) => s.addChemicalToContainer);
  const dragVolume = useLabStore((s) => s.dragVolume);
  const setDragVolume = useLabStore((s) => s.setDragVolume);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [autoReact, setAutoReact] = useState(true);
  const [viewingChemical, setViewingChemical] = useState<ChemicalData | null>(null);

  const filtered = useMemo(() => {
    return chemicals.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.formula.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [chemicals, search, categoryFilter]);

  const handleAdd = (chemicalId: string) => {
    if (!selectedContainerId) {
      toast.error("No beaker selected", {
        description: "Click a beaker in the 3D scene first",
      });
      return;
    }
    const chem = chemicals.find((c) => c.id === chemicalId);
    addChemicalToContainer(selectedContainerId, chemicalId, dragVolume, autoReact);
    if (chem) {
      toast.success(`Added ${chem.name}`, {
        description: `${dragVolume}mL → ${selectedContainerId}${autoReact ? " · auto-react on" : ""}`,
      });
    }
  };

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur card-3d">
      <div className="relative border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800/40 to-slate-900 p-4 overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: "radial-gradient(circle at top left, rgba(52, 211, 153, 0.2) 0%, transparent 60%)",
          }}
        />
        <div className="relative mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/20 ring-1 ring-emerald-500/40 inner-sheen">
            <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <h2 className="text-base font-bold text-white glow-emerald">Chemical Shelf</h2>
          <Badge variant="secondary" className="ml-auto bg-slate-700/80 text-slate-200 border border-slate-600/60 inner-sheen">
            <span className="number-ticker">{filtered.length}</span>
          </Badge>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search chemicals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-700 bg-slate-800/80 pl-8 text-white placeholder:text-slate-500 input-glow-focus transition-all"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="border-slate-700 bg-slate-800/80 text-white">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-3 flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-800/30 p-2">
          <Label className="text-[10px] uppercase tracking-wider text-slate-400">Volume:</Label>
          <Input
            type="number"
            value={dragVolume}
            onChange={(e) => setDragVolume(Number(e.target.value))}
            min={1}
            max={250}
            className="h-7 w-20 border-slate-700 bg-slate-900/60 text-xs text-white input-glow-focus"
          />
          <span className="text-xs text-slate-400">mL</span>
          <div className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 transition-all hover:bg-slate-700/30">
            <Zap className={cn("h-3 w-3 transition-colors", autoReact ? "text-amber-400 glow-amber" : "text-slate-600")} />
            <span className={cn("text-[10px] font-medium", autoReact ? "text-amber-300" : "text-slate-500")}>
              Auto
            </span>
            <Switch
              checked={autoReact}
              onCheckedChange={setAutoReact}
              className="scale-75"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="space-y-2 p-3">
          {filtered.map((chem, idx) => (
            <div
              key={chem.id}
              className="group chem-card-hover rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 transition-all hover:border-emerald-500/50 hover:bg-slate-800 hover:shadow-md hover:shadow-emerald-950/30 stagger-in"
              style={{ animationDelay: `${Math.min(idx * 20, 400)}ms` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border border-white/20 shadow-inner"
                  style={{
                    backgroundColor: chem.hexColor,
                    boxShadow: `0 0 8px ${chem.hexColor}40, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {chem.name}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium text-white",
                        categoryColors[chem.category]
                      )}
                    >
                      {categoryLabels[chem.category]}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <button
                      onClick={() => setViewingChemical(chem)}
                      className="font-mono text-slate-300 transition-colors hover:text-emerald-300 hover:underline"
                      title="View 3D molecule"
                    >
                      {chem.formula}
                    </button>
                    <span>·</span>
                    <span>M={chem.molarMass}</span>
                  </div>
                  {chem.hazards.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {chem.hazards.slice(0, 3).map((h) => (
                        <span
                          key={h}
                          className="rounded bg-red-900/40 px-1 py-0.5 text-[9px] text-red-300"
                        >
                          {h.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleAdd(chem.id)}
                      disabled={!selectedContainerId}
                      className="h-7 flex-1 bg-emerald-600 text-xs hover:bg-emerald-500 disabled:opacity-40"
                    >
                      <Droplets className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingChemical(chem)}
                      className="h-7 border-slate-600 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 hover:text-emerald-300"
                      title="View 3D molecule"
                    >
                      <Atom className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {selectedContainerId && (
        <div className="border-t border-slate-700/50 bg-slate-950/50 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <BeakerIcon className="h-3 w-3" />
            <span>
              Target:{" "}
              <span className="font-mono text-emerald-400">
                {selectedContainerId}
              </span>
            </span>
          </div>
        </div>
      )}

      <MoleculeModal
        chemical={viewingChemical}
        open={!!viewingChemical}
        onOpenChange={(o) => !o && setViewingChemical(null)}
      />
    </Card>
  );
}
