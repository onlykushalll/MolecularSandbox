"use client";

import { LAB_DIMENSIONS } from "@/lib/store/player-store";

/**
 * LabRoom — the 3D environment shell
 *
 * Clean modern chemistry lab:
 * - Polished concrete/epoxy floor (light grey, glossy)
 * - White painted walls with subtle grid pattern
 * - Drop ceiling with fluorescent panel lights
 * - Glass door on south wall
 * - Two frosted windows on east/west walls
 * - Baseboards and crown molding for architectural detail
 */
export function LabRoom() {
  const { width, depth, height, wallThickness } = LAB_DIMENSIONS;
  const halfW = width / 2;
  const halfD = depth / 2;

  return (
    <group>
      {/* === FLOOR === */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#e8eaed"
          roughness={0.3}
          metalness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Floor grid lines (subtle) */}
      <gridHelper
        args={[width, 16, "#c0c4cc", "#d4d8de"]}
        position={[0, 0.01, 0]}
      />

      {/* === CEILING === */}
      <mesh
        position={[0, height, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#f5f6f8"
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* === WALLS === */}
      {/* North wall (behind fume hood) */}
      <mesh position={[0, height / 2, -halfD]} receiveShadow castShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0} />
      </mesh>

      {/* South wall (with door opening) — split into two segments */}
      {/* Left segment */}
      <mesh
        position={[-halfW + 2.5, height / 2, halfD]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[5, height, wallThickness]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0} />
      </mesh>
      {/* Right segment */}
      <mesh
        position={[halfW - 3, height / 2, halfD]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[10, height, wallThickness]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0} />
      </mesh>
      {/* Door header (above door) */}
      <mesh
        position={[2, height - 0.4, halfD]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[2, 0.8, wallThickness]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0} />
      </mesh>

      {/* Glass door */}
      <mesh position={[2, 1.1, halfD]}>
        <boxGeometry args={[1.8, 2.2, 0.05]} />
        <meshPhysicalMaterial
          color="#a8d4e6"
          transparent
          opacity={0.4}
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
        <meshStandardMaterial
          color="#3a3f4b"
          roughness={0.4}
          metalness={0.7}
          wireframe
        />
      </mesh>

      {/* East wall (with window) — split */}
      <mesh
        position={[halfW, height / 2, -halfD + 3.5]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[wallThickness, height, 7]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0} />
      </mesh>
      <mesh
        position={[halfW, height / 2, halfD - 2]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[wallThickness, height, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0} />
      </mesh>
      {/* Window (east) */}
      <mesh position={[halfW, 1.5, 1.5]}>
        <boxGeometry args={[0.05, 1.6, 1.8]} />
        <meshPhysicalMaterial
          color="#c8e0ec"
          transparent
          opacity={0.3}
          roughness={0.05}
          transmission={0.85}
          ior={1.45}
          clearcoat={1}
        />
      </mesh>
      {/* Window frame (east) */}
      <mesh position={[halfW, 1.5, 1.5]}>
        <boxGeometry args={[0.1, 1.8, 2.0]} />
        <meshStandardMaterial
          color="#3a3f4b"
          roughness={0.4}
          metalness={0.7}
          wireframe
        />
      </mesh>

      {/* West wall (solid) */}
      <mesh
        position={[-halfW, height / 2, 0]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0} />
      </mesh>

      {/* === BASEBOARDS === */}
      {/* North */}
      <mesh position={[0, 0.08, -halfD + wallThickness / 2]}>
        <boxGeometry args={[width, 0.16, 0.04]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* South (split around door) */}
      <mesh position={[-halfW + 2.5, 0.08, halfD - wallThickness / 2]}>
        <boxGeometry args={[5, 0.16, 0.04]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[halfW - 3, 0.08, halfD - wallThickness / 2]}>
        <boxGeometry args={[10, 0.16, 0.04]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* East */}
      <mesh position={[halfW - wallThickness / 2, 0.08, 0]}>
        <boxGeometry args={[0.04, 0.16, depth]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* West */}
      <mesh position={[-halfW + wallThickness / 2, 0.08, 0]}>
        <boxGeometry args={[0.04, 0.16, depth]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* === CEILING LIGHTS (fluorescent panels) === */}
      {[-3, 0, 3].map((x) =>
        [-3, 0, 3].map((z) => (
          <group key={`light-${x}-${z}`} position={[x, height - 0.05, z]}>
            {/* Panel housing */}
            <mesh>
              <boxGeometry args={[1.4, 0.1, 0.6]} />
              <meshStandardMaterial
                color="#e8e8e8"
                roughness={0.5}
                metalness={0.3}
              />
            </mesh>
            {/* Glowing panel */}
            <mesh position={[0, -0.06, 0]}>
              <boxGeometry args={[1.3, 0.02, 0.5]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={1.5}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}
