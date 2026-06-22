"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Atom,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Periodic table data — first 56 elements + Lanthanides/Actinides (simplified)
interface ElementData {
  number: number;
  symbol: string;
  name: string;
  mass: number;
  category: string;
  group?: number;
  period: number;
  electronConfig?: string;
  electronegativity?: number;
  oxidationStates?: string;
}

const ELEMENTS: ElementData[] = [
  { number: 1, symbol: "H", name: "Hydrogen", mass: 1.008, category: "nonmetal", group: 1, period: 1, electronegativity: 2.20, oxidationStates: "+1, -1" },
  { number: 2, symbol: "He", name: "Helium", mass: 4.003, category: "noble-gas", group: 18, period: 1, electronegativity: 0, oxidationStates: "0" },
  { number: 3, symbol: "Li", name: "Lithium", mass: 6.941, category: "alkali-metal", group: 1, period: 2, electronegativity: 0.98, oxidationStates: "+1" },
  { number: 4, symbol: "Be", name: "Beryllium", mass: 9.012, category: "alkaline-earth", group: 2, period: 2, electronegativity: 1.57, oxidationStates: "+2" },
  { number: 5, symbol: "B", name: "Boron", mass: 10.81, category: "metalloid", group: 13, period: 2, electronegativity: 2.04, oxidationStates: "+3" },
  { number: 6, symbol: "C", name: "Carbon", mass: 12.011, category: "nonmetal", group: 14, period: 2, electronegativity: 2.55, oxidationStates: "+4, -4" },
  { number: 7, symbol: "N", name: "Nitrogen", mass: 14.007, category: "nonmetal", group: 15, period: 2, electronegativity: 3.04, oxidationStates: "-3, +5" },
  { number: 8, symbol: "O", name: "Oxygen", mass: 15.999, category: "nonmetal", group: 16, period: 2, electronegativity: 3.44, oxidationStates: "-2" },
  { number: 9, symbol: "F", name: "Fluorine", mass: 18.998, category: "halogen", group: 17, period: 2, electronegativity: 3.98, oxidationStates: "-1" },
  { number: 10, symbol: "Ne", name: "Neon", mass: 20.180, category: "noble-gas", group: 18, period: 2, electronegativity: 0, oxidationStates: "0" },
  { number: 11, symbol: "Na", name: "Sodium", mass: 22.990, category: "alkali-metal", group: 1, period: 3, electronegativity: 0.93, oxidationStates: "+1" },
  { number: 12, symbol: "Mg", name: "Magnesium", mass: 24.305, category: "alkaline-earth", group: 2, period: 3, electronegativity: 1.31, oxidationStates: "+2" },
  { number: 13, symbol: "Al", name: "Aluminium", mass: 26.982, category: "post-transition", group: 13, period: 3, electronegativity: 1.61, oxidationStates: "+3" },
  { number: 14, symbol: "Si", name: "Silicon", mass: 28.086, category: "metalloid", group: 14, period: 3, electronegativity: 1.90, oxidationStates: "+4, -4" },
  { number: 15, symbol: "P", name: "Phosphorus", mass: 30.974, category: "nonmetal", group: 15, period: 3, electronegativity: 2.19, oxidationStates: "+5, -3" },
  { number: 16, symbol: "S", name: "Sulfur", mass: 32.065, category: "nonmetal", group: 16, period: 3, electronegativity: 2.58, oxidationStates: "-2, +6" },
  { number: 17, symbol: "Cl", name: "Chlorine", mass: 35.453, category: "halogen", group: 17, period: 3, electronegativity: 3.16, oxidationStates: "-1, +7" },
  { number: 18, symbol: "Ar", name: "Argon", mass: 39.948, category: "noble-gas", group: 18, period: 3, electronegativity: 0, oxidationStates: "0" },
  { number: 19, symbol: "K", name: "Potassium", mass: 39.098, category: "alkali-metal", group: 1, period: 4, electronegativity: 0.82, oxidationStates: "+1" },
  { number: 20, symbol: "Ca", name: "Calcium", mass: 40.078, category: "alkaline-earth", group: 2, period: 4, electronegativity: 1.00, oxidationStates: "+2" },
  { number: 21, symbol: "Sc", name: "Scandium", mass: 44.956, category: "transition", group: 3, period: 4, electronegativity: 1.36, oxidationStates: "+3" },
  { number: 22, symbol: "Ti", name: "Titanium", mass: 47.867, category: "transition", group: 4, period: 4, electronegativity: 1.54, oxidationStates: "+4" },
  { number: 23, symbol: "V", name: "Vanadium", mass: 50.942, category: "transition", group: 5, period: 4, electronegativity: 1.63, oxidationStates: "+5" },
  { number: 24, symbol: "Cr", name: "Chromium", mass: 51.996, category: "transition", group: 6, period: 4, electronegativity: 1.66, oxidationStates: "+3, +6" },
  { number: 25, symbol: "Mn", name: "Manganese", mass: 54.938, category: "transition", group: 7, period: 4, electronegativity: 1.55, oxidationStates: "+2, +7" },
  { number: 26, symbol: "Fe", name: "Iron", mass: 55.845, category: "transition", group: 8, period: 4, electronegativity: 1.83, oxidationStates: "+2, +3" },
  { number: 27, symbol: "Co", name: "Cobalt", mass: 58.933, category: "transition", group: 9, period: 4, electronegativity: 1.88, oxidationStates: "+2, +3" },
  { number: 28, symbol: "Ni", name: "Nickel", mass: 58.693, category: "transition", group: 10, period: 4, electronegativity: 1.91, oxidationStates: "+2" },
  { number: 29, symbol: "Cu", name: "Copper", mass: 63.546, category: "transition", group: 11, period: 4, electronegativity: 1.90, oxidationStates: "+1, +2" },
  { number: 30, symbol: "Zn", name: "Zinc", mass: 65.380, category: "transition", group: 12, period: 4, electronegativity: 1.65, oxidationStates: "+2" },
  { number: 31, symbol: "Ga", name: "Gallium", mass: 69.723, category: "post-transition", group: 13, period: 4, electronegativity: 1.81, oxidationStates: "+3" },
  { number: 32, symbol: "Ge", name: "Germanium", mass: 72.630, category: "metalloid", group: 14, period: 4, electronegativity: 2.01, oxidationStates: "+4" },
  { number: 33, symbol: "As", name: "Arsenic", mass: 74.922, category: "metalloid", group: 15, period: 4, electronegativity: 2.18, oxidationStates: "+5, -3" },
  { number: 34, symbol: "Se", name: "Selenium", mass: 78.971, category: "nonmetal", group: 16, period: 4, electronegativity: 2.55, oxidationStates: "-2, +6" },
  { number: 35, symbol: "Br", name: "Bromine", mass: 79.904, category: "halogen", group: 17, period: 4, electronegativity: 2.96, oxidationStates: "-1, +5" },
  { number: 36, symbol: "Kr", name: "Krypton", mass: 83.798, category: "noble-gas", group: 18, period: 4, electronegativity: 3.00, oxidationStates: "0" },
  { number: 37, symbol: "Rb", name: "Rubidium", mass: 85.468, category: "alkali-metal", group: 1, period: 5, electronegativity: 0.82, oxidationStates: "+1" },
  { number: 38, symbol: "Sr", name: "Strontium", mass: 87.620, category: "alkaline-earth", group: 2, period: 5, electronegativity: 0.95, oxidationStates: "+2" },
  { number: 47, symbol: "Ag", name: "Silver", mass: 107.868, category: "transition", group: 11, period: 5, electronegativity: 1.93, oxidationStates: "+1" },
  { number: 48, symbol: "Cd", name: "Cadmium", mass: 112.414, category: "transition", group: 12, period: 5, electronegativity: 1.69, oxidationStates: "+2" },
  { number: 50, symbol: "Sn", name: "Tin", mass: 118.710, category: "post-transition", group: 14, period: 5, electronegativity: 1.96, oxidationStates: "+2, +4" },
  { number: 53, symbol: "I", name: "Iodine", mass: 126.904, category: "halogen", group: 17, period: 5, electronegativity: 2.66, oxidationStates: "-1, +7" },
  { number: 55, symbol: "Cs", name: "Cesium", mass: 132.905, category: "alkali-metal", group: 1, period: 6, electronegativity: 0.79, oxidationStates: "+1" },
  { number: 56, symbol: "Ba", name: "Barium", mass: 137.327, category: "alkaline-earth", group: 2, period: 6, electronegativity: 0.89, oxidationStates: "+2" },
  { number: 79, symbol: "Au", name: "Gold", mass: 196.967, category: "transition", group: 11, period: 6, electronegativity: 2.54, oxidationStates: "+1, +3" },
  { number: 80, symbol: "Hg", name: "Mercury", mass: 200.592, category: "transition", group: 12, period: 6, electronegativity: 2.00, oxidationStates: "+1, +2" },
  { number: 82, symbol: "Pb", name: "Lead", mass: 207.200, category: "post-transition", group: 14, period: 6, electronegativity: 2.33, oxidationStates: "+2, +4" },
];

