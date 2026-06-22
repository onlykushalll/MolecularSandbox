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
  Trash2,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import { cn } from "@/lib/utils";
import type { ChemicalCategory } from "@/lib/chemistry/types";

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
      alert("Select a beaker first by clicking it in the 3D scene");
      return;
    }
    addChemicalToContainer(selectedContainerId, chemicalId, dragVolume);
  };

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="border-b border-slate-700/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Chemical Shelf</h2>
          <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-200">
            {filtered.length}
          </Badge>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search chemicals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-700 bg-slate-800 pl-8 text-white placeholder:text-slate-500"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
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

        <div className="mt-3 flex items-center gap-2">
          <Label className="text-xs text-slate-400">Volume:</Label>
          <Input
            type="number"
            value={dragVolume}
            onChange={(e) => setDragVolume(Number(e.target.value))}
            min={1}
            max={250}
            className="h-7 w-20 border-slate-700 bg-slate-800 text-xs text-white"
          />
          <span className="text-xs text-slate-400">mL</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {filtered.map((chem) => (
            <div
              key={chem.id}
              className="group rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 transition-all hover:border-emerald-500/50 hover:bg-slate-800"
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border border-white/20"
                  style={{ backgroundColor: chem.hexColor }}
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
                  <div className="mt-0.5 text-xs text-slate-400">
                    {chem.formula} · M={chem.molarMass}
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
                  <Button
                    size="sm"
                    onClick={() => handleAdd(chem.id)}
                    disabled={!selectedContainerId}
                    className="mt-2 h-7 w-full bg-emerald-600 text-xs hover:bg-emerald-500 disabled:opacity-40"
                  >
                    <Droplets className="mr-1 h-3 w-3" />
                    Add to beaker
                  </Button>
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
    </Card>
  );
}
