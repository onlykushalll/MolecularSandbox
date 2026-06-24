"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayerStore } from "@/lib/store/player-store";

/**
 * PlayerBody — first-person scientist viewmodel
 *
 * Renders a realistic scientist body attached to the camera:
 * - White lab coat with collar, lapels, buttons (when coat on)
 * - Dark shirt when coat off
 * - Arms with sleeves (coat sleeves when coat on)
 * - Hands (skin tone)
 * - Legs + shoes (visible when looking down)
 * - Held item in right hand
 *
 * Parented to camera, positioned slightly below + forward.
 * Uses depthTest=false so body always renders on top of scene.
 */
export function PlayerBody() {
  const groupRef = useRef<THREE.Group>(null);
  const coatOn = usePlayerStore((s) => s.ppe.coat);
  const gogglesOn = usePlayerStore((s) => s.ppe.goggles);
  const glovesOn = usePlayerStore((s) => s.ppe.gloves);
  const heldItem = usePlayerStore((s) => s.heldItem);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);
    groupRef.current.translateY(-0.15);
  });

  const coatColor = "#f4f5f7";
  const shirtColor = "#2c3e50";
  const skinColor = "#e8b894";
  const gloveColor = "#1a3a5c"; // blue nitrile gloves

  return (
    <group ref={groupRef} renderOrder={999}>
      {/* === TORSO === */}
      <mesh position={[0, -0.55, -0.12]} renderOrder={999}>
        <boxGeometry args={[0.44, 0.62, 0.26]} />
        <meshStandardMaterial
          color={coatOn ? coatColor : shirtColor}
          roughness={coatOn ? 0.85 : 0.7}
          metalness={0}
          depthTest={false}
        />
      </mesh>

      {/* Coat collar (when coat on) */}
      {coatOn && (
        <mesh position={[0, -0.28, -0.18]} renderOrder={999}>
          <boxGeometry args={[0.3, 0.06, 0.04]} />
          <meshStandardMaterial color={coatColor} roughness={0.85} depthTest={false} />
        </mesh>
      )}

      {/* Coat lapels (V-shape, when coat on) */}
      {coatOn && (
        <>
          <mesh position={[-0.09, -0.34, -0.01]} rotation={[0.2, 0, 0.15]} renderOrder={999}>
            <boxGeometry args={[0.1, 0.22, 0.02]} />
            <meshStandardMaterial color={coatColor} roughness={0.85} depthTest={false} />
          </mesh>
          <mesh position={[0.09, -0.34, -0.01]} rotation={[0.2, 0, -0.15]} renderOrder={999}>
            <boxGeometry args={[0.1, 0.22, 0.02]} />
            <meshStandardMaterial color={coatColor} roughness={0.85} depthTest={false} />
          </mesh>
        </>
      )}

      {/* Coat buttons (when coat on) */}
      {coatOn && (
        <>
          {[-0.42, -0.52, -0.62, -0.72].map((y, i) => (
            <mesh key={i} position={[0, y, 0.01]} renderOrder={999}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial color="#d0d0d0" roughness={0.3} metalness={0.5} depthTest={false} />
            </mesh>
          ))}
        </>
      )}

      {/* Shirt visible at neck (when coat on) */}
      {coatOn && (
        <mesh position={[0, -0.22, -0.1]} renderOrder={999}>
          <boxGeometry args={[0.12, 0.06, 0.02]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} depthTest={false} />
        </mesh>
      )}

      {/* === LEFT ARM (sleeve + hand) === */}
      {/* Upper arm */}
      <mesh position={[-0.28, -0.48, -0.18]} rotation={[0.6, 0, 0.25]} renderOrder={999}>
        <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? coatColor : shirtColor}
          roughness={coatOn ? 0.85 : 0.7}
          depthTest={false}
        />
      </mesh>
      {/* Forearm */}
      <mesh position={[-0.34, -0.6, -0.32]} rotation={[0.8, 0, 0.2]} renderOrder={999}>
        <capsuleGeometry args={[0.05, 0.15, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? coatColor : shirtColor}
          roughness={coatOn ? 0.85 : 0.7}
          depthTest={false}
        />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.36, -0.68, -0.4]} renderOrder={999}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color={glovesOn ? gloveColor : skinColor}
          roughness={glovesOn ? 0.4 : 0.6}
          depthTest={false}
        />
      </mesh>

      {/* === RIGHT ARM (sleeve + hand, may hold item) === */}
      <mesh position={[0.28, -0.48, -0.18]} rotation={[0.6, 0, -0.25]} renderOrder={999}>
        <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? coatColor : shirtColor}
          roughness={coatOn ? 0.85 : 0.7}
          depthTest={false}
        />
      </mesh>
      <mesh position={[0.34, -0.6, -0.32]} rotation={[0.8, 0, -0.2]} renderOrder={999}>
        <capsuleGeometry args={[0.05, 0.15, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? coatColor : shirtColor}
          roughness={coatOn ? 0.85 : 0.7}
          depthTest={false}
        />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.36, -0.68, -0.4]} renderOrder={999}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color={glovesOn ? gloveColor : skinColor}
          roughness={glovesOn ? 0.4 : 0.6}
          depthTest={false}
        />
      </mesh>

      {/* === GOGGLES (visible at top of view when on) === */}
      {gogglesOn && (
        <mesh position={[0, 0.02, -0.12]} rotation={[0.2, 0, 0]} renderOrder={1000}>
          <boxGeometry args={[0.22, 0.06, 0.08]} />
          <meshPhysicalMaterial
            color="#1a1a2e"
            transparent
            opacity={0.5}
            roughness={0.05}
            transmission={0.7}
            ior={1.5}
            depthTest={false}
          />
        </mesh>
      )}

      {/* === HELD ITEM (bottle in right hand) === */}
      {heldItem && heldItem.type === "chemical" && (
        <group position={[0.36, -0.58, -0.48]} rotation={[0.3, 0, 0]} renderOrder={1000}>
          {/* Bottle body */}
          <mesh renderOrder={1000}>
            <cylinderGeometry args={[0.035, 0.04, 0.14, 12]} />
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
          <mesh position={[0, -0.015, 0]} renderOrder={1000}>
            <cylinderGeometry args={[0.03, 0.035, 0.09, 12]} />
            <meshStandardMaterial
              color="#4488cc"
              transparent
              opacity={0.7}
              depthTest={false}
            />
          </mesh>
          {/* Bottle neck */}
          <mesh position={[0, 0.085, 0]} renderOrder={1000}>
            <cylinderGeometry args={[0.02, 0.025, 0.03, 8]} />
            <meshPhysicalMaterial color="#a8c8e0" transparent opacity={0.3} transmission={0.7} depthTest={false} />
          </mesh>
          {/* Cap */}
          <mesh position={[0, 0.11, 0]} renderOrder={1000}>
            <cylinderGeometry args={[0.022, 0.022, 0.025, 8]} />
            <meshStandardMaterial color="#cc4444" roughness={0.4} depthTest={false} />
          </mesh>
        </group>
      )}

      {/* === LEGS (visible when looking down) === */}
      <mesh position={[-0.1, -0.95, -0.05]} renderOrder={998}>
        <capsuleGeometry args={[0.065, 0.42, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? "#3a3f4b" : "#1a2030"}
          roughness={0.8}
          depthTest={false}
        />
      </mesh>
      <mesh position={[0.1, -0.95, -0.05]} renderOrder={998}>
        <capsuleGeometry args={[0.065, 0.42, 4, 8]} />
        <meshStandardMaterial
          color={coatOn ? "#3a3f4b" : "#1a2030"}
          roughness={0.8}
          depthTest={false}
        />
      </mesh>

      {/* === SHOES === */}
      <mesh position={[-0.1, -1.18, 0.0]} renderOrder={998}>
        <boxGeometry args={[0.1, 0.06, 0.22]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} depthTest={false} />
      </mesh>
      <mesh position={[0.1, -1.18, 0.0]} renderOrder={998}>
        <boxGeometry args={[0.1, 0.06, 0.22]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} depthTest={false} />
      </mesh>

      {/* === COAT TAIL (below legs, when coat on) === */}
      {coatOn && (
        <mesh position={[0, -0.9, -0.15]} renderOrder={997}>
          <boxGeometry args={[0.42, 0.35, 0.08]} />
          <meshStandardMaterial color={coatColor} roughness={0.85} depthTest={false} />
        </mesh>
      )}
    </group>
  );
}
