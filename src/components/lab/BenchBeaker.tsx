"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  usePlayerStore,
  type Interactable,
} from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { InteractableMesh } from "./InteractableMesh";
import type { ContainerState } from "@/lib/chemistry/types";
import { mixHexColors } from "@/lib/chemistry/mixture";

/**
 * BenchBeaker — realistic glass beaker using LatheGeometry
 *
 * Profile: slightly tapered cylinder (4cm bottom → 4.2cm top), pour spout,
 * 12cm tall, 2mm wall thickness. Proper glass material with transmission.
 *
 * Labels: ONLY show when hovered (not always visible)
 * Effects: bubbles, steam, precipitate, gas (all conditional)
 */

export function BenchBeaker({ container }: { container: ContainerState }) {
  const heldItem = usePlayerStore((s) => s.heldItem);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === `beaker-${container.id}`;

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
    const fill = Math.min(0.85, (totalVolume / container.capacity) * 0.85);
    return { liquidColor: mixed.hex, fillLevel: fill };
  }, [container.contents, container.capacity, chemicalsMap, isBroken]);

  const tempGlow = useMemo(() => {
    if (container.temperature > 60) return "#ff3300";
    if (container.temperature < 10) return "#3399ff";
    return null;
  }, [container.temperature]);

  // === Beaker glass profile (lathe) ===
  const glassGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const H = 0.12; // 12cm tall
    const rBottom = 0.040;
    const rTop = 0.042;
    // Bottom (flat, slight curve up)
    points.push(new THREE.Vector2(0.038, 0));
    points.push(new THREE.Vector2(rBottom, 0.002));
    // Body (slight taper, 20 segments)
    for (let i = 1; i <= 20; i++) {
      const t = i / 20;
      const y = t * H;
      const r = rBottom + (rTop - rBottom) * t;
      points.push(new THREE.Vector2(r, y));
    }
    // Pour spout lip (slight outward flare at one side — simplified as ring)
    points.push(new THREE.Vector2(rTop + 0.003, H + 0.002));
    points.push(new THREE.Vector2(rTop, H + 0.004));
    return new THREE.LatheGeometry(points, 48);
  }, []);

  // === Liquid profile (lathe, matches beaker interior) ===
  const liquidGeometry = useMemo(() => {
    if (fillLevel <= 0) return null;
    const H = 0.12;
    const liquidH = fillLevel * H;
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(0, 0.003));
    points.push(new THREE.Vector2(0.038, 0.003));
    // Match interior taper (slightly smaller than glass)
    const rBottom = 0.038;
    const rTop = 0.040;
    const segments = Math.max(4, Math.floor(fillLevel * 20));
    for (let i = 1; i <= segments; i++) {
      const t = (i / segments) * fillLevel;
      const y = t * H;
      const r = rBottom + (rTop - rBottom) * t;
      points.push(new THREE.Vector2(r, y));
    }
    return new THREE.LatheGeometry(points, 48);
  }, [fillLevel]);

  if (isBroken) {
    return (
      <group position={container.position}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.04, 16]} />
          <meshPhysicalMaterial
            color="#e0f2f1"
            transparent
            opacity={0.4}
            roughness={0.05}
            transmission={0.8}
            ior={1.5}
          />
        </mesh>
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
        {/* === Glass beaker (lathe) === */}
        <mesh geometry={glassGeometry} castShadow>
          <meshPhysicalMaterial
            color="#e8f5f4"
            transparent
            opacity={0.22}
            roughness={0.02}
            metalness={0}
            transmission={0.92}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.02}
            thickness={0.005}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* === Liquid (lathe) === */}
        {liquidGeometry && fillLevel > 0 && (
          <mesh geometry={liquidGeometry}>
            <meshStandardMaterial
              color={liquidColor}
              transparent
              opacity={0.75}
              roughness={0.12}
              metalness={0}
              emissive={tempGlow || liquidColor}
              emissiveIntensity={tempGlow ? 0.15 : 0.02}
            />
          </mesh>
        )}

        {/* Temperature glow when hot */}
        {tempGlow && fillLevel > 0 && (
          <pointLight
            position={[0, 0.06, 0]}
            color={tempGlow}
            intensity={container.temperature > 60 ? 0.5 : 0.2}
            distance={0.5}
          />
        )}

        {/* === Bubbles when heating/hot === */}
        {fillLevel > 0.05 && (container.isHeating || container.temperature > 50) && (
          <Bubbles
            count={Math.min(12, Math.floor(container.temperature / 12))}
            radius={0.035}
            baseY={0.01}
            topY={fillLevel * 0.12}
          />
        )}

        {/* === Steam when temp > 70°C === */}
        {container.temperature > 70 && fillLevel > 0.05 && (
          <SteamCloud
            intensity={Math.min(1, (container.temperature - 70) / 30)}
            radius={0.025}
            topY={0.12}
          />
        )}

        {/* === Precipitate === */}
        {container.precipitate && container.precipitate.length > 0 && fillLevel > 0.05 && (
          <Precipitate
            count={Math.min(30, container.precipitate.reduce((s, p) => s + p.moles * 20, 0) | 0)}
            color={container.precipitate[0]?.color || "#dddddd"}
            radius={0.035}
            baseY={0.02}
          />
        )}

        {/* === Gas emission === */}
        {container.gasEmitting && fillLevel > 0.05 && (
          <GasEmission color={container.gasEmitting.color || "#cccccc"} />
        )}

        {/* === Selection ring (only when selected) === */}
        {isSelected && (
          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.05, 0.055, 32]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* === Label (ONLY when hovered or selected) === */}
        {(isHovered || isSelected) && (
          <Html
            position={[0, 0.16, 0]}
            center
            distanceFactor={3}
            occlude
            zIndexRange={[10, 0]}
          >
            <div
              className={`pointer-events-none select-none whitespace-nowrap rounded-md border px-2.5 py-1.5 backdrop-blur-md shadow-xl ${
                isSelected
                  ? "border-emerald-500/60 bg-emerald-950/90"
                  : "border-slate-600/50 bg-slate-950/90"
              }`}
            >
              <div className={`text-[11px] font-bold ${
                isSelected ? "text-emerald-300" : "text-slate-200"
              }`}>
                {container.id.toUpperCase()}
              </div>
              <div className="font-mono text-[9px] text-slate-400">
                {container.temperature.toFixed(0)}°C
                {container.contents.length > 0 && ` · ${container.contents.length} items`}
              </div>
              {(isHovered && heldItem?.type === "chemical") && (
                <div className="mt-0.5 text-[8px] text-cyan-400">[E] to pour</div>
              )}
            </div>
          </Html>
        )}
      </group>
    </InteractableMesh>
  );
}

