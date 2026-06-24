"use client";

import { useRef, useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  usePlayerStore,
  type Interactable,
} from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { InteractableMesh } from "./InteractableMesh";
import type { ChemicalData } from "@/lib/chemistry/types";

/**
 * ChemicalBottle — realistic reagent bottle using LatheGeometry
 *
 * Profile (side view, bottom→top):
 *   - Wide cylindrical body (6cm dia, 10cm tall)
 *   - Shoulder (curves inward over 1.5cm)
 *   - Narrow neck (2cm dia, 1.5cm tall)
 *   - Cap (2.5cm dia, 1.5cm tall)
 *
 * Glass: meshPhysicalMaterial with transmission, IOR 1.5, clearcoat
 * Liquid: colored, fills body to ~80%
 * Label: paper texture, wraps around body front
 * Label text: ONLY shows when hovered (not always)
 */

const BOTTLE_COLORS: Record<string, { cap: string; glass: string }> = {
  acid: { cap: "#c0392b", glass: "#fde8e8" },
  base: { cap: "#2980b9", glass: "#e8f0fd" },
  salt: { cap: "#8e44ad", glass: "#f3e8fd" },
  organic: { cap: "#e67e22", glass: "#fdf0e6" },
  metal: { cap: "#7f8c8d", glass: "#eceff1" },
  oxidizer: { cap: "#f1c40f", glass: "#fef9e7" },
  reagent: { cap: "#16a085", glass: "#e8f8f5" },
  solvent: { cap: "#00b894", glass: "#e0f7f4" },
  gas: { cap: "#636e72", glass: "#f0f3f5" },
  indicator: { cap: "#fd79a8", glass: "#fdf0f5" },
};

export function ChemicalBottle({
  chemical,
  position,
  index,
}: {
  chemical: ChemicalData;
  position: [number, number, number];
  index: number;
}) {
  const heldItem = usePlayerStore((s) => s.heldItem);
  const isHeld = heldItem?.type === "chemical" && heldItem.chemicalId === chemical.id;
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === `bottle-${chemical.id}`;
  const ownedVolume = usePlayerStore((s) => s.ownedChemicals.get(chemical.id) || 0);

  const interactable: Interactable = {
    id: `bottle-${chemical.id}`,
    kind: "chemical-bottle",
    label: `${chemical.name} (${chemical.formula})`,
    position,
    chemicalId: chemical.id,
    action: isHeld ? "Put down" : `Pick up ${chemical.name}`,
  };

  const colors = BOTTLE_COLORS[chemical.category] || BOTTLE_COLORS.reagent;

  // === Bottle glass profile (lathe) — realistic reagent bottle shape ===
  const bottleGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    // Bottom (flat, slight inset)
    points.push(new THREE.Vector2(0.028, 0));
    points.push(new THREE.Vector2(0.030, 0.001));
    // Body wall going up (straight, 8cm)
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * 0.08;
      points.push(new THREE.Vector2(0.030, y));
    }
    // Shoulder (curves inward — bezier-like)
    for (let i = 1; i <= 6; i++) {
      const t = i / 6;
      const y = 0.08 + t * 0.015;
      // Smooth curve from 0.030 → 0.012 (neck radius)
      const r = 0.030 - (0.030 - 0.012) * (t * t * (3 - 2 * t));
      points.push(new THREE.Vector2(r, y));
    }
    // Neck (straight, 1cm)
    for (let i = 1; i <= 4; i++) {
      const y = 0.095 + (i / 4) * 0.01;
      points.push(new THREE.Vector2(0.012, y));
    }
    // Neck lip (slight flare)
    points.push(new THREE.Vector2(0.013, 0.106));
    points.push(new THREE.Vector2(0.013, 0.108));
    return new THREE.LatheGeometry(points, 32);
  }, []);

  // === Liquid profile (fills body, separate lathe) ===
  const liquidGeometry = useMemo(() => {
    const fillLevel = Math.min(0.85, 0.2 + (ownedVolume / 100) * 0.65);
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(0, 0.002));
    points.push(new THREE.Vector2(0.027, 0.002));
    // Liquid surface
    const liquidHeight = fillLevel * 0.08;
    for (let i = 0; i <= 6; i++) {
      const y = (i / 6) * liquidHeight;
      // Match body taper at top of liquid
      let r = 0.027;
      if (liquidHeight > 0.06) {
        const shoulderT = Math.max(0, (y - 0.06) / 0.02);
        r = 0.027 - (0.027 - 0.011) * (shoulderT * shoulderT * (3 - 2 * shoulderT));
      }
      points.push(new THREE.Vector2(Math.max(0.005, r), y));
    }
    return new THREE.LatheGeometry(points, 32);
  }, [ownedVolume]);

  // === Cap geometry (separate cylinder) ===
  const capY = 0.109;

  if (isHeld) return null;

  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <group position={position}>
        {/* === Glass bottle (lathe) === */}
        <mesh geometry={bottleGeometry} castShadow>
          <meshPhysicalMaterial
            color={colors.glass}
            transparent
            opacity={0.35}
            roughness={0.02}
            metalness={0}
            transmission={0.85}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.02}
            thickness={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* === Liquid inside (lathe, slightly smaller) === */}
        <mesh geometry={liquidGeometry}>
          <meshStandardMaterial
            color={chemical.hexColor}
            transparent
            opacity={0.78}
            roughness={0.15}
            emissive={chemical.hexColor}
            emissiveIntensity={0.04}
          />
        </mesh>

        {/* === Cap (cylinder with rounded top) === */}
        <mesh position={[0, capY + 0.008, 0]} castShadow>
          <cylinderGeometry args={[0.013, 0.013, 0.016, 16]} />
          <meshStandardMaterial
            color={colors.cap}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Cap top (slightly domed) */}
        <mesh position={[0, capY + 0.017, 0]}>
          <sphereGeometry args={[0.013, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
          <meshStandardMaterial color={colors.cap} roughness={0.4} metalness={0.1} />
        </mesh>

        {/* === Label (paper, wraps front of body) === */}
        <mesh position={[0, 0.04, 0.029]}>
          <planeGeometry args={[0.04, 0.035]} />
          <meshStandardMaterial color="#f5f1e8" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* Label border line */}
        <mesh position={[0, 0.04, 0.0291]}>
          <ringGeometry args={[0.019, 0.02, 4]} />
          <meshBasicMaterial color="#8b7355" transparent opacity={0} />
        </mesh>

        {/* === Label text (ONLY when hovered) === */}
        {isHovered && (
          <Html
            position={[0, 0.16, 0]}
            center
            distanceFactor={3}
            occlude
            zIndexRange={[10, 0]}
          >
            <div className="pointer-events-none select-none whitespace-nowrap rounded-md border border-amber-500/50 bg-slate-950/90 px-2.5 py-1.5 backdrop-blur-md shadow-xl">
              <div className="text-[11px] font-bold text-amber-300">
                {chemical.name}
              </div>
              <div className="font-mono text-[9px] text-slate-400">
                {chemical.formula} · M={chemical.molarMass}
              </div>
              <div className="mt-0.5 text-[8px] text-emerald-400">
                {ownedVolume}mL · [E] to pick up
              </div>
            </div>
          </Html>
        )}
      </group>
    </InteractableMesh>
  );
}
