"use client";

import { useRef, useMemo, Suspense, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  usePlayerStore,
  type Interactable,
} from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { InteractableMesh } from "./InteractableMesh";
import { mixHexColors } from "@/lib/chemistry/mixture";

// ============================================
// LazyModel — ONLY loads .glb when player is close (prevents crash)
// ============================================
function LazyModel({
  url,
  position,
  rotation = [0, 0, 0] as [number, number, number],
  scale = 1,
  renderDistance = 6,
}: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  renderDistance?: number;
}) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const check = () => {
      const p = usePlayerStore.getState().position;
      const dx = p[0] - position[0];
      const dz = p[2] - position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      setShouldLoad(dist < renderDistance);
    };
    check();
    const interval = setInterval(check, 500);
    return () => clearInterval(interval);
  }, [position, renderDistance]);

  if (!shouldLoad) return null;

  return (
    <Suspense fallback={null}>
      <LoadedModel url={url} position={position} rotation={rotation} scale={scale} />
    </Suspense>
  );
}

function LoadedModel({
  url,
  position,
  rotation,
  scale,
}: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? scale / maxDim : scale;
    clone.position.sub(center.multiplyScalar(s));
    clone.scale.setScalar(s);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, scale]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={cloned} />
    </group>
  );
}

// ============================================
// FUME HOOD — real model
// ============================================
export function RealFumeHood() {
  const interactable: Interactable = {
    id: "fume-hood",
    kind: "fume-hood",
    label: "Fume Hood",
    position: [0, 0, -5],
    action: "Use fume hood (dangerous reactions)",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#ef4444">
      <LazyModel
        url="/models/fume_cupboards.glb"
        position={[0, 0, -5]}
        scale={2.0}
      />
      {/* Interior LED light */}
      <pointLight position={[0, 2.0, -4.8]} intensity={0.3} color="#ffffff" distance={3} />
    </InteractableMesh>
  );
}

// ============================================
// LAB BENCH — real model
// ============================================
export function RealLabBench({ position = [0, 0, 0] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "main-bench",
    kind: "beaker",
    label: "Main Workbench",
    position,
    action: "Work here",
  };

  return (
    <InteractableMesh interactable={interactable}>
      <LazyModel url="/models/lab_bench.glb" position={position} scale={2.5} />
    </InteractableMesh>
  );
}

// ============================================
// BUNSEN BURNER — real model + flame effect
// ============================================
export function RealBunsenBurner({ position = [-1.0, 1.0, 0.3] as [number, number, number] }) {
  const isOn = usePlayerStore((s) => s.bunsenOn);
  const interactable: Interactable = {
    id: "bunsen-burner",
    kind: "bunsen-burner",
    label: "Bunsen Burner",
    position,
    action: isOn ? "Turn off flame" : "Ignite flame",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <LazyModel url="/models/bunsen_burner.glb" position={position} scale={0.5} />
      {isOn && <FlameEffect position={[position[0], position[1] + 0.15, position[2]]} />}
    </InteractableMesh>
  );
}