// === Bubbles ===
function Bubbles({ count, radius, baseY, topY }: { count: number; radius: number; baseY: number; topY: number }) {
  const ref = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: (Math.random() - 0.5) * radius * 1.6,
      z: (Math.random() - 0.5) * radius * 1.6,
      startY: baseY + Math.random() * 0.02,
      speed: 0.3 + Math.random() * 0.5,
      size: 0.006 + Math.random() * 0.01,
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

// === SteamCloud ===
function SteamCloud({ intensity, radius, topY }: { intensity: number; radius: number; topY: number }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return Array.from({ length: 8 }).map(() => ({
      x: (Math.random() - 0.5) * radius,
      z: (Math.random() - 0.5) * radius,
      speed: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      size: 0.015 + Math.random() * 0.02,
    }));
  }, [radius]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const data = particles[i];
      if (!data) return;
      const cycle = (t * data.speed + data.phase) % 1;
      (child as THREE.Mesh).position.y = topY + cycle * 0.15;
      (child as THREE.Mesh).position.x = data.x + Math.sin(t * 2 + data.phase) * 0.01;
      (child as THREE.Mesh).position.z = data.z + Math.cos(t * 2 + data.phase) * 0.01;
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

// === Precipitate ===
function Precipitate({ count, color, radius, baseY }: { count: number; color: string; radius: number; baseY: number }) {
  const positions = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: (Math.random() - 0.5) * radius * 1.6,
      z: (Math.random() - 0.5) * radius * 1.6,
      y: baseY + Math.random() * 0.01,
      size: 0.008 + Math.random() * 0.012,
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

// === GasEmission ===
function GasEmission({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      x: (Math.random() - 0.5) * 0.05,
      z: (Math.random() - 0.5) * 0.05,
      speed: 0.15 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      size: 0.012 + Math.random() * 0.015,
    }));
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const data = particles[i];
      if (!data) return;
      const cycle = (t * data.speed + data.phase) % 1;
      (child as THREE.Mesh).position.y = 0.12 + cycle * 0.2;
      (child as THREE.Mesh).position.x = data.x + Math.sin(t + data.phase) * 0.02 * cycle;
      (child as THREE.Mesh).position.z = data.z + Math.cos(t + data.phase) * 0.02 * cycle;
      (child as THREE.Mesh).scale.setScalar((1 - cycle) * data.size * 1.5);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - cycle) * 0.4;
    });
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, 0.12, p.z]}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
