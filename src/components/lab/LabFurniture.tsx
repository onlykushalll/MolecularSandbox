"use client";

import { Edges, Html } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useEffect } from "react";
import {
  usePlayerStore,
  type Interactable,
} from "@/lib/store/player-store";
import { InteractableMesh } from "./InteractableMesh";

/**
 * LabFurniture — all the fixed furniture in the lab
 *
 * - Main workbench (center) with 3 beaker positions
 * - Side bench (west wall) with Bunsen burner
 * - Chemical shelf cabinet (east wall) — holds bottles
 * - Fume hood (north wall) — for dangerous reactions
 * - Ordering terminal desk (south-east corner) — computer
 * - Safety station — PPE cabinet
 * - Sink (corner)
 *
 * Each interactable piece registers with the player store.
 */

export function LabFurniture() {
  return (
    <group>
      <MainBench />
      <SideBench />
      <ShelfCabinet />
      <FumeHood />
      <OrderingTerminal />
      <SafetyStation />
      <Sink />
      <Decor />
    </group>
  );
}

// === MAIN WORKBENCH (center) ===
function MainBench() {
  const interactable: Interactable = {
    id: "main-bench",
    kind: "beaker",
    label: "Main Workbench",
    position: [0, 0, 0],
    action: "Work here",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#34d399">
      {/* Benchtop */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.08, 2]} />
        <meshStandardMaterial
          color="#2a2e38"
          roughness={0.2}
          metalness={0.3}
          envMapIntensity={0.8}
        />
      </mesh>
      {/* Bench surface edge highlight */}
      <mesh position={[0, 0.99, 0]}>
        <boxGeometry args={[6.02, 0.02, 2.02]} />
        <meshStandardMaterial color="#3a3f4b" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Legs */}
      {[
        [-2.8, -0.9],
        [2.8, -0.9],
        [-2.8, 0.9],
        [2.8, 0.9],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.475, z]} castShadow>
          <boxGeometry args={[0.08, 0.95, 0.08]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* Under-bench cabinet doors */}
      <mesh position={[-1.5, 0.475, -0.95]} castShadow>
        <boxGeometry args={[2.5, 0.85, 0.03]} />
        <meshStandardMaterial color="#1f232b" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[1.5, 0.475, -0.95]} castShadow>
        <boxGeometry args={[2.5, 0.85, 0.03]} />
        <meshStandardMaterial color="#1f232b" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Cabinet handles */}
      <mesh position={[-0.5, 0.475, -0.93]}>
        <boxGeometry args={[0.02, 0.15, 0.03]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.5, 0.475, -0.93]}>
        <boxGeometry args={[0.02, 0.15, 0.03]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>
    </InteractableMesh>
  );
}

// === SIDE BENCH (west wall) ===
function SideBench() {
  const interactable: Interactable = {
    id: "side-bench",
    kind: "bunsen-burner",
    label: "Side Bench",
    position: [-6, 0, -3.9],
    action: "Work here",
  };

  return (
    <InteractableMesh interactable={interactable}>
      {/* Benchtop */}
      <mesh position={[-6, 0.95, -3.9]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.08, 0.5]} />
        <meshStandardMaterial
          color="#2a2e38"
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      {/* Legs */}
      {[
        [-7.4, -4.1],
        [-4.6, -4.1],
        [-7.4, -3.7],
        [-4.6, -3.7],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.475, z]} castShadow>
          <boxGeometry args={[0.08, 0.95, 0.08]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </InteractableMesh>
  );
}

