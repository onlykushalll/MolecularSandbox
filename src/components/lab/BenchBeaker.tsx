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

        {/* === Bubbles when heating or hot === */}
        {fillLevel > 0.05 && (container.isHeating || container.temperature > 50) && (
          <Bubbles
            count={Math.min(12, Math.floor(container.temperature / 12))}
            radius={beakerRadius * 0.7}
            baseY={0.01}
            topY={fillLevel * beakerHeight}
          />
        )}

        {/* === Steam when temp > 70°C === */}
        {container.temperature > 70 && fillLevel > 0.05 && (
          <SteamCloud
            intensity={Math.min(1, (container.temperature - 70) / 30)}
            radius={beakerRadius * 0.5}
            topY={beakerHeight}
          />
        )}

        {/* === Precipitate particles (if any) === */}
        {container.precipitate && container.precipitate.length > 0 && fillLevel > 0.05 && (
          <Precipitate
            count={Math.min(30, container.precipitate.reduce((s, p) => s + p.moles * 20, 0) | 0)}
            color={container.precipitate[0]?.color || "#dddddd"}
            radius={beakerRadius * 0.8}
            baseY={0.02}
          />
        )}

        {/* === Gas emission (if gasEmitting) === */}
        {container.gasEmitting && fillLevel > 0.05 && (
          <GasEmission color={container.gasEmitting.color || "#cccccc"} />
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

// === Bubbles sub-component ===
function Bubbles({ count, radius, baseY, topY }: { count: number; radius: number; baseY: number; topY: number }) {
  const ref = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: (Math.random() - 0.5) * radius * 1.6,
      z: (Math.random() - 0.5) * radius * 1.6,
      startY: baseY + Math.random() * 0.02,
      speed: 0.3 + Math.random() * 0.5,
      size: 0.008 + Math.random() * 0.015,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, radius, baseY]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const data = positions[i];
      if (!data) return;
      const cycle = (t * data.speed + data.phase) % 1;
      (child as THREE.Mesh).position.y = data.startY + cycle * (topY - baseY);
      (child as THREE.Mesh).scale.setScalar(cycle < 0.1 ? cycle * 10 : 1);
    });
  });

  return (
    <group ref={ref}>
      {positions.map((b, i) => (
        <mesh key={i} position={[b.x, b.startY, b.z]}>
          <sphereGeometry args={[b.size, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0} />
        </mesh>
      ))}
    </group>
  );
}

// === SteamCloud sub-component ===
function SteamCloud({ intensity, radius, topY }: { intensity: number; radius: number; topY: number }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return Array.from({ length: 8 }).map(() => ({
      x: (Math.random() - 0.5) * radius,
      z: (Math.random() - 0.5) * radius,
      speed: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      size: 0.03 + Math.random() * 0.04,
    }));
  }, [radius]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const data = particles[i];
      if (!data) return;
      const cycle = (t * data.speed + data.phase) % 1;
      (child as THREE.Mesh).position.y = topY + cycle * 0.3;
      (child as THREE.Mesh).position.x = data.x + Math.sin(t * 2 + data.phase) * 0.02;
      (child as THREE.Mesh).position.z = data.z + Math.cos(t * 2 + data.phase) * 0.02;
      (child as THREE.Mesh).scale.setScalar((1 - cycle) * data.size * 2);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - cycle) * 0.3 * intensity;
    });
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, topY, p.z]}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// === Precipitate sub-component ===
function Precipitate({ count, color, radius, baseY }: { count: number; color: string; radius: number; baseY: number }) {
  const positions = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: (Math.random() - 0.5) * radius * 1.6,
      z: (Math.random() - 0.5) * radius * 1.6,
      y: baseY + Math.random() * 0.01,
      size: 0.01 + Math.random() * 0.015,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
    }));
  }, [count, radius, baseY]);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} rotation={p.rotation}>
          <dodecahedronGeometry args={[p.size, 0]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// === GasEmission sub-component ===
function GasEmission({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      x: (Math.random() - 0.5) * 0.1,
      z: (Math.random() - 0.5) * 0.1,
      speed: 0.15 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      size: 0.02 + Math.random() * 0.03,
    }));
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const data = particles[i];
      if (!data) return;
      const cycle = (t * data.speed + data.phase) % 1;
      (child as THREE.Mesh).position.y = 0.35 + cycle * 0.4;
      (child as THREE.Mesh).position.x = data.x + Math.sin(t + data.phase) * 0.03 * cycle;
      (child as THREE.Mesh).position.z = data.z + Math.cos(t + data.phase) * 0.03 * cycle;
      (child as THREE.Mesh).scale.setScalar((1 - cycle) * data.size * 1.5);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - cycle) * 0.4;
    });
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, 0.35, p.z]}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
