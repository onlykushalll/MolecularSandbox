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
  RealFumeHood, RealLabBench, RealStorageCabinet, RealSafetyCabinet,
  RealSink, RealBunsenBurner, RealHotPlate, RealAnalyticalBalance,
  RealMicroscope, RealSpectrophotometer, RealCentrifuge, RealRingStand,
  RealBurette, RealDesiccator, RealMortarPestle, RealGasCylinder,
  RealFireExtinguisher, RealFireBlanket, RealFirstAidKit, RealEmergencyShower,
  RealSharpsContainer, RealGloveBox, RealLabCoat, RealGoggles, RealWarningSigns,
  RealWhiteboard, RealPeriodicTable, RealWallClock, RealBookshelf, RealBookStack,
  RealPlant, RealLabChair, RealOfficeChair, RealTrashBin, RealOrderTerminal,
  RealDoor, RealWindow3D, RealCeilingLights, RealTestTubeRack,
  RealGraduatedCylinder, RealFunnel, RealPipette, RealStopwatch,
  RealThermometer, RealPHMeter, RealBeaker, RealReagentBottle,
  preloadAllModels,
} from "./RealModels";
import { ChemicalShelfRack } from "./ChemicalShelfRack";

function SceneContents() {
  const containers = useLabStore((s) => s.containers);

  return (
    <>
      {/* === FURNITURE (real models) === */}
      <RealFumeHood />
      <RealLabBench position={[0, 0, 0]} />
      <RealStorageCabinet position={[7, 0, -2.5]} />
      <RealSafetyCabinet position={[-7, 0, -2]} />
      <RealSink position={[-7.3, 0, 5]} />

      {/* === BENCH EQUIPMENT (real models) === */}
      {containers.map((c) => (
        <RealBeaker key={c.id} container={c} />
      ))}
      <RealBunsenBurner position={[-1.0, 1.0, 0.3]} />
      <RealHotPlate position={[-2.5, 1.0, -0.3]} />
      <RealAnalyticalBalance position={[2.5, 1.0, 0.5]} />
      <RealMicroscope position={[-2.5, 1.0, 0.5]} />
      <RealSpectrophotometer position={[3, 1.0, 0]} />
      <RealCentrifuge position={[3.5, 1.0, -0.5]} />
      <RealRingStand position={[2.5, 1.0, -0.5]} />
      <RealBurette position={[2.5, 1.5, -0.3]} />
      <RealDesiccator position={[-2, 1.0, -0.5]} />
      <RealMortarPestle position={[1.5, 1.0, 0.5]} />
      <RealTestTubeRack position={[1.5, 1.0, -0.3]} />
      <RealGraduatedCylinder position={[-1.5, 1.0, 0.5]} />
      <RealFunnel position={[1.0, 1.0, -0.3]} />
      <RealPipette position={[-1.0, 1.0, 0.5]} />
      <RealStopwatch position={[2.0, 1.0, 0.3]} />
      <RealThermometer position={[-3.0, 1.0, 0.5]} />
      <RealPHMeter position={[-3.5, 1.0, 0.5]} />

      {/* === SAFETY EQUIPMENT === */}
      <RealFireExtinguisher position={[4.5, 0, 5.5]} />
      <RealFireBlanket position={[-5, 1.5, 5.89]} />
      <RealFirstAidKit position={[-5.5, 1.5, 5.89]} />
      <RealEmergencyShower position={[-7, 0, 3]} />
      <RealSharpsContainer position={[3, 1.0, 5.5]} />
      <RealGloveBox position={[-6, 1.0, 4.3]} />
      <RealLabCoat position={[-6.5, 1.0, 4.5]} />
      <RealGoggles position={[-5.5, 1.0, 4.3]} />
      <RealWarningSigns position={[0, 2.5, -5.8]} />

      {/* === DECOR === */}
      <RealWhiteboard position={[7.89, 1.6, -1]} />
      <RealPeriodicTable position={[-7.89, 1.8, 2]} />
      <RealWallClock position={[5, 2.7, -5.89]} />
      <RealBookshelf position={[-7.5, 0, -3]} />
      <RealBookStack position={[-5, 1.0, -3.85]} />
      <RealPlant position={[7.2, 0, 5.2]} />
      <RealLabChair position={[2.5, 0, 1.5]} />
      <RealOfficeChair position={[6, 0, 5]} />
      <RealTrashBin position={[5, 0, 5.5]} />
      <RealGasCylinder position={[-6, 0, -4]} />

      {/* === ELECTRONICS === */}
      <RealOrderTerminal position={[6, 1.0, 4.5]} />

      {/* === ROOM === */}
      <RealDoor position={[2, 0, 5.8]} />
      <RealWindow3D position={[7.8, 1.5, 1.5]} />
      <RealCeilingLights />

      {/* === CHEMICAL BOTTLES ON SHELF === */}
      <ChemicalShelfRack />
    </>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.8} color="#ffffff" />
      <directionalLight position={[0, 10, 0]} intensity={1.0} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10}
        shadow-camera-top={-10} shadow-camera-bottom={10} shadow-bias={-0.0001} />
      <directionalLight position={[8, 4, 0]} intensity={0.3} color="#aaccff" />
      <directionalLight position={[-8, 4, 0]} intensity={0.2} color="#ffd4a0" />
      <pointLight position={[0, 2.5, 0]} intensity={0.3} color="#ffffff" distance={6} />
    </>
  );
}

export function FirstPersonScene({ onInteract }: { onInteract?: (interactable: Interactable) => void }) {
  useEffect(() => { preloadAllModels(); }, []);

  return (
    <Canvas shadows dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
      camera={{ position: [0, 1.7, 4], fov: 70, near: 0.05, far: 100 }}
      style={{ background: "#0a0e14" }}>
      <Lighting />
      <Suspense fallback={null}>
        <LabRoom />
        <SceneContents />
        <ContactShadows position={[0, 0.01, 0]} opacity={0.3} scale={20} blur={3} far={4} color="#000000" />
        <Environment preset="studio" />
      </Suspense>
      <FirstPersonController />
      <InteractionSystem onInteract={onInteract} />
      <PlayerBody />
    </Canvas>
  );
}
