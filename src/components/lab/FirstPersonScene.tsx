"use client";

import { Canvas } from "@react-three/fiber";

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
  RealTestTubeRack, RealGraduatedCylinder, RealFunnel, RealWashBottle,
  RealMechanicalPipette, RealButchnerFunnel, RealSeparatoryFunnel,
  RealFireExtinguisher, RealFireBlanket, RealSharpsContainer, RealGloveBox, RealSafetyGoggles,
  RealMicroscope, RealPHMeter, RealFeverThermometer, RealLaserThermometer, RealStopwatch,
  RealMortarPestle, RealTripodStand,
  RealPlant, RealWallClock, RealPeriodicTable, RealBookshelf, RealNotepad, RealPen, RealPencil, RealRuler,
  RealWashBasin, RealLabChair, RealOfficeChair, RealStorageCabinet, RealTrashBin, RealWoodenSpatula,
  RealErlenmeyerFlask, RealFlorenceFlask, RealRoundBottomFlask, RealFilterFlask, RealCondenser,
  RealOrderingTerminal, RealGasCylinder, RealPetriDishes, RealFirstAidKit, RealSerumBottle,
  RealVolumetricFlasks, RealWarningSign, RealCrucibleTongs, RealGlassPipette,
  RealSpectrophotometer, RealWhiteboard, RealBottleWithDropper, RealCO2Extinguisher,
  preloadAllModels,
} from "./RealModels";
import { ChemicalShelfRack } from "./ChemicalShelfRack";