// Category colors
const categoryColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  "alkali-metal": { bg: "bg-red-500/30", text: "text-red-300", border: "border-red-500/40", label: "Alkali Metal" },
  "alkaline-earth": { bg: "bg-orange-500/30", text: "text-orange-300", border: "border-orange-500/40", label: "Alkaline Earth" },
  "transition": { bg: "bg-yellow-500/30", text: "text-yellow-300", border: "border-yellow-500/40", label: "Transition Metal" },
  "post-transition": { bg: "bg-green-500/30", text: "text-green-300", border: "border-green-500/40", label: "Post-Transition" },
  "metalloid": { bg: "bg-teal-500/30", text: "text-teal-300", border: "border-teal-500/40", label: "Metalloid" },
  "nonmetal": { bg: "bg-cyan-500/30", text: "text-cyan-300", border: "border-cyan-500/40", label: "Nonmetal" },
  "halogen": { bg: "bg-purple-500/30", text: "text-purple-300", border: "border-purple-500/40", label: "Halogen" },
  "noble-gas": { bg: "bg-pink-500/30", text: "text-pink-300", border: "border-pink-500/40", label: "Noble Gas" },
  "lanthanide": { bg: "bg-amber-500/30", text: "text-amber-300", border: "border-amber-500/40", label: "Lanthanide" },
  "actinide": { bg: "bg-rose-500/30", text: "text-rose-300", border: "border-rose-500/40", label: "Actinide" },
};

