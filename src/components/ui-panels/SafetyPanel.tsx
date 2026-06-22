"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  ShieldCheck,
  Glasses,
  Hand,
  Shirt,
  Wind,
  AlertTriangle,
  Flame,
  Skull,
  X,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import { cn } from "@/lib/utils";

export function SafetyPanel() {
  const ppeWorn = useLabStore((s) => s.ppeWorn);
  const togglePPE = useLabStore((s) => s.togglePPE);
  const safetyAlerts = useLabStore((s) => s.safetyAlerts);
  const dismissSafetyAlert = useLabStore((s) => s.dismissSafetyAlert);

  const ppeItems = [
    { key: "goggles" as const, label: "Goggles", icon: Glasses },
    { key: "gloves" as const, label: "Gloves", icon: Hand },
    { key: "labCoat" as const, label: "Lab Coat", icon: Shirt },
    { key: "mask" as const, label: "Mask", icon: Wind },
  ];

  const alertIcons = {
    thermal: Flame,
    toxic: Skull,
    corrosive: AlertTriangle,
    explosion: AlertTriangle,
    gas: Wind,
  };

  return (
    <Card className="border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="border-b border-slate-700/50 p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Safety & PPE</h2>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* PPE Status */}
        <div>
          <div className="mb-2 text-xs font-medium text-slate-300">
            Personal Protective Equipment
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ppeItems.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => togglePPE(key)}
                variant="outline"
                size="sm"
                className={cn(
                  "h-auto flex-col gap-1 py-2",
                  ppeWorn[key]
                    ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40"
                    : "border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {ppeWorn[key] ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="text-[10px]">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Alerts */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              Active Alerts ({safetyAlerts.length})
            </span>
            {safetyAlerts.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {safetyAlerts.filter((a) => a.severity === "danger").length} danger
              </Badge>
            )}
          </div>
          {safetyAlerts.length === 0 ? (
            <div className="rounded-lg bg-slate-800/50 p-3 text-center">
              <ShieldCheck className="mx-auto mb-1 h-6 w-6 text-emerald-400" />
              <p className="text-xs text-slate-400">All clear. Safe to proceed.</p>
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {safetyAlerts.map((alert, i) => {
                  const Icon = alertIcons[alert.type];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "relative rounded-lg border p-2.5 pr-7",
                        alert.severity === "danger"
                          ? "border-red-500/50 bg-red-950/40"
                          : "border-yellow-500/50 bg-yellow-950/30"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Icon
                          className={cn(
                            "mt-0.5 h-4 w-4 flex-shrink-0",
                            alert.severity === "danger"
                              ? "text-red-400"
                              : "text-yellow-400"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                alert.severity === "danger"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              )}
                            >
                              {alert.type}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-200">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissSafetyAlert(i)}
                        className="absolute right-1 top-1 rounded p-0.5 text-slate-500 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator className="bg-slate-700" />

        {/* GHS Legend */}
        <div>
          <div className="mb-2 text-xs font-medium text-slate-300">
            GHS Hazard Symbols
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {[
              { sym: " corrosive", color: "#7b1fa2" },
              { sym: " toxic", color: "#c62828" },
              { sym: " flammable", color: "#ef6c00" },
              { sym: " oxidizer", color: "#f9a825" },
              { sym: " gas", color: "#1565c0" },
              { sym: " irritant", color: "#757575" },
            ].map(({ sym, color }) => (
              <div
                key={sym}
                className="flex items-center gap-1.5 rounded bg-slate-800/50 p-1.5"
              >
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-400">{sym}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