// === CHEMICAL SHELF CABINET (east wall) ===
function ShelfCabinet() {
  const interactable: Interactable = {
    id: "shelf-cabinet",
    kind: "storage-shelf",
    label: "Chemical Storage",
    position: [7, 0, -2.5],
    action: "Browse chemicals",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      {/* Cabinet frame */}
      <mesh position={[7, 1.2, -2.5]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 2.4, 3]} />
        <meshStandardMaterial color="#1f232b" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Shelves (3 levels) */}
      {[0.4, 1.1, 1.8].map((y, i) => (
        <mesh key={i} position={[6.6, y, -2.5]} receiveShadow>
          <boxGeometry args={[0.4, 0.04, 2.8]} />
          <meshStandardMaterial color="#2a2e38" roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      {/* Shelf labels */}
      <Html position={[6.4, 2.2, -2.5]} center distanceFactor={10} occlude>
        <div className="pointer-events-none select-none whitespace-nowrap rounded bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-300">
          CHEMICALS
        </div>
      </Html>
    </InteractableMesh>
  );
}

// === FUME HOOD (north wall) — realistic enclosure ===
function FumeHood() {
  const interactable: Interactable = {
    id: "fume-hood",
    kind: "fume-hood",
    label: "Fume Hood",
    position: [0, 0, -5],
    action: "Use fume hood (dangerous reactions)",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#ef4444">
      <group>
        {/* === Base cabinet (below the hood) === */}
        <mesh position={[0, 0.45, -5]} castShadow receiveShadow>
          <boxGeometry args={[4, 0.9, 1]} />
          <meshStandardMaterial color="#dfe3e8" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Cabinet doors */}
        <mesh position={[-1, 0.45, -4.49]}>
          <boxGeometry args={[1.8, 0.8, 0.02]} />
          <meshStandardMaterial color="#c8ccd2" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[1, 0.45, -4.49]}>
          <boxGeometry args={[1.8, 0.8, 0.02]} />
          <meshStandardMaterial color="#c8ccd2" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Cabinet handles */}
        <mesh position={[-0.2, 0.45, -4.47]}>
          <boxGeometry args={[0.02, 0.15, 0.03]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.2, 0.45, -4.47]}>
          <boxGeometry args={[0.02, 0.15, 0.03]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* === Hood superstructure (above base) === */}
        {/* Side panels (left + right) */}
        <mesh position={[-1.95, 1.7, -5]} castShadow receiveShadow>
          <boxGeometry args={[0.1, 1.6, 1]} />
          <meshStandardMaterial color="#e8ebef" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[1.95, 1.7, -5]} castShadow receiveShadow>
          <boxGeometry args={[0.1, 1.6, 1]} />
          <meshStandardMaterial color="#e8ebef" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Back panel */}
        <mesh position={[0, 1.7, -5.45]} receiveShadow>
          <boxGeometry args={[4, 1.6, 0.05]} />
          <meshStandardMaterial color="#d0d4da" roughness={0.5} metalness={0.1} />
        </mesh>
        {/* Top panel */}
        <mesh position={[0, 2.5, -5]} castShadow>
          <boxGeometry args={[4, 0.1, 1]} />
          <meshStandardMaterial color="#e8ebef" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* === Interior work surface === */}
        <mesh position={[0, 0.93, -5]} receiveShadow>
          <boxGeometry args={[3.8, 0.04, 0.9]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Interior back wall (white, easy to clean) */}
        <mesh position={[0, 1.7, -5.43]}>
          <boxGeometry args={[3.8, 1.5, 0.02]} />
          <meshStandardMaterial color="#f5f6f8" roughness={0.6} />
        </mesh>

        {/* === Glass sash (front, vertical sliding) === */}
        {/* Sash frame (aluminum) */}
        <mesh position={[0, 1.7, -4.52]}>
          <boxGeometry args={[3.9, 1.65, 0.04]} />
          <meshStandardMaterial color="#5a5f6b" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Sash glass (lower portion — open slot at bottom for hands) */}
        <mesh position={[0, 1.6, -4.51]}>
          <boxGeometry args={[3.7, 1.0, 0.02]} />
          <meshPhysicalMaterial
            color="#b8d4e6"
            transparent
            opacity={0.2}
            roughness={0.02}
            transmission={0.85}
            ior={1.45}
            clearcoat={1}
            clearcoatRoughness={0.01}
          />
        </mesh>
        {/* Sash handle (horizontal bar at bottom of glass) */}
        <mesh position={[0, 1.05, -4.49]}>
          <boxGeometry args={[3.7, 0.06, 0.05]} />
          <meshStandardMaterial color="#3a3f4b" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Sash handle grips */}
        <mesh position={[-1.5, 1.05, -4.46]}>
          <boxGeometry args={[0.15, 0.04, 0.04]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[1.5, 1.05, -4.46]}>
          <boxGeometry args={[0.15, 0.04, 0.04]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* === Exhaust duct on top === */}
        <mesh position={[0, 2.75, -5]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          <meshStandardMaterial color="#5a5f6b" roughness={0.5} metalness={0.6} />
        </mesh>
        {/* Duct flange */}
        <mesh position={[0, 2.6, -5]}>
          <cylinderGeometry args={[0.4, 0.4, 0.05, 16]} />
          <meshStandardMaterial color="#3a3f4b" roughness={0.5} metalness={0.7} />
        </mesh>

        {/* === Interior lighting (LED strip under top panel) === */}
        <pointLight position={[0, 2.35, -5]} intensity={0.4} color="#ffffff" distance={3} />
        {/* LED strip visible */}
        <mesh position={[0, 2.43, -5]}>
          <boxGeometry args={[3.5, 0.02, 0.05]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>

        {/* === Gas + vacuum valves on side panel === */}
        <mesh position={[-1.85, 1.4, -4.5]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
          <meshStandardMaterial color="#c0392b" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[-1.85, 1.2, -4.5]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
          <meshStandardMaterial color="#2980b9" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[-1.85, 1.0, -4.5]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
          <meshStandardMaterial color="#27ae60" roughness={0.3} metalness={0.5} />
        </mesh>

        {/* === Warning label === */}
        <Html position={[0, 2.65, -4.4]} center distanceFactor={6} occlude>
          <div className="pointer-events-none select-none whitespace-nowrap rounded border border-red-500 bg-red-950/90 px-2 py-0.5 text-[9px] font-bold text-red-300">
            ⚠ FUME HOOD — USE FOR DANGEROUS REACTIONS
          </div>
        </Html>
      </group>
    </InteractableMesh>
  );
}

// === ORDERING TERMINAL (south-east corner desk) ===
function OrderingTerminal() {
  const interactable: Interactable = {
    id: "ordering-terminal",
    kind: "ordering-terminal",
    label: "Ordering Terminal",
    position: [6, 0, 4.5],
    action: "Order chemicals",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#22d3ee">
      {/* Desk */}
      <mesh position={[6, 0.75, 4.75]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.05, 1.5]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Desk legs */}
      {[
        [5.1, 4.1],
        [6.9, 4.1],
        [5.1, 5.4],
        [6.9, 5.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.375, z]} castShadow>
          <boxGeometry args={[0.06, 0.75, 0.06]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* Monitor stand */}
      <mesh position={[6, 0.9, 4.5]} castShadow>
        <boxGeometry args={[0.1, 0.2, 0.1]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Monitor body */}
      <mesh position={[6, 1.15, 4.5]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.05]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Screen (glowing) */}
      <mesh position={[6, 1.15, 4.47]}>
        <boxGeometry args={[0.72, 0.42, 0.01]} />
        <meshStandardMaterial
          color="#0a1620"
          emissive="#0e7490"
          emissiveIntensity={0.4}
          toneMapped={false}
        />
      </mesh>
      {/* Screen glow */}
      <pointLight position={[6, 1.15, 4.3]} color="#22d3ee" intensity={0.5} distance={2} />
      {/* Terminal label */}
      <Html position={[6, 1.5, 4.3]} center distanceFactor={8} occlude>
        <div className="pointer-events-none select-none whitespace-nowrap rounded border border-cyan-500 bg-cyan-950/80 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
          💻 ORDER TERMINAL
        </div>
      </Html>
    </InteractableMesh>
  );
}

