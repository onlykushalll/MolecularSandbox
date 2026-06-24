"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Suspense } from "react";
import { FirstPersonController } from "./FirstPersonController";
import { InteractionSystem } from "./InteractionSystem";
import { PlayerBody } from "./PlayerBody";
import { LabRoom } from "./LabRoom";
import { LabFurniture } from "./LabFurniture";
import { BenchBeaker } from "./BenchBeaker";
import { ChemicalShelfRack } from "./ChemicalShelfRack";
import { BenchBunsenBurner } from "./BenchBunsenBurner";
import { useLabStore } from "@/lib/store/lab-store";
import type { Interactable } from "@/lib/store/player-store";

function SceneContents() {
  const containers = useLabStore((s) => s.containers);
  return (
    <>
      <LabFurniture />
      {/* Beakers on main bench */}
      {containers.map((c) => (
        <BenchBeaker key={c.id} container={c} />
      ))}
      {/* Chemical bottles on shelf */}
      <ChemicalShelfRack />
      {/* Bunsen burner on main bench */}
      <BenchBunsenBurner position={[-2.5, 0.99, 0.3]} />
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
      <pointLight position={[-6, 2.5, -3.9]} intensity={0.2} color="#ffffff" distance={4} />
    </>
  );
}

export function FirstPersonScene({
  onInteract,
}: {
  onInteract?: (interactable: Interactable) => void;
}) {
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