// ============================================
// BEAKER — real model + liquid inside
// ============================================
export function RealBeaker({ container }: { container: any }) {
  const heldItem = usePlayerStore((s) => s.heldItem);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === `beaker-${container.id}`;
  const isSelected = selectedContainerId === container.id;

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

  // Compute liquid color + fill
  const { liquidColor, fillLevel, totalVolume } = useMemo(() => {
    if (container.contents.length === 0) {
      return { liquidColor: "#ffffff", fillLevel: 0, totalVolume: 0 };
    }
    const colors: { hex: string; moles: number }[] = [];
    let totalVol = 0;
    for (const cc of container.contents) {
      const chem = chemicalsMap.get(cc.chemicalId);
      if (chem) {
        colors.push({ hex: chem.hexColor, moles: cc.moles });
        totalVol += cc.volume;
      }
    }
    const mixed = mixHexColors(colors);
    // If liquid is nearly colorless, add faint blue tint so it's visible
    const liquidColor = mixed.hex === "#ffffff" || mixed.hex === "#88ccff"
      ? "#a8c8e0"  // faint blue tint for clear liquids
      : mixed.hex;
    const fill = Math.min(0.85, (totalVol / container.capacity) * 0.85);
    return { liquidColor, fillLevel: fill, totalVolume: totalVol };
  }, [container.contents, container.capacity, chemicalsMap]);

  const tempGlow = container.temperature > 60 ? "#ff3300"
    : container.temperature < 10 ? "#3399ff" : null;

  // Beaker dimensions (slightly enlarged for visibility)
  const beakerRadius = 0.05;
  const beakerHeight = 0.14;

  return (
    <InteractableMesh
      interactable={interactable}
      highlightColor={heldItem?.type === "chemical" ? "#22d3ee" : "#34d399"}
    >
      <group position={container.position}>
        {/* Glass beaker (lathe) */}
        <BeakerGlass radius={beakerRadius} height={beakerHeight} />

        {/* Liquid inside — opaque for visibility */}
        {fillLevel > 0 && (
          <>
            <mesh position={[0, (fillLevel * beakerHeight) / 2, 0]}>
              <cylinderGeometry args={[beakerRadius * 0.93, beakerRadius * 0.9, fillLevel * beakerHeight, 24]} />
              <meshStandardMaterial
                color={liquidColor}
                roughness={0.15}
                metalness={0}
                emissive={tempGlow || liquidColor}
                emissiveIntensity={tempGlow ? 0.3 : 0.08}
              />
            </mesh>
            {/* Liquid surface (disc at top) */}
            <mesh position={[0, fillLevel * beakerHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[beakerRadius * 0.92, 24]} />
              <meshStandardMaterial
                color={liquidColor}
                roughness={0.1}
                metalness={0.1}
                emissive={tempGlow || liquidColor}
                emissiveIntensity={tempGlow ? 0.3 : 0.08}
              />
            </mesh>
          </>
        )}

        {/* Temperature glow */}
        {tempGlow && fillLevel > 0 && (
          <pointLight position={[0, beakerHeight / 2, 0]} color={tempGlow} intensity={0.4} distance={0.4} />
        )}

        {/* Bubbles when hot */}
        {fillLevel > 0.05 && (container.isHeating || container.temperature > 50) && (
          <Bubbles count={Math.min(10, Math.floor(container.temperature / 15))} radius={beakerRadius * 0.7} baseY={0.01} topY={fillLevel * beakerHeight} />
        )}

        {/* Steam when > 70°C */}
        {container.temperature > 70 && fillLevel > 0.05 && (
          <SteamCloud intensity={Math.min(1, (container.temperature - 70) / 30)} radius={beakerRadius * 0.5} topY={beakerHeight} />
        )}

        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[beakerRadius + 0.02, beakerRadius + 0.03, 32]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Label (hover/selected only) */}
        {(isHovered || isSelected) && (
          <Html position={[0, beakerHeight + 0.08, 0]} center distanceFactor={3} occlude>
            <div className={`pointer-events-none select-none whitespace-nowrap rounded-md border px-2 py-1 backdrop-blur-md shadow-xl ${
              isSelected ? "border-emerald-500/60 bg-emerald-950/90" : "border-slate-600/50 bg-slate-950/90"
            }`}>
              <div className={`text-[11px] font-bold ${isSelected ? "text-emerald-300" : "text-slate-200"}`}>
                {container.id.toUpperCase()}
              </div>
              <div className="font-mono text-[9px] text-slate-400">
                {container.temperature.toFixed(0)}°C · {totalVolume.toFixed(0)}mL
                {container.contents.length > 0 && ` · ${container.contents.length} items`}
              </div>
            </div>
          </Html>
        )}
      </group>
    </InteractableMesh>
  );
}