// === SAFETY STATION (PPE cabinet) ===
function SafetyStation() {
  const interactable: Interactable = {
    id: "safety-station",
    kind: "safety-station",
    label: "Safety Station",
    position: [-6, 0, 4],
    action: "Equip PPE",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#22c55e">
      {/* Cabinet body */}
      <mesh position={[-6, 1.0, 4]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 2.0, 0.5]} />
        <meshStandardMaterial color="#15803d" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Door split line */}
      <mesh position={[-6, 1.0, 4.26]}>
        <boxGeometry args={[0.02, 1.9, 0.01]} />
        <meshStandardMaterial color="#0a3f1c" roughness={0.5} />
      </mesh>
      {/* Safety cross symbol */}
      <mesh position={[-6, 1.6, 4.27]}>
        <boxGeometry args={[0.3, 0.3, 0.01]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.3}
        />
      </mesh>
      <Html position={[-6, 2.2, 4.3]} center distanceFactor={8} occlude>
        <div className="pointer-events-none select-none whitespace-nowrap rounded border border-green-500 bg-green-950/80 px-2 py-0.5 text-[9px] font-bold text-green-300">
          🦺 SAFETY
        </div>
      </Html>
    </InteractableMesh>
  );
}

// === SINK (corner) ===
function Sink() {
  const interactable: Interactable = {
    id: "sink",
    kind: "sink",
    label: "Sink",
    position: [-7.3, 0.95, 5],
    action: "Wash / get water",
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#06b6d4">
      {/* Sink basin */}
      <mesh position={[-7.3, 0.98, 5]} receiveShadow>
        <boxGeometry args={[0.8, 0.06, 0.5]} />
        <meshStandardMaterial
          color="#c0c4cc"
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      {/* Basin depression */}
      <mesh position={[-7.3, 1.0, 5]}>
        <boxGeometry args={[0.7, 0.04, 0.4]} />
        <meshStandardMaterial color="#8a8e96" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Faucet */}
      <mesh position={[-7.3, 1.15, 4.78]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
        <meshStandardMaterial color="#a0a4ac" roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Faucet handle */}
      <mesh position={[-7.3, 1.32, 4.78]}>
        <boxGeometry args={[0.12, 0.04, 0.04]} />
        <meshStandardMaterial color="#a0a4ac" roughness={0.15} metalness={0.9} />
      </mesh>
    </InteractableMesh>
  );
}

