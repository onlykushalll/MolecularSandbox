"use client";
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useLabStore } from "@/lib/store/lab-store";

interface Thermometer3DProps {
  position?: [number, number, number];
}

/**
 * A 3D lab thermometer mounted on a stand. The mercury column rises and changes
 * color with the temperature of the currently-selected beaker.
 *
 * Ranges: 0°C (bottom) to 150°C (top). Color shifts blue → green → orange → red.
 */
export function Thermometer3D({ position = [4.2, -0.6, -1.2] }: Thermometer3DProps) {
  const bulbRef = useRef<THREE.Mesh>(null);
  const columnRef = useRef<THREE.Mesh>(null);
  const mercuryMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const containers = useLabStore((s) => s.containers);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);

  // Tube dimensions
  const tubeHeight = 2.4;
  const tubeRadius = 0.09;
  const bulbRadius = 0.22;

  // Determine the temperature to display: selected beaker, else ambient 25
  const selected = containers.find((c) => c.id === selectedContainerId);
  const temperature = selected ? selected.temperature : 25;

  // Map temperature to column fill (0°C → 0%, 150°C → 100%)
  const fillPercent = Math.max(0, Math.min(1, temperature / 150));

  useFrame(() => {
    // Smooth color transition based on temperature
    const tempColor = temperatureToColor(temperature);
    if (mercuryMaterialRef.current) {
      mercuryMaterialRef.current.color.lerp(tempColor, 0.15);
      // Emissive glow when hot
      const emissiveIntensity = Math.max(0, (temperature - 50) / 100);
      mercuryMaterialRef.current.emissive.lerp(tempColor, 0.15);
      mercuryMaterialRef.current.emissiveIntensity = emissiveIntensity * 0.6;
    }
  });

  // Column geometry — scales with fill
  const columnHeight = 0.05 + fillPercent * (tubeHeight - 0.3);
  const columnY = -tubeHeight / 2 + columnHeight / 2 + 0.05;

  return (
    <group position={position}>
      {/* Stand base */}
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.4, 0.1, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Stand pole (back support) */}
      <mesh position={[-0.18, tubeHeight / 2 + 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, tubeHeight + 0.5, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Top arm clamp */}
      <mesh position={[-0.09, tubeHeight + 0.2, 0]} castShadow>
        <boxGeometry args={[0.18, 0.04, 0.06]} />
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Middle arm clamp */}
      <mesh position={[-0.09, 0.2, 0]} castShadow>
        <boxGeometry args={[0.18, 0.04, 0.06]} />
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Thermometer glass tube */}
      <mesh position={[0, tubeHeight / 2, 0]}>
        <cylinderGeometry args={[tubeRadius, tubeRadius, tubeHeight, 24]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.25}
          roughness={0.05}
          metalness={0}
          transmission={0.9}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>

      {/* Mercury bulb at bottom */}
      <mesh ref={bulbRef} position={[0, -tubeHeight / 2 + 0.05, 0]} castShadow>
        <sphereGeometry args={[bulbRadius, 32, 32]} />
        <meshStandardMaterial
          ref={mercuryMaterialRef}
          color={temperatureToColor(temperature)}
          roughness={0.2}
          metalness={0.5}
          emissive={temperatureToColor(temperature)}
          emissiveIntensity={Math.max(0, (temperature - 50) / 100) * 0.6}
        />
      </mesh>

      {/* Mercury column (rises with temperature) */}
      <mesh ref={columnRef} position={[0, columnY, 0]}>
        <cylinderGeometry args={[tubeRadius * 0.7, tubeRadius * 0.7, columnHeight, 16]} />
        <meshStandardMaterial
          color={temperatureToColor(temperature)}
          roughness={0.2}
          metalness={0.5}
          emissive={temperatureToColor(temperature)}
          emissiveIntensity={Math.max(0, (temperature - 50) / 100) * 0.6}
        />
      </mesh>

      {/* Tick marks on the side */}
      <TickMarks tubeHeight={tubeHeight} tubeRadius={tubeRadius} />

      {/* Temperature label (billboarded, always faces camera) */}
      <Billboard position={[0.35, tubeHeight + 0.15, 0]}>
        <Html center distanceFactor={10}>
          <div
            ref={labelRef}
            className="pointer-events-none flex flex-col items-center rounded-md border border-slate-600 bg-slate-950/85 px-2 py-1 backdrop-blur"
            style={{ minWidth: "60px" }}
          >
            <div
              className="font-mono text-sm font-bold leading-none"
              style={{ color: `#${temperatureToColor(temperature).getHexString()}` }}
            >
              {temperature.toFixed(1)}°C
            </div>
            <div className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-400">
              {selected ? selected.id.toUpperCase() : "ambient"}
            </div>
          </div>
        </Html>
      </Billboard>

      {/* "THERMOMETER" label at base */}
      <Html position={[0, -0.3, 0]} center distanceFactor={12}>
        <div className="pointer-events-none whitespace-nowrap text-[8px] font-semibold uppercase tracking-widest text-slate-500">
          Thermometer
        </div>
      </Html>
    </group>
  );
}

function temperatureToColor(temp: number): THREE.Color {
  // -10°C (deep blue) → 25°C (green) → 80°C (orange) → 150°C (red)
  if (temp <= 0) return new THREE.Color("#3b82f6");
  if (temp <= 25) {
    const t = temp / 25;
    return new THREE.Color("#3b82f6").lerp(new THREE.Color("#22c55e"), t);
  }
  if (temp <= 80) {
    const t = (temp - 25) / 55;
    return new THREE.Color("#22c55e").lerp(new THREE.Color("#f97316"), t);
  }
  if (temp <= 150) {
    const t = (temp - 80) / 70;
    return new THREE.Color("#f97316").lerp(new THREE.Color("#ef4444"), t);
  }
  return new THREE.Color("#ef4444");
}

function TickMarks({ tubeHeight, tubeRadius }: { tubeHeight: number; tubeRadius: number }) {
  // Generate tick marks every 10°C from 0 to 150 = 16 ticks
  const ticks = useMemo(() => {
    const arr: { y: number; long: boolean; label?: string }[] = [];
    for (let i = 0; i <= 15; i++) {
      const y = -tubeHeight / 2 + (i / 15) * tubeHeight;
      const isLong = i % 3 === 0;
      arr.push({
        y,
        long: isLong,
        label: isLong ? `${i * 10}°` : undefined,
      });
    }
    return arr;
  }, [tubeHeight]);

  return (
    <group>
      {ticks.map((tick, i) => (
        <group key={i} position={[tubeRadius + 0.005, tick.y, 0]}>
          <mesh>
            <boxGeometry args={[tick.long ? 0.1 : 0.05, 0.008, 0.008]} />
            <meshStandardMaterial color="#64748b" roughness={0.4} />
          </mesh>
          {tick.label && (
            <Html position={[0.08, 0, 0]} center distanceFactor={14}>
              <div className="pointer-events-none text-[7px] font-mono text-slate-500">
                {tick.label}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}
