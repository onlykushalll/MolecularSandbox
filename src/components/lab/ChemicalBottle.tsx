"use client";

import { useRef } from "react";
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
 * ChemicalBottle — a realistic lab reagent bottle on the shelf
 *
 * Renders a glass bottle with colored liquid inside, a label, and a cap.
 * Interactable: look + E to pick up.
 *
 * Bottle shape: cylindrical body with narrow neck + cap.
 * Liquid color comes from the chemical's hexColor.
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
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
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

  // Don't render if this bottle is currently held
  if (isHeld) return null;

  // Liquid fill level based on owned volume (0-100mL → 0.2-0.9 fill)
  const fillLevel = Math.min(0.9, 0.2 + (ownedVolume / 100) * 0.7);

  return (
    <InteractableMesh
      interactable={interactable}
      highlightColor="#f59e0b"
    >
      <group position={position}>
        {/* Bottle body (glass) */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.065, 0.16, 16]} />
          <meshPhysicalMaterial
            color={colors.glass}
            transparent
            opacity={0.35}
            roughness={0.05}
            transmission={0.7}
            ior={1.45}
            clearcoat={1}
            thickness={0.02}
          />
        </mesh>

        {/* Liquid inside */}
        <mesh position={[0, 0.08 - 0.08 + fillLevel * 0.08, 0]}>
          <cylinderGeometry args={[0.055, 0.06, fillLevel * 0.15, 16]} />
          <meshStandardMaterial
            color={chemical.hexColor}
            transparent
            opacity={0.75}
            roughness={0.2}
            emissive={chemical.hexColor}
            emissiveIntensity={0.05}
          />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.035, 0.04, 12]} />
          <meshPhysicalMaterial
            color={colors.glass}
            transparent
            opacity={0.35}
            roughness={0.05}
            transmission={0.7}
            ior={1.45}
          />
        </mesh>

        {/* Cap */}
        <mesh position={[0, 0.235, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.03, 12]} />
          <meshStandardMaterial
            color={colors.cap}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>

        {/* Label */}
        <mesh position={[0, 0.09, 0.061]}>
          <planeGeometry args={[0.08, 0.06]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.8} />
        </mesh>

        {/* Label text */}
        <Html
          position={[0, 0.09, 0.063]}
          transform
          distanceFactor={1.5}
          occlude
        >
          <div
            className="flex flex-col items-center justify-center bg-beige text-center"
            style={{
              width: "40px",
              height: "30px",
              background: "#f5f5dc",
              fontSize: "5px",
              lineHeight: "6px",
              color: "#1a1a1a",
              fontFamily: "monospace",
              padding: "1px",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "5px" }}>
              {chemical.formula}
            </div>
            <div style={{ fontSize: "3px", color: "#555" }}>
              {chemical.name.length > 12
                ? chemical.name.substring(0, 10) + ".."
                : chemical.name}
            </div>
          </div>
        </Html>
      </group>
    </InteractableMesh>
  );
}
