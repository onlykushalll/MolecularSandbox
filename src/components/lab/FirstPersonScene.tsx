"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";

import * as THREE from "three";
import { Suspense, useEffect } from "react";
import { FirstPersonController } from "./FirstPersonController";
import { InteractionSystem } from "./InteractionSystem";
import { PlayerBody } from "./PlayerBody";
import { LabRoom } from "./LabRoom";
import { useLabStore } from "@/lib/store/lab-store";
import { usePlayerStore } from "@/lib/store/player-store";
import type { Interactable } from "@/lib/store/player-store";

// Real model components
import {
  RealFumeHood, RealLabBench, RealBunsenBurner, RealBeaker,
  RealReagentBottle, RealAnalyticalBalance, RealHotPlate, RealRingStand,
  RealSafetyCabinet, RealLabCoat, RealBurette, RealCentrifuge, RealDesiccator,
  preloadAllModels,
} from "./RealModels";
import { ChemicalShelfRack } from "./ChemicalShelfRack";

function SceneContents() {
  const containers = useLabStore((s) => s.containers);

  return (
    <>
      {/* === FURNITURE === */}
      <RealFumeHood />
      <RealLabBench position={[0, 0, 0]} />
      <RealSafetyCabinet position={[-7, 0, -2]} />

      {/* === BENCH EQUIPMENT === */}
      {containers.map((c) => (
        <RealBeaker key={c.id} container={c} />
      ))}
      <RealBunsenBurner position={[-1.0, 1.0, 0.3]} />
      <RealHotPlate position={[-2.5, 1.0, -0.3]} />
      <RealAnalyticalBalance position={[2.5, 1.0, 0.5]} />
      <RealRingStand position={[2.5, 1.0, -0.5]} />
      <RealBurette position={[2.5, 1.5, -0.3]} />
      <RealCentrifuge position={[3, 1.0, -0.5]} />
      <RealDesiccator position={[-2, 1.0, -0.5]} />

      {/* === SAFETY === */}
      <RealLabCoat position={[-6.5, 1.0, 4.5]} />

      {/* === CHEMICAL BOTTLES === */}
      <ChemicalShelfRack />
    </>
  );
}

function Lighting() {
  return (
    <>
      {/* Soft ambient — base illumination */}
      <ambientLight intensity={0.6} color="#f0f4f8" />

      {/* Main overhead — even coverage from ceiling */}
      <directionalLight
        position={[0, 10, 0]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={-10}
        shadow-camera-bottom={10}
        shadow-bias={-0.0001}
        color="#f0f4f8"
      />

      {/* Fill lights — cool blue from window side */}
      <directionalLight position={[8, 4, 0]} intensity={0.25} color="#c4d8e8" />

      {/* Warm fill — from door side */}
      <directionalLight position={[-4, 3, 6]} intensity={0.15} color="#fff0d8" />

      {/* Central warm point light — for bench area */}
      <pointLight position={[0, 2.5, 0]} intensity={0.25} color="#ffffff" distance={8} />
    </>
  );
}

export function FirstPersonScene({ onInteract }: { onInteract?: (interactable: Interactable) => void }) {
  useEffect(() => { preloadAllModels(); }, []);

  return (
    <Canvas
      shadows={false}
      dpr={[0.5, 1]}
      gl={{
        antialias: false,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "low-power",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
      camera={{ position: [0, 1.7, 4], fov: 70, near: 0.05, far: 100 }}
      style={{ background: "#0a0e14" }}
    >
      <Lighting />
      <Suspense fallback={null}>
        <LabRoom />
        <SceneContents />
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.3}
          scale={20}
          blur={3}
          far={4}
          color="#000000"
        />
      </Suspense>

      {/* Post-processing — disabled for now (causes WebGL context loss with many models) */}
      {/* TODO: Re-enable after Draco compression reduces model sizes */}

      <FirstPersonController />
      <InteractionSystem onInteract={onInteract} />
      <PlayerBody />
    </Canvas>
  );
}
