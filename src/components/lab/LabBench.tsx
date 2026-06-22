"use client";
import { useRef } from "react";
import * as THREE from "three";

export function LabBench() {
  const benchRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      {/* Main bench surface */}
      <mesh
        ref={benchRef}
        position={[0, -1.2, 0]}
        receiveShadow
      >
        <boxGeometry args={[10, 0.1, 6]} />
        <meshStandardMaterial
          color="#6b4f2a"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Bench edge highlight */}
      <mesh position={[0, -1.15, 3]}>
        <boxGeometry args={[10, 0.02, 0.05]} />
        <meshStandardMaterial color="#8b6f3a" roughness={0.5} />
      </mesh>
      <mesh position={[0, -1.15, -3]}>
        <boxGeometry args={[10, 0.02, 0.05]} />
        <meshStandardMaterial color="#8b6f3a" roughness={0.5} />
      </mesh>

      {/* Bench front panel */}
      <mesh position={[0, -1.7, 3.05]}>
        <boxGeometry args={[10, 1.0, 0.05]} />
        <meshStandardMaterial color="#5a3f1a" roughness={0.8} />
      </mesh>

      {/* Tile pattern lines on bench */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={`h-${i}`} position={[-4.5 + i, -1.148, 0]}>
          <boxGeometry args={[0.01, 0.005, 6]} />
          <meshStandardMaterial color="#4a3210" transparent opacity={0.3} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`v-${i}`} position={[0, -1.148, -2.5 + i]}>
          <boxGeometry args={[10, 0.005, 0.01]} />
          <meshStandardMaterial color="#4a3210" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Back wall */}
      <mesh position={[0, 1, -3]} receiveShadow>
        <boxGeometry args={[10, 5, 0.1]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.9} />
      </mesh>

      {/* Shelf on back wall */}
      <mesh position={[-3, 0.2, -2.93]}>
        <boxGeometry args={[3, 0.05, 0.3]} />
        <meshStandardMaterial color="#8b6f3a" roughness={0.6} />
      </mesh>
      <mesh position={[3, 0.2, -2.93]}>
        <boxGeometry args={[3, 0.05, 0.3]} />
        <meshStandardMaterial color="#8b6f3a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.5, -2.93]}>
        <boxGeometry args={[5, 0.05, 0.3]} />
        <meshStandardMaterial color="#8b6f3a" roughness={0.6} />
      </mesh>
    </group>
  );
}