// === DECOR (microscope, books, plant, periodic table poster) ===
function Decor() {
  return (
    <group>
      {/* Microscope on main bench */}
      <group position={[-2.5, 1.0, 0.3]}>
        {/* Base */}
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.04, 0.3]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Arm */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.04, 0.3, 0.04]} />
          <meshStandardMaterial color="#2a2e38" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Eyepiece */}
        <mesh position={[0, 0.33, 0]} rotation={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
          <meshStandardMaterial color="#0a0d12" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Stage */}
        <mesh position={[0, 0.12, 0.08]} castShadow>
          <boxGeometry args={[0.15, 0.02, 0.15]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Books on side bench */}
      <mesh position={[-5, 1.0, -3.85]} castShadow>
        <boxGeometry args={[0.2, 0.05, 0.15]} />
        <meshStandardMaterial color="#8b3a3a" roughness={0.7} />
      </mesh>
      <mesh position={[-5, 1.07, -3.85]} castShadow>
        <boxGeometry args={[0.2, 0.05, 0.15]} />
        <meshStandardMaterial color="#3a5a8b" roughness={0.7} />
      </mesh>
      <mesh position={[-5, 1.14, -3.85]} castShadow>
        <boxGeometry args={[0.2, 0.05, 0.15]} />
        <meshStandardMaterial color="#3a8b5a" roughness={0.7} />
      </mesh>

      {/* Plant in corner */}
      <group position={[7.2, 0, 5.2]}>
        {/* Pot */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.4, 12]} />
          <meshStandardMaterial color="#8b5a3a" roughness={0.8} />
        </mesh>
        {/* Foliage */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshStandardMaterial color="#2d6a3e" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, 0.7, 0.05]} castShadow>
          <sphereGeometry args={[0.15, 10, 10]} />
          <meshStandardMaterial color="#3a8a4e" roughness={0.9} />
        </mesh>
      </group>

      {/* Periodic table poster on west wall */}
      <mesh position={[-7.89, 1.8, 2]} castShadow>
        <boxGeometry args={[0.02, 1.2, 1.8]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.4} />
      </mesh>
      <Html position={[-7.85, 1.8, 2]} transform distanceFactor={2.5} occlude>
        <div
          className="flex items-center justify-center bg-slate-900 p-3 text-center"
          style={{ width: "180px", height: "120px" }}
        >
          <span className="text-[10px] font-bold text-emerald-400">
            PERIODIC TABLE
          </span>
        </div>
      </Html>

      {/* Clock on north wall */}
      <mesh position={[5, 2.7, -5.89]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 24]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.4} />
      </mesh>
      <mesh position={[5, 2.7, -5.87]}>
        <cylinderGeometry args={[0.22, 0.22, 0.01, 24]} />
        <meshStandardMaterial color="#f5f6f8" roughness={0.5} />
      </mesh>

      {/* === Fire extinguisher (near door, south wall) === */}
      <group position={[4.5, 0, 5.5]}>
        {/* Body */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.55, 16]} />
          <meshStandardMaterial color="#c0392b" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Top neck */}
        <mesh position={[0, 0.68, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.08, 12]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, 0.74, 0]} castShadow>
          <boxGeometry args={[0.12, 0.03, 0.04]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Label */}
        <Html position={[0, 0.4, 0.09]} transform distanceFactor={2} occlude>
          <div className="flex flex-col items-center justify-center bg-red-700 text-white" style={{ width: "30px", height: "40px", fontSize: "4px" }}>
            <div style={{ fontSize: "8px" }}>🔥</div>
            <div style={{ fontSize: "3px", fontWeight: "bold" }}>FIRE</div>
          </div>
        </Html>
      </group>

      {/* === Eye wash station (near sink, west wall) === */}
      <group position={[-7.5, 0, 3.5]}>
        {/* Wall mount plate */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.05]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Sign */}
        <Html position={[0, 1.3, 0.04]} transform distanceFactor={2} occlude>
          <div className="flex items-center justify-center bg-green-600 text-white" style={{ width: "35px", height: "15px", fontSize: "4px", fontWeight: "bold" }}>
            EYE WASH
          </div>
        </Html>
        {/* Two nozzles */}
        <mesh position={[-0.06, 1.0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
          <meshStandardMaterial color="#c0c4cc" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0.06, 1.0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
          <meshStandardMaterial color="#c0c4cc" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Basin */}
        <mesh position={[0, 0.95, 0.15]} castShadow>
          <boxGeometry args={[0.35, 0.04, 0.2]} />
          <meshStandardMaterial color="#5a5f6b" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      {/* === Whiteboard on east wall === */}
      <mesh position={[7.89, 1.6, -1]} castShadow>
        <boxGeometry args={[0.02, 1.0, 1.5]} />
        <meshStandardMaterial color="#f8f9fa" roughness={0.3} />
      </mesh>
      <Html position={[7.85, 1.6, -1]} transform distanceFactor={2} occlude>
        <div className="bg-white p-2" style={{ width: "150px", height: "100px" }}>
          <div className="text-[6px] font-bold text-slate-800">LAB NOTES</div>
          <div className="mt-1 text-[5px] text-slate-600">
            <div>• HCl + NaOH → NaCl + H₂O</div>
            <div>• ΔT = +278°C (exothermic)</div>
            <div>• Always wear PPE!</div>
            <div>• Use fume hood for gases</div>
          </div>
        </div>
      </Html>

      {/* === Fire blanket box (near safety station) === */}
      <mesh position={[-5, 1.5, 5.89]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.04]} />
        <meshStandardMaterial color="#c0392b" roughness={0.4} metalness={0.3} />
      </mesh>
      <Html position={[-5, 1.5, 5.92]} transform distanceFactor={2} occlude>
        <div className="flex items-center justify-center bg-red-700 text-white" style={{ width: "35px", height: "35px", fontSize: "5px", fontWeight: "bold" }}>
          FIRE BLANKET
        </div>
      </Html>

      {/* === Lab stool (movable, near main bench) === */}
      <group position={[2.5, 0, 1.5]}>
        {/* Seat */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
          <meshStandardMaterial color="#2a2e38" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Post */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.55, 8]} />
          <meshStandardMaterial color="#5a5f6b" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Base (5 wheels) */}
        <mesh position={[0, 0.03, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.03, 5]} />
          <meshStandardMaterial color="#3a3f4b" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>

      {/* === Test tube rack on main bench === */}
      <group position={[2, 1.0, -0.3]}>
        {/* Rack base */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.3, 0.04, 0.08]} />
          <meshStandardMaterial color="#3a3f4b" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Top rack with holes */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.3, 0.03, 0.08]} />
          <meshStandardMaterial color="#3a3f4b" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Test tubes (3) */}
        {[-0.08, 0, 0.08].map((x, i) => (
          <group key={i} position={[x, 0.05, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.012, 0.01, 0.15, 8]} />
              <meshPhysicalMaterial color="#e8f5f4" transparent opacity={0.3} transmission={0.8} ior={1.5} roughness={0.05} />
            </mesh>
            {/* Liquid in tube */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.01, 0.009, 0.06, 8]} />
              <meshStandardMaterial
                color={["#4488cc", "#cc4444", "#44cc44"][i]}
                transparent
                opacity={0.7}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
