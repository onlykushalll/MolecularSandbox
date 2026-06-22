"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Save,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveSlot {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  containerCount: number;
  totalContents: number;
}

export function SaveLoadPanel() {
  const containers = useLabStore((s) => s.containers);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const initializeLab = useLabStore((s) => s.initializeLab);
  const chemicals = useLabStore((s) => s.chemicals);
  const reactions = useLabStore((s) => s.reactions);

  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function refreshSaves() {
    try {
      const res = await fetch("/api/lab-saves");
      if (res.ok) {
        const data = await res.json();
        setSaves(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSaves();
  }, []);

  async function handleSave() {
    if (!saveName.trim()) {
      toast.error("Enter a name for your save");
      return;
    }
    setSaving(true);
    try {
      // Serialize current containers — include precipitate/gas VFX state
      const serialized = containers.map((c) => ({
        id: c.id,
        type: c.type,
        position: c.position,
        rotation: c.rotation,
        capacity: c.capacity,
        contents: c.contents,
        temperature: c.temperature,
        pressure: c.pressure,
        isHeating: c.isHeating,
        isBroken: c.isBroken,
        precipitate: c.precipitate,
        gasEmitting: c.gasEmitting,
        lastReactionAt: c.lastReactionAt,
      }));
      const res = await fetch("/api/lab-saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName.trim(), containers: serialized }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Lab saved", {
          description: `"${data.name}" · ${data.containerCount} beakers`,
        });
        setSaveName("");
        refreshSaves();
      } else {
        toast.error("Save failed");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLoad(save: SaveSlot) {
    setLoadingId(save.id);
    try {
      const res = await fetch(`/api/lab-saves/${save.id}`);
      if (res.ok) {
        const data = await res.json();
        // Restore containers — reattach chemicalsMap for VFX
        const restored = data.containers.map((c: any) => ({
          ...c,
          // Keep VFX state if present
          precipitate: c.precipitate || null,
          gasEmitting: c.gasEmitting || null,
        }));
        initializeLab(chemicals, reactions, restored);
        toast.success("Lab loaded", {
          description: `"${save.name}" · ${data.containers.length} beakers`,
        });
      } else {
        toast.error("Load failed");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(save: SaveSlot) {
    try {
      const res = await fetch(`/api/lab-saves/${save.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Save deleted", { description: save.name });
        refreshSaves();
      }
    } catch (e) {
      toast.error("Delete failed");
    }
  }

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      containers,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `molecular-sandbox-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported lab state");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.containers || !Array.isArray(data.containers)) {
          toast.error("Invalid file format");
          return;
        }
        initializeLab(chemicals, reactions, data.containers);
        toast.success("Lab imported", {
          description: `${data.containers.length} beakers loaded`,
        });
      } catch {
        toast.error("Failed to parse file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 ring-1 ring-cyan-500/40">
            <Save className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Save / Load Lab</h2>
            <p className="text-[10px] text-slate-400">Persist experiments to database</p>
          </div>
        </div>

        {/* Save current */}
        <div className="flex gap-2">
          <Input
            placeholder="Save name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="border-slate-700 bg-slate-800 text-xs text-white placeholder:text-slate-500"
          />
          <Button
            onClick={handleSave}
            disabled={saving || !saveName.trim()}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          </Button>
        </div>

        {/* Export / Import */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800 text-[11px] text-slate-200 hover:bg-slate-700"
          >
            <Download className="mr-1 h-3 w-3" />
            Export JSON
          </Button>
          <label className="cursor-pointer">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-700 bg-slate-800 text-[11px] text-slate-200 hover:bg-slate-700"
              asChild
            >
              <span>
                <Upload className="mr-1 h-3 w-3" />
                Import JSON
              </span>
            </Button>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : saves.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
              <FolderOpen className="mx-auto mb-2 h-8 w-8 text-slate-600" />
              <p className="text-xs text-slate-500">No saved labs yet</p>
              <p className="mt-1 text-[10px] text-slate-600">Save your current setup above</p>
            </div>
          ) : (
            saves.map((save) => (
              <div
                key={save.id}
                className="group rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 transition-all hover:border-cyan-500/50 hover:bg-slate-800"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-cyan-400" />
                      <span className="truncate text-sm font-semibold text-white">
                        {save.name}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      {new Date(save.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDelete(save)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-slate-500 opacity-0 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mb-2 flex gap-1.5">
                  <Badge variant="secondary" className="bg-slate-700 text-[10px] text-slate-200">
                    {save.containerCount} beakers
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-700 text-[10px] text-slate-200">
                    {save.totalContents} contents
                  </Badge>
                </div>
                <Button
                  onClick={() => handleLoad(save)}
                  disabled={loadingId === save.id}
                  size="sm"
                  className="w-full bg-cyan-600 text-[11px] hover:bg-cyan-500"
                >
                  {loadingId === save.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <FolderOpen className="mr-1 h-3 w-3" />
                  )}
                  Load
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
