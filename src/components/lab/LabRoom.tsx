"use client";

import { LAB_DIMENSIONS } from "@/lib/store/player-store";

/**
 * LabRoom — REDESIGNED with interior design principles
 *
 * Based on research:
 * - Lab aisle width: minimum 1.5m (5 feet) between benches
 * - Bench width: 750mm standard
 * - Ceiling height: 2.7-3.0m for labs
 * - Lighting: integrated ceiling panels, even coverage, no harsh shadows
 * - Colors: cool tones (blue-green-grey) for calm + focus
 * - Materials: PBR — epoxy floor, painted walls, resin bench, brushed metal
 * - Natural light from window (but controlled for glare)
 *
 * Room: 14m × 10m, 2.8m ceiling
 * Layout: Central bench (4m wide), side bench along west wall,
 * fume hood on north wall, storage on east wall, door on south
 */

export function LabRoom() {
  const { width, depth, height, wallThickness } = LAB_DIMENSIONS;
  const halfW = width / 2;
  const halfD = depth / 2;

  return (
    <group>
      {/* === FLOOR — epoxy resin, light grey, glossy === */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#d4d8de"
          roughness={0.25}
          metalness={0.15}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Subtle floor grid (lab tile pattern) */}
      <gridHelper
        args={[width, 14, "#a0a8b4", "#b8c0cc"]}
        position={[0, 0.01, 0]}
      />

      {/* === CEILING — white, matte === */}
      <mesh
        position={[0, height, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f0f2f5" roughness={0.9} metalness={0} />
      </mesh>

      {/* === WALLS — soft blue-grey (calming, scientific) === */}
      {/* North wall (fume hood wall) */}
      <mesh position={[0, height / 2, -halfD]} receiveShadow castShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color="#e2e6ec" roughness={0.8} metalness={0} />
      </mesh>

      {/* South wall (with door) — split */}
      <mesh position={[-halfW + 2.5, height / 2, halfD]} receiveShadow castShadow>
        <boxGeometry args={[5, height, wallThickness]} />
        <meshStandardMaterial color="#e2e6ec" roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[halfW - 3, height / 2, halfD]} receiveShadow castShadow>
        <boxGeometry args={[10, height, wallThickness]} />
        <meshStandardMaterial color="#e2e6ec" roughness={0.8} metalness={0} />
      </mesh>
      {/* Door header */}
      <mesh position={[2, height - 0.4, halfD]} receiveShadow castShadow>
        <boxGeometry args={[2, 0.8, wallThickness]} />
        <meshStandardMaterial color="#e2e6ec" roughness={0.8} metalness={0} />
      </mesh>

      {/* Glass door */}
      <mesh position={[2, 1.1, halfD]}>
        <boxGeometry args={[1.8, 2.2, 0.05]} />
        <meshPhysicalMaterial
          color="#b8d4e6"
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0}
          transmission={0.8}
          ior={1.45}
          clearcoat={1}
        />
      </mesh>
      {/* Door frame */}
      <mesh position={[2, 1.1, halfD]}>
        <boxGeometry args={[2.0, 2.3, 0.08]} />
        <meshStandardMaterial color="#3a3f4b" roughness={0.4} metalness={0.7} wireframe />
      </mesh>

      {/* East wall (with window) — split */}
      <mesh position={[halfW, height / 2, -halfD + 3.5]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, height, 7]} />
        <meshStandardMaterial color="#e2e6ec" roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[halfW, height / 2, halfD - 2]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, height, 4]} />
        <meshStandardMaterial color="#e2e6ec" roughness={0.8} metalness={0} />
      </mesh>
      {/* Window (east) — frosted, lets in soft light */}
      <mesh position={[halfW, 1.5, 1.5]}>
        <boxGeometry args={[0.05, 1.6, 1.8]} />
        <meshPhysicalMaterial
          color="#d8e8f0"
          transparent
          opacity={0.25}
          roughness={0.05}
          transmission={0.85}
          ior={1.45}
          clearcoat={1}
        />
      </mesh>
      {/* Window frame */}
      <mesh position={[halfW, 1.5, 1.5]}>
        <boxGeometry args={[0.1, 1.8, 2.0]} />
        <meshStandardMaterial color="#3a3f4b" roughness={0.4} metalness={0.7} wireframe />
      </mesh>
      {/* Window light (soft daylight coming in) */}
      <directionalLight position={[halfW + 2, 2, 1.5]} intensity={0.3} color="#d4e8f5" />

      {/* West wall (solid) */}
      <mesh position={[-halfW, height / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color="#e2e6ec" roughness={0.8} metalness={0} />
      </mesh>

      {/* === BASEBOARDS — dark grey === */}
      {[
        { pos: [0, 0.08, -halfD + wallThickness / 2], size: [width, 0.16, 0.04] },
        { pos: [-halfW + 2.5, 0.08, halfD - wallThickness / 2], size: [5, 0.16, 0.04] },
        { pos: [halfW - 3, 0.08, halfD - wallThickness / 2], size: [10, 0.16, 0.04] },
        { pos: [halfW - wallThickness / 2, 0.08, 0], size: [0.04, 0.16, depth] },
        { pos: [-halfW + wallThickness / 2, 0.08, 0], size: [0.04, 0.16, depth] },
      ].map((b, i) => (
        <mesh key={i} position={b.pos as [number, number, number]}>
          <boxGeometry args={b.size as [number, number, number]} />
          <meshStandardMaterial color="#2a2e38" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* === CEILING LIGHT PANELS — flush mounted, glowing === */}
      {[-3, 0, 3].map((x) =>
        [-3, 0, 3].map((z) => (
          <group key={`light-${x}-${z}`} position={[x, height - 0.05, z]}>
            {/* Panel housing */}
            <mesh>
              <boxGeometry args={[1.2, 0.08, 0.5]} />
              <meshStandardMaterial color="#e8e8e8" roughness={0.5} metalness={0.3} />
            </mesh>
            {/* Glowing panel */}
            <mesh position={[0, -0.05, 0]}>
              <boxGeometry args={[1.1, 0.02, 0.4]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#f0f4f8"
                emissiveIntensity={2.0}
                toneMapped={false}
              />
            </mesh>
            {/* Actual light */}
            <pointLight position={[0, -0.15, 0]} intensity={0.4} color="#f0f4f8" distance={6} decay={1.5} />
          </group>
        ))
      )}

      {/* === WALL ACCENT STRIP — thin colored line at 1.2m height (lab standard) === */}
      {/* Green accent on north wall */}
      <mesh position={[0, 1.2, -halfD + wallThickness / 2 + 0.01]}>
        <boxGeometry args={[width, 0.02, 0.01]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.3} />
      </mesh>
      {/* Blue accent on east wall */}
      <mesh position={[halfW - wallThickness / 2 - 0.01, 1.2, 0]}>
        <boxGeometry args={[0.01, 0.02, depth]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.3} />
      </mesh>

      {/* === EXIT SIGN above door === */}
      <mesh position={[2, 2.5, halfD - 0.1]}>
        <boxGeometry args={[0.3, 0.1, 0.02]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
    </group>
  );
}
