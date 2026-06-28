"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
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
  RealBunsenBurner,
  RealBeaker,
  RealReagentBottle,
  RealAnalyticalBalance,
  RealHotPlate,
  RealRingStand,
  RealSafetyCabinet,
  RealLabCoat,
  RealBurette,
  RealCentrifuge,
  RealDesiccator,
} from "./RealModels";
import { preloadAllModels } from "./RealModels";
import { ChemicalShelfRack } from "./ChemicalShelfRack";

function SceneContents() {
  const containers = useLabStore((s) => s.containers);
  const shelfChemicals = usePlayerStore((s) => s.shelfChemicals);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);

  return (
    <>
      {/* === FURNITURE (real models) === */}

      {/* Real models on bench */}
      {containers.map((c) => (
        <RealBeaker key={c.id} container={c} />
      ))}

      {/* Bunsen burner */}
      <RealBunsenBurner position={[-2.5, 1.0, 0.3]} />

      {/* Analytical balance */}
      <RealAnalyticalBalance position={[2.5, 1.0, 0.5]} />

      {/* Hot plate */}
      <RealHotPlate position={[-2.5, 1.0, -0.3]} />

      {/* Ring stand */}
      <RealRingStand position={[2.5, 1.0, -0.5]} />

      {/* Burette on ring stand */}
      <RealBurette position={[2.5, 1.5, -0.3]} />

      {/* Centrifuge */}
      <RealCentrifuge position={[3, 1.0, -0.5]} />

      {/* Desiccator */}
      <RealDesiccator position={[-2, 1.0, -0.5]} />

      {/* Safety cabinet (yellow) */}
      <RealSafetyCabinet position={[-7, 0, -2]} />

      {/* Lab coat on wall */}
      <RealLabCoat position={[-6, 1.0, 4.5]} />

      {/* Chemical bottles on shelf */}
      <ChemicalShelfRack />
    </>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.8} color="#ffffff" />
      <directionalLight
        position={[0, 10, 0]}
        intensity={1.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={-10}
        shadow-camera-bottom={10}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[8, 4, 0]} intensity={0.3} color="#aaccff" />
      <directionalLight position={[-8, 4, 0]} intensity={0.2} color="#ffd4a0" />
      <pointLight position={[0, 2.5, 0]} intensity={0.3} color="#ffffff" distance={6} />
    </>
  );
}

export function FirstPersonScene({
  onInteract,
}: {
  onInteract?: (interactable: Interactable) => void;
}) {
  // Preload all models on mount
  useEffect(() => {
    preloadAllModels();
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
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
        <Environment preset="studio" />
      </Suspense>
      <FirstPersonController />
      <InteractionSystem onInteract={onInteract} />
      <PlayerBody />
    </Canvas>
  );
}
