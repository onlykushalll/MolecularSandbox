"use client";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  Loader2,
  FlaskConical,
  Lightbulb,
} from "lucide-react";
import { useLabStore } from "@/lib/store/lab-store";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const suggestedPrompts = [
  "What reaction happens when I mix HCl and NaOH?",
  "Why is the golden rain reaction yellow?",
  "Which chemicals produce hydrogen gas?",
  "Explain limiting reagents",
  "What's the most exothermic reaction available?",
  "How do I make oxygen gas?",
];

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const containers = useLabStore((s) => s.containers);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const lastReactionResult = useLabStore((s) => s.lastReactionResult);

  // Build lab context for the AI
  const buildLabContext = () => {
    const activeBeakers = containers.filter(
      (c) => c.contents.length > 0 || c.temperature !== 25
    );
    if (activeBeakers.length === 0 && !lastReactionResult) return undefined;
    const beakerDesc = activeBeakers
      .map((c) => {
        const contents = c.contents
          .map((cc) => {
            const chem = chemicalsMap.get(cc.chemicalId);
            return `${chem?.name} (${cc.volume.toFixed(0)}mL, ${cc.moles.toFixed(3)}mol)`;
          })
          .join(", ");
        return `${c.id}: [${contents}] at ${c.temperature.toFixed(1)}°C${
          c.isHeating ? " (heating)" : ""
        }`;
      })
      .join("; ");
    let ctx = `Beakers: ${beakerDesc}`;
    if (lastReactionResult) {
      ctx += `. Last reaction: ${lastReactionResult.reaction.equation} (ΔT=${lastReactionResult.temperatureChange.toFixed(1)}°C)`;
    }
    return ctx;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          labContext: buildLabContext(),
        }),
      });
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      const aiMsg: Message = {
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: Message = {
        role: "assistant",
        content:
          "Sorry, I couldn't process that right now. Please check that the AI service is available.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <Card className="flex h-full flex-col border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-700/50 p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-5 w-5 text-cyan-400" />
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Dr. Beaker</h2>
            <p className="text-[10px] text-slate-400">AI Lab Assistant · Online</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={clearChat}
            variant="ghost"
            size="sm"
            className="h-7 text-slate-400 hover:text-white"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="space-y-3 p-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <FlaskConical className="h-6 w-6 text-cyan-400" />
              </div>
              <p className="mb-1 text-sm font-medium text-white">
                Ask Dr. Beaker anything!
              </p>
              <p className="mb-4 text-xs text-slate-400">
                Get explanations, safety tips, and experiment ideas
              </p>
              <div className="w-full space-y-1.5">
                <div className="mb-2 flex items-center gap-1 text-[10px] uppercase text-slate-500">
                  <Lightbulb className="h-3 w-3" />
                  Suggested questions
                </div>
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-left text-xs text-slate-300 transition-all hover:border-cyan-500/50 hover:bg-slate-800"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-xs",
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-100"
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-700">
                    <span className="text-xs font-bold text-white">You</span>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-800 px-3 py-2">
                <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                <span className="text-xs text-slate-400">Dr. Beaker is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-slate-700/50 p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about reactions, safety, concepts..."
            disabled={loading}
            className="border-slate-700 bg-slate-800 text-xs text-white placeholder:text-slate-500"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-9 w-9 flex-shrink-0 bg-cyan-600 hover:bg-cyan-500"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
