"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Tracks a numeric time-series for a given key. Returns the history buffer.
 * Sampled at the configured interval (default 1s), keeping the last N samples.
 * Pass a `resetKey` to clear the buffer when some external dependency changes
 * (e.g. switching beakers).
 */
export function useHistory<T>(
  sampleFn: () => T,
  intervalMs: number = 1000,
  maxSamples: number = 60,
  resetKey?: unknown
): T[] {
  const [history, setHistory] = useState<T[]>([]);
  const sampleRef = useRef(sampleFn);
  useEffect(() => {
    sampleRef.current = sampleFn;
  });

  useEffect(() => {
    // Reset buffer on resetKey change, then start fresh
    setHistory([sampleRef.current()]);
    const id = setInterval(() => {
      setHistory((prev) => {
        const next = [...prev, sampleRef.current()];
        if (next.length > maxSamples) next.shift();
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, maxSamples, resetKey]);

  return history;
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  showAxis?: boolean;
  className?: string;
}

/**
 * Canvas-based sparkline chart for live data.
 */
export function Sparkline({
  data,
  width = 240,
  height = 48,
  color = "#22c55e",
  fillColor,
  min,
  max,
  label,
  unit,
  showAxis = false,
  className,
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) {
      // Not enough data — show placeholder
      ctx.fillStyle = "#475569";
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("collecting data...", width / 2, height / 2);
      return;
    }

    // Determine range
    const dataMin = min ?? Math.min(...data);
    const dataMax = max ?? Math.max(...data);
    const range = Math.max(0.001, dataMax - dataMin);
    const padTop = 6;
    const padBot = showAxis ? 14 : 6;
    const padX = 4;
    const usableH = height - padTop - padBot;
    const usableW = width - padX * 2;

    // Draw axis labels if requested
    if (showAxis) {
      ctx.fillStyle = "#64748b";
      ctx.font = "8px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(dataMax.toFixed(1), padX, padTop + 4);
      ctx.textBaseline = "top";
      ctx.fillText(dataMin.toFixed(1), padX, height - padBot + 2);
      if (unit) {
        ctx.textAlign = "right";
        ctx.fillText(unit, width - padX, height - padBot + 2);
      }
    }

    // Compute points
    const points = data.map((v, i) => {
      const x = padX + (i / Math.max(1, data.length - 1)) * usableW;
      const normalized = (v - dataMin) / range;
      const y = padTop + (1 - normalized) * usableH;
      return [x, y] as [number, number];
    });

    // Fill area under curve
    if (fillColor) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], height - padBot);
      for (const [x, y] of points) ctx.lineTo(x, y);
      ctx.lineTo(points[points.length - 1][0], height - padBot);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Draw last point with glow
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last[0], last[1], 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last[0], last[1], 5, 0, Math.PI * 2);
    ctx.fillStyle = color + "33"; // 20% alpha
    ctx.fill();

    // Label (current value)
    if (label) {
      const lastVal = data[data.length - 1];
      ctx.fillStyle = color;
      ctx.font = "bold 10px ui-monospace, monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(`${label}: ${lastVal.toFixed(2)}${unit || ""}`, width - padX, 2);
    }
  }, [data, width, height, color, fillColor, min, max, label, unit, showAxis]);

  return <canvas ref={canvasRef} className={className} />;
}
