"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Edges } from "@react-three/drei";
import * as THREE from "three";
import {
  usePlayerStore,
  type Interactable,
} from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { InteractableMesh } from "./InteractableMesh";
import type { ContainerState, ChemicalData } from "@/lib/chemistry/types";
import { mixHexColors, calculatePH } from "@/lib/chemistry/mixture";

/**
 * BenchBeaker — a glass beaker sitting on the lab bench
 *
 * Renders:
 * - Glass beaker (cylinder with transparent walls)
 * - Liquid inside (colored by mixing chemical hexColors, fill level by volume)
 * - Temperature indicator (glows red when hot)
 * - Selection ring when selected
 *
 * Interactable:
 * - If holding a bottle → pour into this beaker
 * - If not holding anything → select this beaker (for reactions/heating)
 */

export function BenchBeaker({ container }: { container: ContainerState }) {
  const heldItem = usePlayerStore((s) => s.heldItem);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);

  const isSelected = selectedContainerId === container.id;
  const isBroken = container.isBroken;

  const interactable: Interactable = {
    id: `beaker-${container.id}`,
    kind: "beaker",
    label: `Beaker (${container.id})`,
    position: container.position,
    containerId: container.id,
    action: heldItem?.type === "chemical"
      ? `Pour into ${container.id}`
      : `Select ${container.id}`,
  };

  // === Compute liquid color + fill level ===
  const { liquidColor, fillLevel } = useMemo(() => {
    if (container.contents.length === 0 || isBroken) {
      return { liquidColor: "#ffffff", fillLevel: 0 };
    }
    const colors: { hex: string; moles: number }[] = [];
    let totalVolume = 0;
    for (const cc of container.contents) {
      const chem = chemicalsMap.get(cc.chemicalId);
      if (chem) {
        colors.push({ hex: chem.hexColor, moles: cc.moles });
        totalVolume += cc.volume;
      }
    }
    const mixed = mixHexColors(colors);
    // Fill level: 0-250mL maps to 0.05-0.85 of beaker height
    const fill = Math.min(0.85, (totalVolume / container.capacity) * 0.85);
    return { liquidColor: mixed.hex, fillLevel: fill };
  }, [container.contents, container.capacity, chemicalsMap, isBroken]);

  // Temperature color (blue cold → red hot)
  const tempGlow = useMemo(() => {
    if (container.temperature > 60) return "#ff3300";
    if (container.temperature < 10) return "#3399ff";
    return null;
  }, [container.temperature]);

  const beakerRadius = 0.18;
  const beakerHeight = 0.35;

  if (isBroken) {
    return (
      <group position={container.position}>
        {/* Broken beaker stump */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[beakerRadius, beakerRadius, 0.04, 16]} />
          <meshPhysicalMaterial
            color="#e0f2f1"
            transparent
            opacity={0.4}
            roughness={0.05}
            transmission={0.8}
            ior={1.5}
          />
        </mesh>
        {/* Shards */}
        {[...Array(6)].map((_, i) => (
          <mesh
            key={i}
            position={[
              (Math.random() - 0.5) * 0.3,
              0.005,
              (Math.random() - 0.5) * 0.3,
            ]}
            rotation={[Math.random(), Math.random(), Math.random()]}
          >
            <tetrahedronGeometry args={[0.03]} />
            <meshPhysicalMaterial
              color="#e0f2f1"
              transparent
              opacity={0.5}
              roughness={0.05}
              transmission={0.8}
            />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <InteractableMesh
      interactable={interactable}
      highlightColor={heldItem?.type === "chemical" ? "#22d3ee" : "#34d399"}
    >
      <group position={container.position}>
        {/* === Beaker glass === */}
        <mesh position={[0, beakerHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[beakerRadius, beakerRadius * 0.95, beakerHeight, 24, 1, true]} />
          <meshPhysicalMaterial
            color="#e8f5f4"
            transparent
            opacity={0.25}
            roughness={0.02}
            transmission={0.9}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.02}
            thickness={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Beaker bottom */}
        <mesh position={[0, 0.005, 0]}>
          <cylinderGeometry args={[beakerRadius * 0.95, beakerRadius * 0.95, 0.01, 24]} />
          <meshPhysicalMaterial
            color="#e8f5f4"
            transparent
            opacity={0.3}
            roughness={0.02}
            transmission={0.85}
            ior={1.5}
          />
        </mesh>

        {/* Beaker rim (spout) */}
        <mesh position={[0, beakerHeight, 0]}>
          <torusGeometry args={[beakerRadius, 0.008, 8, 24]} />
          <meshPhysicalMaterial
            color="#e8f5f4"
            transparent
            opacity={0.3}
            roughness={0.02}
            transmission={0.85}
            ior={1.5}
          />
        </mesh>

        {/* === Liquid === */}
        {fillLevel > 0 && (
          <mesh position={[0, fillLevel * beakerHeight / 2, 0]}>
            <cylinderGeometry args={[beakerRadius * 0.93, beakerRadius * 0.9, fillLevel * beakerHeight, 24]} />
            <meshStandardMaterial
              color={liquidColor}
              transparent
              opacity={0.75}
              roughness={0.15}
              metalness={0}
              emissive={tempGlow || liquidColor}
              emissiveIntensity={tempGlow ? 0.15 : 0.02}
            />
          </mesh>
        )}

        {/* Temperature glow when hot */}
        {tempGlow && fillLevel > 0 && (
          <pointLight
            position={[0, beakerHeight / 2, 0]}
            color={tempGlow}
            intensity={container.temperature > 60 ? 0.5 : 0.2}
            distance={0.5}
          />
        )}

        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[beakerRadius + 0.03, beakerRadius + 0.05, 32]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* === Beaker label (floating) === */}
        <Html
          position={[0, beakerHeight + 0.1, 0]}
          center
          distanceFactor={4}
          occlude
        >
          <div
            className={`pointer-events-none select-none whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
              isSelected
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50"
                : "bg-slate-950/70 text-slate-300 border border-slate-700/50"
            }`}
          >
            {container.id.toUpperCase()} · {container.temperature.toFixed(0)}°C
            {container.contents.length > 0 && ` · ${container.contents.length} items`}
          </div>
        </Html>
      </group>
    </InteractableMesh>
  );
}