export function PeriodicTable() {
  const [search, setSearch] = useState("");
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search && !activeCategory) return ELEMENTS;
    return ELEMENTS.filter((e) => {
      const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.symbol.toLowerCase().includes(search.toLowerCase()) ||
        String(e.number).includes(search);
      const matchesCategory = !activeCategory || e.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const selectedCategoryInfo = selectedElement ? categoryColors[selectedElement.category] : null;

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="border-b border-slate-700/50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Atom className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Periodic Table</h2>
          <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-200">
            {filtered.length} elements
          </Badge>
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search elements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-700 bg-slate-800 pl-8 text-sm text-white placeholder:text-slate-500 h-8"
          />
        </div>
        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(categoryColors).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(activeCategory === key ? null : key)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-medium transition-all",
                activeCategory === key
                  ? `${val.bg} ${val.text} ring-1 ${val.border}`
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
              )}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* Mini periodic table grid */}
          <div className="grid grid-cols-9 gap-[3px] mb-4">
            {ELEMENTS.map((el) => {
              const colors = categoryColors[el.category];
              const isSelected = selectedElement?.number === el.number;
              const isFiltered = filtered.some((f) => f.number === el.number);
              return (
                <button
                  key={el.number}
                  onClick={() => setSelectedElement(isSelected ? null : el)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded p-0.5 transition-all",
                    "min-h-[32px] min-w-[32px]",
                    isSelected
                      ? "ring-2 ring-white bg-slate-700 scale-110 z-10"
                      : isFiltered
                        ? `${colors?.bg || "bg-slate-700/50"} hover:scale-105 cursor-pointer`
                        : "bg-slate-800/30 opacity-30 cursor-default"
                  )}
                  title={el.name}
                >
                  <span className="text-[7px] text-slate-400 leading-none">{el.number}</span>
                  <span className={cn("text-xs font-bold leading-none", isSelected ? "text-white" : colors?.text || "text-slate-300")}>
                    {el.symbol}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Element detail card */}
          {selectedElement && selectedCategoryInfo && (
            <div className={cn(
              "rounded-lg border p-4 animate-[fade-in-up_0.3s_ease-out]",
              selectedCategoryInfo.border,
              selectedCategoryInfo.bg.replace("/30", "/15")
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{selectedElement.symbol}</span>
                    <span className="text-lg font-bold text-slate-300">{selectedElement.name}</span>
                  </div>
                  <Badge className={cn("mt-1", selectedCategoryInfo.bg, selectedCategoryInfo.text, selectedCategoryInfo.border)}>
                    {selectedCategoryInfo.label}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-slate-500">#{selectedElement.number}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-slate-800/60 p-2">
                  <div className="text-[9px] text-slate-500 uppercase">Atomic Mass</div>
                  <div className="text-sm font-bold text-cyan-300">{selectedElement.mass} u</div>
                </div>
                <div className="rounded-md bg-slate-800/60 p-2">
                  <div className="text-[9px] text-slate-500 uppercase">Electronegativity</div>
                  <div className="text-sm font-bold text-emerald-300">{selectedElement.electronegativity || "N/A"}</div>
                </div>
                <div className="rounded-md bg-slate-800/60 p-2">
                  <div className="text-[9px] text-slate-500 uppercase">Oxidation States</div>
                  <div className="text-sm font-bold text-amber-300">{selectedElement.oxidationStates || "N/A"}</div>
                </div>
                <div className="rounded-md bg-slate-800/60 p-2">
                  <div className="text-[9px] text-slate-500 uppercase">Period / Group</div>
                  <div className="text-sm font-bold text-purple-300">{selectedElement.period} / {selectedElement.group || "—"}</div>
                </div>
              </div>
            </div>
          )}

          {!selectedElement && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Atom className="mb-2 h-10 w-10 text-slate-600" />
              <p className="text-sm text-slate-400">Click an element to see details</p>
              <p className="text-xs text-slate-500 mt-1">Search by name, symbol, or atomic number</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
