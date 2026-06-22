"use client";
import { useRef } from "react";
import * as THREE from "three";

export function LabBench() {
  const benchRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      {/* Main bench surface — dark resin lab countertop */}
      <mesh
        ref={benchRef}
        position={[0, -1.2, 0]}
        receiveShadow
      >
        <boxGeometry args={[10, 0.1, 6]} />
        <meshPhysicalMaterial
          color="#1f2937"
          roughness={0.3}
          metalness={0.1}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Bench edge highlight (front lip) */}
      <mesh position={[0, -1.15, 3]}>
        <boxGeometry args={[10, 0.02, 0.05]} />
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, -1.15, -3]}>
        <boxGeometry args={[10, 0.02, 0.05]} />
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Bench front panel (cabinet) */}
      <mesh position={[0, -1.7, 3.05]}>
        <boxGeometry args={[10, 1.0, 0.05]} />
        <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Cabinet drawer lines */}
      {[-3, -1, 1, 3].map((x) => (
        <mesh key={`drawer-${x}`} position={[x, -1.7, 3.08]}>
          <boxGeometry args={[0.01, 0.9, 0.01]} />
          <meshStandardMaterial color="#030712" />
        </mesh>
      ))}
      {/* Drawer handles */}
      {[-4, -2, 0, 2, 4].map((x) => (
        <mesh key={`handle-${x}`} position={[x, -1.5, 3.1]}>
          <boxGeometry args={[0.3, 0.03, 0.03]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Subtle grid pattern on bench (lab table markings) */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={`h-${i}`} position={[-4.5 + i, -1.148, 0]}>
          <boxGeometry args={[0.005, 0.003, 6]} />
          <meshStandardMaterial color="#064e3b" transparent opacity={0.15} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`v-${i}`} position={[0, -1.148, -2.5 + i]}>
          <boxGeometry args={[10, 0.003, 0.005]} />
          <meshStandardMaterial color="#064e3b" transparent opacity={0.15} />
        </mesh>
      ))}

      {/* Back wall — lab tile */}
      <mesh position={[0, 1, -3]} receiveShadow>
        <boxGeometry args={[10, 5, 0.1]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
      </mesh>

      {/* Tile lines on back wall */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={`wall-h-${i}`} position={[0, -1.4 + i * 0.7, -2.94]}>
          <boxGeometry args={[10, 0.005, 0.01]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      ))}
      {Array.from({ length: 11 }).map((_, i) => (
        <mesh key={`wall-v-${i}`} position={[-5 + i, 1, -2.94]}>
          <boxGeometry args={[0.005, 5, 0.01]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      ))}

      {/* Window on back wall (top center) — glowing blue panel */}
      <mesh position={[0, 2.3, -2.93]}>
        <boxGeometry args={[2.5, 1.2, 0.02]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0ea5e9"
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Window frame */}
      <mesh position={[0, 2.3, -2.92]}>
        <boxGeometry args={[2.7, 1.4, 0.01]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* Window cross bars */}
      <mesh position={[0, 2.3, -2.91]}>
        <boxGeometry args={[2.5, 0.04, 0.02]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0, 2.3, -2.91]}>
        <boxGeometry args={[0.04, 1.2, 0.02]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Shelves on back wall */}
      <mesh position={[-3, 0.2, -2.93]}>
        <boxGeometry args={[3, 0.05, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[3, 0.2, -2.93]}>
        <boxGeometry args={[3, 0.05, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.5, -2.93]}>
        <boxGeometry args={[5, 0.05, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Bottles on left shelf — colorful reagent bottles */}
      {[
        { x: -4, color: "#dc2626", h: 0.35 },
        { x: -3.5, color: "#16a34a", h: 0.4 },
        { x: -3, color: "#ca8a04", h: 0.3 },
        { x: -2.5, color: "#0891b2", h: 0.45 },
        { x: -2, color: "#9333ea", h: 0.35 },
      ].map((b, i) => (
        <group key={`left-bottle-${i}`} position={[b.x, 0.2 + b.h / 2 + 0.025, -2.85]}>
          {/* Bottle body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.12, b.h, 16]} />
            <meshPhysicalMaterial
              color={b.color}
              transparent
              opacity={0.6}
              roughness={0.1}
              transmission={0.5}
              ior={1.5}
            />
          </mesh>
          {/* Bottle neck */}
          <mesh position={[0, b.h / 2 + 0.05, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.1, 12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Liquid inside (slightly smaller) */}
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.1, 0.1, b.h * 0.7, 16]} />
            <meshStandardMaterial color={b.color} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Bottles on right shelf */}
      {[
        { x: 2, color: "#f59e0b", h: 0.35 },
        { x: 2.5, color: "#8b5cf6", h: 0.4 },
        { x: 3, color: "#10b981", h: 0.3 },
        { x: 3.5, color: "#ef4444", h: 0.45 },
        { x: 4, color: "#3b82f6", h: 0.35 },
      ].map((b, i) => (
        <group key={`right-bottle-${i}`} position={[b.x, 0.2 + b.h / 2 + 0.025, -2.85]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.12, b.h, 16]} />
            <meshPhysicalMaterial
              color={b.color}
              transparent
              opacity={0.6}
              roughness={0.1}
              transmission={0.5}
              ior={1.5}
            />
          </mesh>
          <mesh position={[0, b.h / 2 + 0.05, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.1, 12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.1, 0.1, b.h * 0.7, 16]} />
            <meshStandardMaterial color={b.color} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Books / manuals on top shelf */}
      {[
        { x: -2, color: "#0f766e", w: 0.08, h: 0.3 },
        { x: -1.9, color: "#7c2d12", w: 0.08, h: 0.32 },
        { x: -1.8, color: "#1e3a8a", w: 0.08, h: 0.28 },
        { x: -1.7, color: "#581c87", w: 0.08, h: 0.3 },
        { x: 1.5, color: "#365314", w: 0.08, h: 0.3 },
        { x: 1.6, color: "#831843", w: 0.08, h: 0.32 },
        { x: 1.7, color: "#0c4a6e", w: 0.08, h: 0.28 },
      ].map((b, i) => (
        <mesh key={`book-${i}`} position={[b.x, 1.5 + b.h / 2 + 0.025, -2.85]} castShadow>
          <boxGeometry args={[b.w, b.h, 0.2]} />
          <meshStandardMaterial color={b.color} roughness={0.7} />
        </mesh>
      ))}

      {/* Microscope silhouette on top shelf center */}
      <group position={[0, 1.55, -2.85]}>
        {/* Base */}
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[0.3, 0.08, 0.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Arm */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.06, 0.3, 0.06]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Eyepiece */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 0.1, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Lens */}
        <mesh position={[0, 0.18, 0.05]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
          <meshStandardMaterial color="#1e40af" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* Floor (subtle, for shadow context) */}
      <mesh position={[0, -2.2, 0]} receiveShadow>
        <boxGeometry args={[14, 0.05, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Lab stool (left side) */}
      <group position={[-3.5, -1, 1.5]}>
        {/* Seat */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.05, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        {/* Pole */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Base */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.05, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* Wash bottle on bench (right side) */}
      <group position={[3.2, -1.1, 0.5]} rotation={[0, 0.3, 0]}>
        {/* Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.25, 16]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.5} roughness={0.1} transmission={0.3} />
        </mesh>
        {/* Spout */}
        <mesh position={[0.05, 0.18, 0]} rotation={[0, 0, -0.6]}>
          <cylinderGeometry args={[0.015, 0.02, 0.15, 8]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.5} />
        </mesh>
        {/* Liquid */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.18, 16]} />
          <meshStandardMaterial color="#bfdbfe" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Ring stand on bench (right side) */}
      <group position={[2.5, -1.1, -0.3]}>
        {/* Base plate */}
        <mesh position={[0, 0.01, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Vertical rod */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.7, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Ring clamp */}
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.008, 8, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Clamp screw */}
        <mesh position={[0.12, 0.5, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Thermometer on bench */}
      <group position={[-2.5, -1.1, 0.8]} rotation={[0, 0.5, 0]}>
        {/* Glass tube */}
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, 0.3, 8]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.3} roughness={0.05} transmission={0.9} />
        </mesh>
        {/* Mercury bulb */}
        <mesh position={[0, -0.16, 0]}>
          <sphereGeometry args={[0.015, 12, 12]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
        </mesh>
        {/* Mercury column */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.18, 6]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* Safety goggles on bench */}
      <group position={[-1, -1.1, 1.5]} rotation={[0.3, 0.2, 0]}>
        {/* Lens left */}
        <mesh position={[-0.04, 0.01, 0]}>
          <sphereGeometry args={[0.035, 16, 16, 0, Math.PI]} />
          <meshPhysicalMaterial color="#bfdbfe" transparent opacity={0.3} roughness={0.02} transmission={0.9} />
        </mesh>
        {/* Lens right */}
        <mesh position={[0.04, 0.01, 0]}>
          <sphereGeometry args={[0.035, 16, 16, 0, Math.PI]} />
          <meshPhysicalMaterial color="#bfdbfe" transparent opacity={0.3} roughness={0.02} transmission={0.9} />
        </mesh>
        {/* Bridge */}
        <mesh position={[0, 0.01, 0.03]}>
          <boxGeometry args={[0.03, 0.008, 0.01]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
        {/* Strap */}
        <mesh position={[0, 0.01, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.004, 4, 16, Math.PI]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      </group>
    </group>
  );
}