// ============================================
// REAGENT BOTTLE — real model + color variant
// ============================================
export function RealReagentBottle({
  chemical,
  position,
}: {
  chemical: any;
  position: [number, number, number];
}) {
  const heldItem = usePlayerStore((s) => s.heldItem);
  const isHeld = heldItem?.type === "chemical" && heldItem.chemicalId === chemical.id;
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === `bottle-${chemical.id}`;

  const interactable: Interactable = {
    id: `bottle-${chemical.id}`,
    kind: "chemical-bottle",
    label: `${chemical.name} (${chemical.formula})`,
    position,
    chemicalId: chemical.id,
    action: isHeld ? "Put down" : `Pick up ${chemical.name}`,
  };

  if (isHeld) return null;

  // Determine cap color based on category
  const capColor = chemical.category === "acid" ? "#c0392b"
    : chemical.category === "base" ? "#2980b9"
    : chemical.category === "oxidizer" ? "#f1c40f"
    : chemical.category === "organic" ? "#e67e22"
    : "#16a085";

  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <group position={position}>
        <LazyModel url="/models/01_reagent_bottle_100ml.glb" position={[0, 0, 0]} scale={0.15} />

        {/* Liquid indicator (small colored dot above) */}
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshStandardMaterial color={chemical.hexColor} emissive={chemical.hexColor} emissiveIntensity={0.2} />
        </mesh>

        {/* Hover label */}
        {isHovered && (
          <Html position={[0, 0.12, 0]} center distanceFactor={3} occlude>
            <div className="pointer-events-none select-none whitespace-nowrap rounded-md border border-amber-500/50 bg-slate-950/90 px-2 py-1 backdrop-blur-md shadow-xl">
              <div className="text-[11px] font-bold text-amber-300">{chemical.name}</div>
              <div className="font-mono text-[9px] text-slate-400">{chemical.formula}</div>
              <div className="mt-0.5 text-[8px] text-emerald-400">[E] to pick up</div>
            </div>
          </Html>
        )}
      </group>
    </InteractableMesh>
  );
}

// ============================================
// ANALYTICAL BALANCE — real model + live readout
// ============================================
export function RealAnalyticalBalance({ position = [2.5, 1.0, 0.5] as [number, number, number] }) {
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const containers = useLabStore((s) => s.containers);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === "analytical-balance";

  // Calculate mass of selected beaker
  const mass = useMemo(() => {
    if (!selectedContainerId) return 0;
    const c = containers.find((c) => c.id === selectedContainerId);
    if (!c) return 0;
    let totalMoles = 0;
    for (const cc of c.contents) {
      totalMoles += cc.moles;
    }
    return totalMoles * 100; // rough grams
  }, [selectedContainerId, containers]);

  const interactable: Interactable = {
    id: "analytical-balance",
    kind: "apparatus" as any,
    label: "Analytical Balance",
    position,
    action: `Mass: ${mass.toFixed(3)} g`,
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#22d3ee">
      <LazyModel url="/models/04_analytical_balance.glb" position={position} scale={0.3} />

      {/* Live readout */}
      {isHovered && (
        <Html position={[position[0], position[1] + 0.15, position[2]]} center distanceFactor={3} occlude>
          <div className="pointer-events-none select-none rounded-md border border-cyan-500/50 bg-slate-950/90 px-3 py-2 backdrop-blur-md shadow-xl">
            <div className="font-mono text-sm font-bold text-cyan-300">
              {mass.toFixed(3)} g
            </div>
            <div className="text-[8px] text-slate-400">
              {selectedContainerId ? `Reading: ${selectedContainerId.toUpperCase()}` : "Select a beaker"}
            </div>
          </div>
        </Html>
      )}
    </InteractableMesh>
  );
}