function SceneContents() {
  const containers = useLabStore((s) => s.containers);

  // Real lab layout reference:
  // Room: 16m(X) x 12m(Z) x 3.2m(Y). Origin at center of floor.
  // X range: -8 to +8. Z range: -6 to +6.
  //
  // ZONE MAP (top-down, north=negative Z):
  //   North wall (Z≈-5.5): Fume hood center, instrumentation bench sides
  //   West wall  (X≈-7):   Safety station, storage, gas, wash basin
  //   East wall  (X≈+7):   Window, bookshelf, periodic table, terminal
  //   South wall (Z≈+5.5): Door, safety equipment near exit
  //   Center:              Two island benches with 1.5m aisle between
  //     Bench A (Z≈-1.5): Main wet bench — heating, reactions, glassware
  //     Bench B (Z≈+1.8): Prep/analysis bench — measuring, writing, small items
  //
  // Standard bench height: ~0.9m. Items on bench surfaces at Y≈0.92.

  const BT = 0.92; // bench-top Y

  return (
    <>
      {/* === FURNITURE — two island benches + wall bench + fume hood === */}
      <RealFumeHood />
      <RealLabBench position={[0, 0, -1.5]} />
      <RealLabBench position={[0, 0, 1.8]} />
      <RealSafetyCabinet position={[-7, 0, -2]} />

      {/* North wall bench (instrumentation) — procedural counter */}
      <mesh position={[-1, 0.45, -4.8]}>
        <boxGeometry args={[8, 0.9, 0.7]} />
        <meshStandardMaterial color="#5c6370" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* West wall counter (safety supplies) — procedural */}
      <mesh position={[-7.2, 0.45, 1.5]}>
        <boxGeometry args={[0.7, 0.9, 4]} />
        <meshStandardMaterial color="#5c6370" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* === BEAKERS — on main bench === */}
      {containers.map((c) => (
        <RealBeaker key={c.id} container={c} />
      ))}

      {/* === BENCH A (Z≈-1.5): Heating + reaction zone === */}
      <RealBunsenBurner position={[-1.0, BT, -1.3]} />
      <RealHotPlate position={[-2.2, BT, -1.7]} />
      <RealTripodStand position={[-0.5, BT, -1.5]} />
      <RealCrucibleTongs position={[-1.5, BT, -1.1]} />
      <RealDesiccator position={[-3.0, BT, -1.5]} />
      <RealCondenser position={[-2.8, BT, -1.9]} />
      <RealButchnerFunnel position={[1.0, BT, -1.7]} />
      <RealSeparatoryFunnel position={[1.5, BT, -1.7]} />
      <RealRingStand position={[2.0, BT, -1.5]} />
      <RealBurette position={[2.0, BT + 0.5, -1.3]} />
      <RealTestTubeRack position={[0.3, BT, -1.2]} />
      <RealErlenmeyerFlask position={[3.0, BT, -1.3]} />
      <RealFlorenceFlask position={[3.4, BT, -1.5]} />
      <RealRoundBottomFlask position={[3.8, BT, -1.4]} />
      <RealFilterFlask position={[1.3, BT, -1.2]} />

      {/* === BENCH B (Z≈+1.8): Prep/analysis/measurement zone === */}
      <RealAnalyticalBalance position={[-2.0, BT, 2.0]} />
      <RealGraduatedCylinder position={[-1.2, BT, 1.8]} />
      <RealFunnel position={[-0.6, BT, 2.0]} />
      <RealWashBottle position={[0.0, BT, 1.6]} />
      <RealMechanicalPipette position={[0.5, BT, 2.0]} />
      <RealGlassPipette position={[0.9, BT, 1.8]} />
      <RealWoodenSpatula position={[1.3, BT, 2.0]} />
      <RealPetriDishes position={[1.8, BT, 1.7]} />
      <RealSerumBottle position={[2.2, BT, 2.0]} />
      <RealBottleWithDropper position={[2.5, BT, 1.9]} />
      <RealVolumetricFlasks position={[2.8, BT, 1.8]} />
      <RealNotepad position={[3.5, BT, 2.0]} />
      <RealPen position={[3.7, BT, 1.9]} />
      <RealPencil position={[3.9, BT, 2.0]} />
      <RealRuler position={[3.3, BT, 1.7]} />
      <RealMortarPestle position={[-2.8, BT, 1.8]} />

      {/* === NORTH WALL (Z≈-5): Instrumentation zone === */}
      <RealMicroscope position={[-4.5, BT, -4.5]} />
      <RealPHMeter position={[-3.5, BT, -4.5]} />
      <RealFeverThermometer position={[-2.8, BT, -4.7]} />
      <RealLaserThermometer position={[-2.0, BT, -4.7]} />
      <RealStopwatch position={[-3.8, BT, -4.2]} />
      <RealCentrifuge position={[3.0, BT, -4.5]} />
      <RealSpectrophotometer position={[1.5, BT, -4.5]} />
      <RealWhiteboard position={[0, 1.6, -5.85]} />

      {/* === WEST WALL (X≈-7): Safety corridor === */}
      <RealFireExtinguisher position={[-7, 0, 3.5]} />
      <RealFireBlanket position={[-7, 1.4, 4.0]} />
      <RealSharpsContainer position={[-6.8, BT, 1.0]} />
      <RealGloveBox position={[-6.8, 1.3, 2.0]} />
      <RealSafetyGoggles position={[-6.3, BT, 2.5]} />
      <RealLabCoat position={[-6.5, 1.0, 4.5]} />
      <RealFirstAidKit position={[-6.8, 1.3, 4.3]} />
      <RealCO2Extinguisher position={[-7, 0, 4.8]} />
      <RealWashBasin position={[-7.5, 0, 0]} />
      <RealStorageCabinet position={[-7.5, 0, -4.5]} />
      <RealGasCylinder position={[-6, 0, -3.5]} />
      <RealTrashBin position={[-5.5, 0, 3.0]} />

      {/* === EAST WALL (X≈+7): Reference / admin zone === */}
      <RealBookshelf position={[7.5, 0, -3.5]} />
      <RealPeriodicTable position={[7.9, 1.6, 0]} />
      <RealOrderingTerminal position={[6, 0, 3]} />
      <RealPlant position={[7.0, 0, 5.0]} />

      {/* === SOUTH WALL (Z≈+5.5): Entry zone === */}
      <RealWallClock position={[0, 2.2, 5.9]} />
      <RealWarningSign position={[-1.5, 1.8, 5.9]} />

      {/* === SEATING === */}
      <RealLabChair position={[0, 0, 0]} />
      <RealOfficeChair position={[5.5, 0, 3.5]} />

      {/* === CHEMICAL BOTTLES === */}
      <ChemicalShelfRack />
    </>
  );
}

function Lighting() {
  return (
    <>
      <hemisphereLight args={["#e8eef5", "#4b5563", 0.7]} />
      <ambientLight intensity={0.3} color="#f0f4f8" />
      <directionalLight position={[2, 8, 1]} intensity={0.6} color="#f0f4f8" />
      <directionalLight position={[8, 4, 0]} intensity={0.2} color="#c4d8e8" />
      <directionalLight position={[-4, 3, 6]} intensity={0.1} color="#fff0d8" />
    </>
  );
}

export function FirstPersonScene({ onInteract }: { onInteract?: (interactable: Interactable) => void }) {
  useEffect(() => { preloadAllModels(); }, []);

  return (
    <Canvas
      shadows={false}
      dpr={[0.75, 1]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "low-power",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
      camera={{ position: [0, 1.7, 4], fov: 70, near: 0.05, far: 50 }}
      style={{ background: "#0a0e14" }}
    >
      <Lighting />
      <Suspense fallback={null}>
        <LabRoom />
        <SceneContents />
      </Suspense>

      <FirstPersonController />
      <InteractionSystem onInteract={onInteract} />
      <PlayerBody />
    </Canvas>
  );
}
