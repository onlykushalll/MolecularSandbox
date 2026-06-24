"use client";

import { useState, useMemo } from "react";
import { usePlayerStore, DELIVERY } from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Search, ShoppingCart, Package, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ChemicalData, ChemicalCategory } from "@/lib/chemistry/types";

// Load prices from the JSON file
import pricesData from "@/data/chemical-prices.json";

const priceMap: Record<string, { priceINR: number; unit: string }> = {};
for (const c of (pricesData as any).chemicals) {
  priceMap[c.name] = { priceINR: c.priceINR, unit: c.unit };
}

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

const categoryColors: Record<ChemicalCategory, string> = {
  acid: "bg-red-500/20 text-red-300 border-red-500/40",
  base: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  salt: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  organic: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  reagent: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  solvent: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  metal: "bg-gray-500/20 text-gray-300 border-gray-500/40",
  gas: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  oxidizer: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  indicator: "bg-pink-500/20 text-pink-300 border-pink-500/40",
};

export function OrderingTerminalUI() {
  const isOpen = usePlayerStore((s) => s.isOrderingTerminalOpen);
  const closeOrderingTerminal = usePlayerStore((s) => s.closeOrderingTerminal);
  const budget = usePlayerStore((s) => s.budgetINR);
  const orders = usePlayerStore((s) => s.orders);
  const placeOrder = usePlayerStore((s) => s.placeOrder);
  const chemicals = useLabStore((s) => s.chemicals);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cart, setCart] = useState<{ chemical: ChemicalData; quantity: number }[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    return chemicals.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.formula.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [chemicals, search, categoryFilter]);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const cartTotal = cart.reduce((s, item) => {
    const p = priceMap[item.chemical.name]?.priceINR || 50;
    return s + p * (item.chemical.stateAtSTP === "solid" ? 1 : 1); // 1 unit per order
  }, 0);

  if (!isOpen) return null;

  const handleAddToCart = (chem: ChemicalData) => {
    const qty = quantities[chem.id] || 1;
    setCart((prev) => {
      const existing = prev.find((c) => c.chemical.id === chem.id);
      if (existing) {
        return prev.map((c) =>
          c.chemical.id === chem.id ? { ...c, quantity: c.quantity + qty } : c
        );
      }
      return [...prev, { chemical: chem, quantity: qty }];
    });
    toast.success(`Added ${chem.name} to cart`, { description: `${qty} unit(s)` });
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (pendingOrders.length + cart.length > DELIVERY.maxPending) {
      toast.error("Too many pending orders", {
        description: `Max ${DELIVERY.maxPending} pending at once. Wait for deliveries.`,
      });
      return;
    }
    let totalCost = 0;
    let ordered = 0;
    for (const item of cart) {
      const p = priceMap[item.chemical.name]?.priceINR || 50;
      totalCost += p;
      if (totalCost > budget) {
        toast.error("Insufficient budget!", {
          description: `Need ₹${totalCost} but only have ₹${budget}`,
        });
        return;
      }
    }
    // Place all orders
    for (const item of cart) {
      const p = priceMap[item.chemical.name]?.priceINR || 50;
      const ok = placeOrder(item.chemical, item.chemical.stateAtSTP === "solid" ? item.quantity * 100 : item.quantity * 100, p);
      if (ok) ordered++;
    }
    toast.success(`${ordered} order(s) placed!`, {
      description: `Deliveries arrive in 20-45s · ₹${totalCost} deducted`,
      duration: 4000,
    });
    setCart([]);
    setQuantities({});
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
      <div className="relative flex h-[85vh] w-[90vw] max-w-5xl flex-col rounded-2xl border border-cyan-700/50 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600/20 ring-1 ring-cyan-500/40">
              <ShoppingCart className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Chemical Ordering Terminal</h2>
              <p className="text-xs text-slate-400">Browse · Order · Deliver to lab shelf</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5">
              <span className="text-xs text-amber-400">Budget: </span>
              <span className="font-mono font-bold text-amber-300">₹{budget.toLocaleString("en-IN")}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={closeOrderingTerminal} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Catalog */}
          <div className="flex flex-1 flex-col border-r border-slate-700">
            {/* Search + filter */}
            <div className="flex gap-2 border-b border-slate-700 p-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search chemicals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-slate-700 bg-slate-800 pl-8 text-white"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 border-slate-700 bg-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chemical grid */}
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-2 gap-2 p-3 lg:grid-cols-3">
                {filtered.map((chem) => {
                  const price = priceMap[chem.name]?.priceINR ?? 50;
                  const unit = priceMap[chem.name]?.unit ?? "100g";
                  const isFree = price === 0;
                  const inCart = cart.find((c) => c.chemical.id === chem.id);
                  return (
                    <div
                      key={chem.id}
                      className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 transition-all hover:border-cyan-500/40 hover:bg-slate-800"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full border border-white/20"
                          style={{ backgroundColor: chem.hexColor }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-white">{chem.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="font-mono text-slate-300">{chem.formula}</span>
                            <span>·</span>
                            <Badge variant="outline" className={cn("h-4 px-1 text-[8px]", categoryColors[chem.category])}>
                              {categoryLabels[chem.category]}
                            </Badge>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className={cn("text-xs font-bold", isFree ? "text-emerald-400" : "text-amber-300")}>
                              {isFree ? "FREE" : `₹${price}`}
                              {!isFree && <span className="text-[9px] text-slate-500"> /{unit}</span>}
                            </span>
                            {inCart && (
                              <span className="text-[9px] text-cyan-400">×{inCart.quantity}</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(chem)}
                            disabled={isFree}
                            className="mt-2 h-6 w-full bg-cyan-600 text-[10px] hover:bg-cyan-500 disabled:opacity-30"
                          >
                            {isFree ? "Generated" : "Add to Cart"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Cart + Orders */}
          <div className="flex w-72 flex-col">
            {/* Cart */}
            <div className="border-b border-slate-700 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
                <ShoppingCart className="h-3.5 w-3.5 text-cyan-400" />
                Cart ({cart.length})
              </h3>
              <ScrollArea className="h-32">
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-500">Empty</p>
                ) : (
                  <div className="space-y-1">
                    {cart.map((item) => {
                      const p = priceMap[item.chemical.name]?.priceINR || 50;
                      return (
                        <div key={item.chemical.id} className="flex items-center justify-between text-xs">
                          <span className="truncate text-slate-300">{item.chemical.name} ×{item.quantity}</span>
                          <span className="font-mono text-amber-300">₹{p * item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              {cart.length > 0 && (
                <>
                  <div className="mt-2 flex justify-between border-t border-slate-700 pt-2 text-xs">
                    <span className="text-slate-400">Total:</span>
                    <span className="font-mono font-bold text-amber-300">₹{cartTotal}</span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    className="mt-2 w-full bg-emerald-600 text-xs hover:bg-emerald-500"
                    size="sm"
                  >
                    Place Orders · ₹{cartTotal}
                  </Button>
                </>
              )}
            </div>

            {/* Pending orders */}
            <div className="flex-1 overflow-hidden p-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Deliveries ({pendingOrders.length}/{DELIVERY.maxPending} max)
              </h3>
              <ScrollArea className="h-full">
                {pendingOrders.length === 0 ? (
                  <p className="text-xs text-slate-500">No pending deliveries</p>
                ) : (
                  <div className="space-y-2">
                    {pendingOrders.map((order) => {
                      const elapsed = (Date.now() - order.orderedAt) / 1000;
                      const seed = order.id.charCodeAt(order.id.length - 1) % 26;
                      const deliveryTime = 20 + seed;
                      const remaining = Math.max(0, deliveryTime - elapsed);
                      const progress = Math.min(100, (elapsed / deliveryTime) * 100);
                      return (
                        <div key={order.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-200">{order.chemicalName}</span>
                            <Package className="h-3 w-3 text-amber-400" />
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-700">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-[9px] text-slate-500">
                            <span>Arriving in {Math.ceil(remaining)}s</span>
                            <span>₹{order.priceINR}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-700 bg-slate-950/50 p-2 text-center text-[10px] text-slate-500">
          Prices based on real Indian lab supplier rates (Loba Chemie, SRL, IndiaMART) · Deliveries take 20-45s · Max 3 pending
        </div>
      </div>
    </div>
  );
}