// ============================================
// HOT PLATE — real model + on/off indicator
// ============================================
export function RealHotPlate({ position = [-2.5, 1.0, -0.3] as [number, number, number] }) {
  const isOn = usePlayerStore((s) => s.hotPlateOn);
  const interactable: Interactable = {
    id: "hot-plate",
    kind: "bunsen-burner",
    label: "Hot Plate / Stirrer",
    position,
    action: isOn ? "Turn off" : "Turn on hot plate",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <LazyModel url="/models/02_hot_plate_magnetic_stirrer.glb" position={position} scale={0.3} />
      {isOn && (
        <>
          <pointLight position={[position[0], position[1] + 0.05, position[2]]} color="#ff3300" intensity={0.3} distance={0.3} />
          <mesh position={[position[0], position[1] + 0.02, position[2]]}>
            <boxGeometry args={[0.08, 0.001, 0.08]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={0.5} />
          </mesh>
        </>
      )}
    </InteractableMesh>
  );
}

// ============================================
// RING STAND — real model
// ============================================
export function RealRingStand({ position = [2.5, 1.0, -0.5] as [number, number, number] }) {
  return (
    <LazyModel url="/models/03_ring_retort_stand.glb" position={position} scale={0.4} />
  );
}

// ============================================
// SAFETY CABINET (yellow) — real model
// ============================================
export function RealSafetyCabinet({ position = [-7, 0, -2] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "safety-cabinet",
    kind: "storage-shelf",
    label: "Flammable Storage",
    position,
    action: "Store flammables",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <LazyModel url="/models/06_safety_cabinet_yellow.glb" position={position} scale={1.0} />
    </InteractableMesh>
  );
}

// ============================================
// LAB COAT (hanging) — real model
// ============================================
export function RealLabCoat({ position = [-6, 1.0, 4.5] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "lab-coat",
    kind: "safety-station",
    label: "Lab Coat",
    position,
    action: "Put on lab coat",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#22c55e">
      <LazyModel url="/models/07_lab_coat_hanging.glb" position={position} scale={0.5} />
    </InteractableMesh>
  );
}

// ============================================
// BURETTE — real model
// ============================================
export function RealBurette({ position = [2.5, 1.5, 0] as [number, number, number] }) {
  return (
    <LazyModel url="/models/05_burette_50ml.glb" position={position} scale={0.3} />
  );
}

// ============================================
// CENTRIFUGE — real model
// ============================================
export function RealCentrifuge({ position = [3, 1.0, -0.5] as [number, number, number] }) {
  return (
    <LazyModel url="/models/13_centrifuge.glb" position={position} scale={0.3} />
  );
}

// ============================================
// DESICCATOR — real model
// ============================================
export function RealDesiccator({ position = [-2, 1.0, -0.5] as [number, number, number] }) {
  return (
    <LazyModel url="/models/12_desiccator.glb" position={position} scale={0.2} />
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function BeakerGlass({ radius, height }: { radius: number; height: number }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const rBottom = radius;
    const rTop = radius * 1.05;
    points.push(new THREE.Vector2(rBottom * 0.95, 0));
    points.push(new THREE.Vector2(rBottom, 0.002));
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      const y = t * height;
      const r = rBottom + (rTop - rBottom) * t;
      points.push(new THREE.Vector2(r, y));
    }
    points.push(new THREE.Vector2(rTop + 0.002, height + 0.002));
    return new THREE.LatheGeometry(points, 32);
  }, [radius, height]);

  return (
    <mesh geometry={geometry} castShadow>
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
  );
}

function FlameEffect({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.scale.y = 1 + Math.sin(t * 8) * 0.1;
  });
  return (
    <group ref={ref} position={position}>
      <pointLight color="#ff6600" intensity={2} distance={2} decay={1.5} />
      <mesh position={[0, 0.1, 0]}>
        <coneGeometry args={[0.04, 0.2, 12]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <coneGeometry args={[0.025, 0.15, 8]} />
        <meshBasicMaterial color="#00bbff" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

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

// Preload critical models near spawn point
export function preloadAllModels() {
  const critical = ["/models/lab_bench.glb", "/models/fume_cupboards.glb"];
  critical.forEach((url) => useGLTF.preload(url));
}

