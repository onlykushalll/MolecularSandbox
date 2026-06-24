"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  usePlayerStore,
  type Interactable,
} from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { InteractableMesh } from "./InteractableMesh";

/**
 * BenchBunsenBurner — a Bunsen burner on the side bench
 *
 * Interactable: press E to toggle flame on/off.
 * When on, it heats the nearest beaker on the side bench.
 */

export function BenchBunsenBurner({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<THREE.Mesh>(null);
  const innerFlameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const time = useRef(0);
  const isOn = usePlayerStore((s) => s.bunsenOn);
  const toggleBunsen = usePlayerStore((s) => s.toggleBunsen);

  const interactable: Interactable = {
    id: "bunsen-burner",
    kind: "bunsen-burner",
    label: "Bunsen Burner",
    position,
    action: isOn ? "Turn off flame" : "Ignite flame",
  };

  useFrame((_, delta) => {
    time.current += delta;
    const t = time.current;

    if (flameRef.current) {
      const scale = isOn ? 1 + Math.sin(t * 8) * 0.08 : 0.001;
      flameRef.current.scale.set(scale * 0.9, scale, scale * 0.9);
      flameRef.current.rotation.y = t * 0.5;
    }
    if (innerFlameRef.current) {
      const scale = isOn ? 0.7 + Math.sin(t * 10 + 1) * 0.06 : 0.001;
      innerFlameRef.current.scale.set(scale, scale * 1.1, scale);
    }
    if (lightRef.current) {
      lightRef.current.intensity = isOn
        ? 2.0 + Math.sin(t * 15) * 0.3 + Math.sin(t * 23) * 0.2
        : 0;
    }
  });

  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <group position={position}>
        {/* Burner base */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.04, 16]} />
          <meshStandardMaterial color="#222" roughness={0.5} metalness={0.9} />
        </mesh>

        {/* Burner tube */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.04, 0.25, 12]} />
          <meshStandardMaterial color="#333" roughness={0.4} metalness={0.85} />
        </mesh>

        {/* Gas knob */}
        <mesh position={[0.07, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.035, 8]} />
          <meshStandardMaterial color="#888" roughness={0.3} metalness={0.95} />
        </mesh>

        {/* Air holes */}
        <mesh position={[0, 0.2, 0.03]}>
          <boxGeometry args={[0.015, 0.01, 0.005]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[0, 0.2, -0.03]}>
          <boxGeometry args={[0.015, 0.01, 0.005]} />
          <meshStandardMaterial color="#000" />
        </mesh>

        {/* === Flame (only when on) === */}
        {isOn && (
          <>
            <pointLight
              ref={lightRef}
              position={[0, 0.4, 0]}
              color="#ff6600"
              intensity={2}
              distance={3}
              decay={1.5}
            />

            {/* Outer flame */}
            <mesh ref={flameRef} position={[0, 0.4, 0]}>
              <coneGeometry args={[0.08, 0.4, 16]} />
              <meshBasicMaterial
                color="#ff5500"
                transparent
                opacity={0.65}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Inner blue core */}
            <mesh ref={innerFlameRef} position={[0, 0.36, 0]}>
              <coneGeometry args={[0.05, 0.3, 12]} />
              <meshBasicMaterial
                color="#00bbff"
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Yellow tip */}
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial
                color="#ffdd00"
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </>
        )}

        {/* Inactive indicator */}
        {!isOn && (
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#4a5568" transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    </InteractableMesh>
  );
}
