"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayerStore } from "@/lib/store/player-store";

/**
 * PlayerBody — the first-person body viewmodel
 *
 * Renders a simplified scientist body attached to the camera:
 * - White lab coat (torso + arms)
 * - Hands (visible when looking down or holding item)
 * - Legs (visible when looking straight down)
 * - When coat is off, show regular clothes (dark shirt)
 *
 * The body is parented to the camera so it always follows the player view.
 * It's positioned slightly below and forward so it's visible when looking down.
 */
export function PlayerBody() {
  const groupRef = useRef<THREE.Group>(null);
  const coatOn = usePlayerStore((s) => s.ppe.coat);
  const heldItem = usePlayerStore((s) => s.heldItem);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    // Attach group to camera position + rotation
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);
    // Slight offset so body is below view
    groupRef.current.translateY(-0.15);
  });

  return (
    <group ref={groupRef} renderOrder={999}>
      {/* === TORSO (visible when looking down) === */}
      <mesh position={[0, -0.55, -0.15]} renderOrder={999}>
        <boxGeometry args={[0.42, 0.6, 0.25]} />
        <meshStandardMaterial
          color={coatOn ? "#f8f9fa" : "#2a3548"}
          roughness={coatOn ? 0.85 : 0.7}
          metalness={0}
          depthTest={false}
        />
      </mesh>

      {/* Coat lapels (only when coat on) */}
      {coatOn && (
        <>
          <mesh position={[-0.1, -0.35, -0.02]} rotation={[0.3, 0, 0.2]}>
            <boxGeometry args={[0.12, 0.25, 0.02]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.8}
              depthTest={false}
            />
          </mesh>
          <mesh position={[0.1, -0.35, -0.02]} rotation={[0.3, 0, -0.2]}>
            <boxGeometry args={[0.12, 0.25, 0.02]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.8}
              depthTest={false}
            />
          </mesh>
        </>
      )}

      {/* === LEFT ARM (always visible at bottom-left of view) === */}
      <mesh position={[-0.28, -0.45, -0.25]} rotation={[0.5, 0, 0.3]} renderOrder={999}>
        <capsuleGeometry args={[0.06, 0.35, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? "#f0f1f3" : "#2a3548"}
          roughness={0.85}
          depthTest={false}
        />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.32, -0.62, -0.35]} renderOrder={999}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial
          color="#e8b894"
          roughness={0.6}
          depthTest={false}
        />
      </mesh>

      {/* === RIGHT ARM (visible, may hold item) === */}
      <mesh
        position={[0.28, -0.45, -0.25]}
        rotation={[0.5, 0, -0.3]}
        renderOrder={999}
      >
        <capsuleGeometry args={[0.06, 0.35, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? "#f0f1f3" : "#2a3548"}
          roughness={0.85}
          depthTest={false}
        />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.32, -0.62, -0.35]} renderOrder={999}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial
          color="#e8b894"
          roughness={0.6}
          depthTest={false}
        />
      </mesh>

      {/* === HELD ITEM (bottle/beaker in right hand) === */}
      {heldItem && heldItem.type === "chemical" && (
        <group position={[0.32, -0.55, -0.42]} rotation={[0, 0, 0]}>
          {/* Bottle body */}
          <mesh renderOrder={1000}>
            <cylinderGeometry args={[0.04, 0.045, 0.15, 12]} />
            <meshPhysicalMaterial
              color="#a8c8e0"
              transparent
              opacity={0.3}
              roughness={0.05}
              transmission={0.7}
              ior={1.45}
              depthTest={false}
            />
          </mesh>
          {/* Liquid inside */}
          <mesh position={[0, -0.02, 0]} renderOrder={1000}>
            <cylinderGeometry args={[0.035, 0.04, 0.1, 12]} />
            <meshStandardMaterial
              color="#4488cc"
              transparent
              opacity={0.7}
              depthTest={false}
            />
          </mesh>
          {/* Bottle cap */}
          <mesh position={[0, 0.085, 0]} renderOrder={1000}>
            <cylinderGeometry args={[0.025, 0.025, 0.03, 8]} />
            <meshStandardMaterial
              color="#cc4444"
              roughness={0.4}
              depthTest={false}
            />
          </mesh>
        </group>
      )}

      {/* === LEGS (visible when looking straight down) === */}
      <mesh position={[-0.1, -0.95, -0.1]} renderOrder={998}>
        <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? "#3a3f4b" : "#1a2030"}
          roughness={0.8}
          depthTest={false}
        />
      </mesh>
      <mesh position={[0.1, -0.95, -0.1]} renderOrder={998}>
        <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? "#3a3f4b" : "#1a2030"}
          roughness={0.8}
          depthTest={false}
        />
      </mesh>

      {/* === SHOES === */}
      <mesh position={[-0.1, -1.18, -0.05]} renderOrder={998}>
        <boxGeometry args={[0.1, 0.06, 0.2]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.5}
          depthTest={false}
        />
      </mesh>
      <mesh position={[0.1, -1.18, -0.05]} renderOrder={998}>
        <boxGeometry args={[0.1, 0.06, 0.2]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.5}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}
