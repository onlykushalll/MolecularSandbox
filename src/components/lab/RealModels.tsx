"use client";

import { useRef, useMemo, Suspense, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html, Edges, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import {
  usePlayerStore,
  type Interactable,
} from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { InteractableMesh } from "./InteractableMesh";
import { mixHexColors } from "@/lib/chemistry/mixture";

// ============================================
// Model wrapper — loads .glb, auto-centers/scales
// ============================================
function Model({
  url,
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  scale = 1,
  castShadow = true,
  receiveShadow = true,
}: {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? scale / maxDim : scale;
    clone.position.sub(center.multiplyScalar(s));
    clone.scale.setScalar(s);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });
    return clone;
  }, [scene, scale, castShadow, receiveShadow]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={cloned} />
    </group>
  );
}

function ModelFB(props: { url: string; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  return (
    <Suspense fallback={<mesh position={props.position || [0,0,0]}><boxGeometry args={[0.05, 0.05, 0.05]} /><meshStandardMaterial color="#444" wireframe /></mesh>}>
      <Model {...props} />
    </Suspense>
  );
}

// ============================================
// FUME HOOD — real model
// ============================================
export function RealFumeHood() {
  const interactable: Interactable = {
    id: "fume-hood",
    kind: "fume-hood",
    label: "Fume Hood",
    position: [0, 0, -5],
    action: "Use fume hood",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#ef4444">
      <ModelFB url="/models/fume_cupboards.glb" position={[0, 0, -5]} scale={2.0} />
      <pointLight position={[0, 2.0, -4.8]} intensity={0.3} color="#ffffff" distance={3} />
    </InteractableMesh>
  );
}

// ============================================
// LAB BENCH — real model
// ============================================
export function RealLabBench({ position = [0, 0, 0] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "main-bench",
    kind: "beaker",
    label: "Workbench",
    position,
    action: "Work here",
  };
  return (
    <InteractableMesh interactable={interactable}>
      <ModelFB url="/models/lab_bench.glb" position={position} scale={2.5} />
    </InteractableMesh>
  );
}

// ============================================
// STORAGE CABINET — real model
// ============================================
export function RealStorageCabinet({ position = [7, 0, -2.5] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "shelf-cabinet",
    kind: "storage-shelf",
    label: "Chemical Storage",
    position,
    action: "Browse chemicals",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <ModelFB url="/models/laboratory_cabinet_storage__pbr_low_poly__free.glb" position={position} scale={1.5} />
    </InteractableMesh>
  );
}

// ============================================
// SAFETY CABINET (yellow) — real model
// ============================================
export function RealSafetyCabinet({ position = [-7, 0, -2] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "safety-cabinet",
    kind: "storage-shelf",
    label: "Flammable Storage",
    position,
    action: "Store flammables",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <ModelFB url="/models/06_safety_cabinet_yellow.glb" position={position} scale={1.0} />
    </InteractableMesh>
  );
}

// ============================================
// SINK — real model
// ============================================
export function RealSink({ position = [-7.3, 0, 5] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "sink",
    kind: "sink",
    label: "Sink",
    position,
    action: "Wash / get water",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#06b6d4">
      <ModelFB url="/models/gameready_wash_basin_model.glb" position={position} scale={0.6} />
    </InteractableMesh>
  );
}

// ============================================
// BUNSEN BURNER — real model + animated flame
// ============================================
export function RealBunsenBurner({ position = [-1.0, 1.0, 0.3] as [number, number, number] }) {
  const isOn = usePlayerStore((s) => s.bunsenOn);
  const interactable: Interactable = {
    id: "bunsen-burner",
    kind: "bunsen-burner",
    label: "Bunsen Burner",
    position,
    action: isOn ? "Turn off flame" : "Ignite flame",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <ModelFB url="/models/bunsen_burner.glb" position={position} scale={0.3} />
      {isOn && <FlameEffect position={[position[0], position[1] + 0.1, position[2]]} />}
    </InteractableMesh>
  );
}

// ============================================
// HOT PLATE — real model + heat glow + stir animation
// ============================================
export function RealHotPlate({ position = [-2.5, 1.0, -0.3] as [number, number, number] }) {
  const isOn = usePlayerStore((s) => s.hotPlateOn);
  const interactable: Interactable = {
    id: "hot-plate",
    kind: "bunsen-burner",
    label: "Hot Plate / Stirrer",
    position,
    action: isOn ? "Turn off" : "Turn on",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <ModelFB url="/models/02_hot_plate_magnetic_stirrer.glb" position={position} scale={0.2} />
      {isOn && (
        <>
          <pointLight position={[position[0], position[1] + 0.03, position[2]]} color="#ff3300" intensity={0.3} distance={0.3} />
          <mesh position={[position[0], position[1] + 0.02, position[2]]}>
            <boxGeometry args={[0.06, 0.001, 0.06]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={0.5} />
          </mesh>
        </>
      )}
    </InteractableMesh>
  );
}

// ============================================
// ANALYTICAL BALANCE — real model + LIVE mass
// ============================================
export function RealAnalyticalBalance({ position = [2.5, 1.0, 0.5] as [number, number, number] }) {
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const containers = useLabStore((s) => s.containers);
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === "analytical-balance";

  const mass = useMemo(() => {
    if (!selectedContainerId) return 0;
    const c = containers.find((c) => c.id === selectedContainerId);
    if (!c) return 0;
    return c.contents.reduce((s, cc) => s + cc.moles, 0) * 100;
  }, [selectedContainerId, containers]);

  const interactable: Interactable = {
    id: "analytical-balance",
    kind: "apparatus" as any,
    label: "Analytical Balance",
    position,
    action: `Mass: ${mass.toFixed(3)} g`,
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#22d3ee">
      <ModelFB url="/models/04_analytical_balance.glb" position={position} scale={0.25} />
      <Html position={[position[0], position[1] + 0.12, position[2]]} center distanceFactor={3} occlude>
        <div className="pointer-events-none select-none rounded bg-black/80 px-2 py-1 font-mono text-xs font-bold text-cyan-300">
          {mass.toFixed(3)} g
        </div>
      </Html>
    </InteractableMesh>
  );
}

// ============================================
// MICROSCOPE — real model
// ============================================
export function RealMicroscope({ position = [-2.5, 1.0, 0.5] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "microscope",
    kind: "apparatus" as any,
    label: "Microscope",
    position,
    action: "Look through microscope",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#22d3ee">
      <ModelFB url="/models/microscope_swift_sw380b.glb" position={position} scale={0.2} />
    </InteractableMesh>
  );
}

// ============================================
// SPECTROPHOTOMETER — real model
// ============================================
export function RealSpectrophotometer({ position = [3, 1.0, 0] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "spectrophotometer",
    kind: "apparatus" as any,
    label: "Spectrophotometer",
    position,
    action: "Measure absorbance",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#22d3ee">
      <ModelFB url="/models/spectrophotometer.glb" position={position} scale={0.3} />
    </InteractableMesh>
  );
}

// ============================================
// CENTRIFUGE — real model + spin animation
// ============================================
export function RealCentrifuge({ position = [3.5, 1.0, -0.5] as [number, number, number] }) {
  const rotorRef = useRef<THREE.Group>(null);
  const [spinning, setSpinning] = useState(false);
  const interactable: Interactable = {
    id: "centrifuge",
    kind: "apparatus" as any,
    label: "Centrifuge",
    position,
    action: spinning ? "Stop centrifuge" : "Start centrifuge",
  };

  useFrame((_, delta) => {
    if (rotorRef.current && spinning) {
      rotorRef.current.rotation.y += delta * 20;
    }
  });

  return (
    <InteractableMesh interactable={interactable} highlightColor="#22d3ee">
      <ModelFB url="/models/13_centrifuge.glb" position={position} scale={0.25} />
      {spinning && (
        <pointLight position={[position[0], position[1] + 0.1, position[2]]} color="#00ff00" intensity={0.2} distance={0.3} />
      )}
    </InteractableMesh>
  );
}

// ============================================
// RING STAND — real model
// ============================================
export function RealRingStand({ position = [2.5, 1.0, -0.5] as [number, number, number] }) {
  return <ModelFB url="/models/03_ring_retort_stand.glb" position={position} scale={0.3} />;
}

// ============================================
// BURETTE — real model
// ============================================
export function RealBurette({ position = [2.5, 1.5, -0.3] as [number, number, number] }) {
  return <ModelFB url="/models/05_burette_50ml.glb" position={position} scale={0.2} />;
}

// ============================================
// DESICCATOR — real model
// ============================================
export function RealDesiccator({ position = [-2, 1.0, -0.5] as [number, number, number] }) {
  return <ModelFB url="/models/12_desiccator.glb" position={position} scale={0.15} />;
}

// ============================================
// MORTAR AND PESTLE — real model
// ============================================
export function RealMortarPestle({ position = [1.5, 1.0, 0.5] as [number, number, number] }) {
  return <ModelFB url="/models/mortar_and_pestle.glb" position={position} scale={0.15} />;
}

// ============================================
// GAS CYLINDER — real model
// ============================================
export function RealGasCylinder({ position = [-6, 0, -4] as [number, number, number] }) {
  return <ModelFB url="/models/gas_cylinder_tank_co2_helium_nitrogen.glb" position={position} scale={0.4} />;
}

// ============================================
// FIRE EXTINGUISHER (CO2) — real model
// ============================================
export function RealFireExtinguisher({ position = [4.5, 0, 5.5] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "fire-extinguisher",
    kind: "safety-station",
    label: "Fire Extinguisher",
    position,
    action: "Grab fire extinguisher",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#ef4444">
      <ModelFB url="/models/carbon_dioxide_fire_extinguisher_-__co2.glb" position={position} scale={0.5} />
    </InteractableMesh>
  );
}

// ============================================
// FIRE BLANKET — real model
// ============================================
export function RealFireBlanket({ position = [-5, 1.5, 5.89] as [number, number, number] }) {
  return <ModelFB url="/models/fire_blanket_free_low_poly.glb" position={position} scale={0.3} />;
}

// ============================================
// FIRST AID KIT — real model
// ============================================
export function RealFirstAidKit({ position = [-5.5, 1.5, 5.89] as [number, number, number] }) {
  return <ModelFB url="/models/tactical_first_aid_kit.glb" position={position} scale={0.3} />;
}

// ============================================
// EMERGENCY SHOWER + EYE WASH — real model
// ============================================
export function RealEmergencyShower({ position = [-7, 0, 3] as [number, number, number] }) {
  return <ModelFB url="/models/emergency_shower_with_eye_wash.glb" position={position} scale={0.5} />;
}

// ============================================
// SHARPS CONTAINER — real model
// ============================================
export function RealSharpsContainer({ position = [3, 1.0, 5.5] as [number, number, number] }) {
  return <ModelFB url="/models/hospital_sharps_container.glb" position={position} scale={0.3} />;
}

// ============================================
// NITRILE GLOVE BOX — real model
// ============================================
export function RealGloveBox({ position = [-6, 1.0, 4.3] as [number, number, number] }) {
  return <ModelFB url="/models/nitrile_glove_box_v2.glb" position={position} scale={0.3} />;
}

// ============================================
// LAB COAT (hanging) — real model
// ============================================
export function RealLabCoat({ position = [-6.5, 1.0, 4.5] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "lab-coat",
    kind: "safety-station",
    label: "Lab Coat",
    position,
    action: "Put on coat",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#22c55e">
      <ModelFB url="/models/07_lab_coat_hanging.glb" position={position} scale={0.4} />
    </InteractableMesh>
  );
}

// ============================================
// SAFETY GOGGLES — real model
// ============================================
export function RealGoggles({ position = [-5.5, 1.0, 4.3] as [number, number, number] }) {
  return <ModelFB url="/models/glasses.glb" position={position} scale={0.3} />;
}

// ============================================
// WARNING SIGNS — real model
// ============================================
export function RealWarningSigns({ position = [0, 2.5, -5.8] as [number, number, number] }) {
  return <ModelFB url="/models/warning_signs__virus_laboratory.glb" position={position} scale={0.4} />;
}

// ============================================
// WHITEBOARD — real model
// ============================================
export function RealWhiteboard({ position = [7.89, 1.6, -1] as [number, number, number] }) {
  return <ModelFB url="/models/whiteboard__1_.glb" position={position} rotation={[0, -Math.PI / 2, 0]} scale={0.5} />;
}

// ============================================
// PERIODIC TABLE — real model
// ============================================
export function RealPeriodicTable({ position = [-7.89, 1.8, 2] as [number, number, number] }) {
  return <ModelFB url="/models/the_3d_periodic_table.glb" position={position} rotation={[0, Math.PI / 2, 0]} scale={0.3} />;
}

// ============================================
// WALL CLOCK — real model
// ============================================
export function RealWallClock({ position = [5, 2.7, -5.89] as [number, number, number] }) {
  return <ModelFB url="/models/wall_clock.glb" position={position} scale={0.3} />;
}

// ============================================
// BOOKSHELF — real model
// ============================================
export function RealBookshelf({ position = [-7.5, 0, -3] as [number, number, number] }) {
  return <ModelFB url="/models/bookshelf_cc0.glb" position={position} scale={0.6} />;
}

// ============================================
// BOOK STACK — real model
// ============================================
export function RealBookStack({ position = [-5, 1.0, -3.85] as [number, number, number] }) {
  return <ModelFB url="/models/book_stack.glb" position={position} scale={0.3} />;
}

// ============================================
// PLANT — real model
// ============================================
export function RealPlant({ position = [7.2, 0, 5.2] as [number, number, number] }) {
  return <ModelFB url="/models/indoor_plant.glb" position={position} scale={0.5} />;
}

// ============================================
// LAB CHAIR — real model
// ============================================
export function RealLabChair({ position = [2.5, 0, 1.5] as [number, number, number] }) {
  return <ModelFB url="/models/lab_chair.glb" position={position} scale={0.4} />;
}

// ============================================
// OFFICE CHAIR (for terminal) — real model
// ============================================
export function RealOfficeChair({ position = [6, 0, 5] as [number, number, number] }) {
  return <ModelFB url="/models/office_chair.glb" position={position} scale={0.4} />;
}

// ============================================
// TRASH BIN — real model
// ============================================
export function RealTrashBin({ position = [5, 0, 5.5] as [number, number, number] }) {
  return <ModelFB url="/models/trash_bin.glb" position={position} scale={0.3} />;
}

// ============================================
// APPLE DESKTOP (ordering terminal) — real model
// ============================================
export function RealOrderTerminal({ position = [6, 1.0, 4.5] as [number, number, number] }) {
  const interactable: Interactable = {
    id: "ordering-terminal",
    kind: "ordering-terminal",
    label: "Ordering Terminal",
    position,
    action: "Order chemicals",
  };
  return (
    <InteractableMesh interactable={interactable} highlightColor="#22d3ee">
      <ModelFB url="/models/apple_desktop.glb" position={position} scale={0.5} />
      <pointLight position={[position[0], position[1] + 0.15, position[2]]} color="#22d3ee" intensity={0.3} distance={1.5} />
    </InteractableMesh>
  );
}

// ============================================
// DOUBLE DOOR — real model
// ============================================
export function RealDoor({ position = [2, 0, 5.8] as [number, number, number] }) {
  return <ModelFB url="/models/double_door.glb" position={position} scale={1.0} />;
}

// ============================================
// WINDOW — real model
// ============================================
export function RealWindow3D({ position = [7.8, 1.5, 1.5] as [number, number, number] }) {
  return <ModelFB url="/models/window.glb" position={position} rotation={[0, -Math.PI / 2, 0]} scale={0.5} />;
}

// ============================================
// CEILING LIGHTS — real model
// ============================================
export function RealCeilingLights() {
  return (
    <>
      {[-3, 0, 3].map((x) =>
        [-3, 0, 3].map((z) => (
          <group key={`light-${x}-${z}`} position={[x, 3.1, z]}>
            <ModelFB url="/models/ceiling_light_round.glb" position={[0, 0, 0]} scale={0.3} />
            <pointLight position={[0, -0.1, 0]} intensity={0.3} color="#ffffff" distance={5} />
          </group>
        ))
      )}
    </>
  );
}

// ============================================
// TEST TUBE RACK — real model
// ============================================
export function RealTestTubeRack({ position = [1.5, 1.0, -0.3] as [number, number, number] }) {
  return <ModelFB url="/models/test_tube_rack.glb" position={position} scale={0.2} />;
}

// ============================================
// GRADUATED CYLINDER — real model
// ============================================
export function RealGraduatedCylinder({ position = [-1.5, 1.0, 0.5] as [number, number, number] }) {
  return <ModelFB url="/models/graduated_cylinder.glb" position={position} scale={0.2} />;
}

// ============================================
// FUNNEL — real model
// ============================================
export function RealFunnel({ position = [1.0, 1.0, -0.3] as [number, number, number] }) {
  return <ModelFB url="/models/cc0_-_funnel_3.glb" position={position} scale={0.15} />;
}

// ============================================
// PIPETTE — real model
// ============================================
export function RealPipette({ position = [-1.0, 1.0, 0.5] as [number, number, number] }) {
  return <ModelFB url="/models/free_pipette__laboratory__low_poly.glb" position={position} scale={0.2} />;
}

// ============================================
// STOPWATCH — real model
// ============================================
export function RealStopwatch({ position = [2.0, 1.0, 0.3] as [number, number, number] }) {
  return <ModelFB url="/models/stopwatch-284.glb" position={position} scale={0.1} />;
}

// ============================================
// THERMOMETER (fever type) — real model + liquid column
// ============================================
export function RealThermometer({ position = [-3.0, 1.0, 0.5] as [number, number, number] }) {
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const containers = useLabStore((s) => s.containers);
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === "thermometer";

  const temp = useMemo(() => {
    if (!selectedContainerId) return 25;
    const c = containers.find((c) => c.id === selectedContainerId);
    return c?.temperature || 25;
  }, [selectedContainerId, containers]);

  // Liquid column height (0-150°C → 0-1)
  const fillHeight = Math.min(1, Math.max(0, (temp - 0) / 150));
  // Color: blue cold → green → orange → red hot
  const liquidColor = temp > 80 ? "#ff3300" : temp > 50 ? "#ff8800" : temp > 25 ? "#22cc22" : "#3399ff";

  const interactable: Interactable = {
    id: "thermometer",
    kind: "apparatus" as any,
    label: "Thermometer",
    position,
    action: `Temperature: ${temp.toFixed(1)}°C`,
  };

  return (
    <InteractableMesh interactable={interactable} highlightColor="#22d3ee">
      <ModelFB url="/models/fever_thermometer.glb" position={position} scale={0.15} />
      {/* Liquid column overlay */}
      <mesh position={[position[0], position[1] + 0.02 + fillHeight * 0.08, position[2]]}>
        <cylinderGeometry args={[0.003, 0.003, fillHeight * 0.08, 8]} />
        <meshStandardMaterial color={liquidColor} emissive={liquidColor} emissiveIntensity={0.3} />
      </mesh>
      {/* Digital readout (hover only) */}
      {isHovered && (
        <Html position={[position[0], position[1] + 0.15, position[2]]} center distanceFactor={3} occlude>
          <div className="pointer-events-none select-none rounded bg-black/80 px-2 py-1 font-mono text-sm font-bold text-red-300">
            {temp.toFixed(1)}°C
          </div>
        </Html>
      )}
    </InteractableMesh>
  );
}

// ============================================
// PH METER — real model + LIVE pH display
// ============================================
export function RealPHMeter({ position = [-3.5, 1.0, 0.5] as [number, number, number] }) {
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const containers = useLabStore((s) => s.containers);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === "ph-meter";

  const ph = useMemo(() => {
    if (!selectedContainerId) return 7.0;
    const c = containers.find((c) => c.id === selectedContainerId);
    if (!c || c.contents.length === 0) return 7.0;
    // Calculate pH from contents
    const { calculatePH } = require("@/lib/chemistry/mixture");
    return calculatePH(c.contents, chemicalsMap);
  }, [selectedContainerId, containers, chemicalsMap]);

  const interactable: Interactable = {
    id: "ph-meter",
    kind: "apparatus" as any,
    label: "pH Meter",
    position,
    action: `pH: ${ph.toFixed(2)}`,
  };

  // pH color
  const phColor = ph < 3 ? "#ff0000" : ph < 6 ? "#ff8800" : ph < 8 ? "#22cc22" : ph < 11 ? "#0088ff" : "#0000ff";

  return (
    <InteractableMesh interactable={interactable} highlightColor="#22d3ee">
      <ModelFB url="/models/low_poly_digital_ph_meter.glb" position={position} scale={0.2} />
      {/* pH display */}
      <Html position={[position[0], position[1] + 0.06, position[2]]} center distanceFactor={3} occlude>
        <div className="pointer-events-none select-none rounded bg-black/90 px-2 py-0.5 font-mono text-xs font-bold" style={{ color: phColor }}>
          pH {ph.toFixed(2)}
        </div>
      </Html>
    </InteractableMesh>
  );
}

// ============================================
// BEAKER — real lathe glass + opaque liquid + effects
// ============================================
export function RealBeaker({ container }: { container: any }) {
  const heldItem = usePlayerStore((s) => s.heldItem);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === `beaker-${container.id}`;
  const isSelected = selectedContainerId === container.id;

  const interactable: Interactable = {
    id: `beaker-${container.id}`,
    kind: "beaker",
    label: `Beaker (${container.id})`,
    position: container.position,
    containerId: container.id,
    action: heldItem?.type === "chemical" ? `Pour into ${container.id}` : `Select ${container.id}`,
  };

  const { liquidColor, fillLevel, totalVolume } = useMemo(() => {
    if (container.contents.length === 0) return { liquidColor: "#a8c8e0", fillLevel: 0, totalVolume: 0 };
    const colors: { hex: string; moles: number }[] = [];
    let totalVol = 0;
    for (const cc of container.contents) {
      const chem = chemicalsMap.get(cc.chemicalId);
      if (chem) { colors.push({ hex: chem.hexColor, moles: cc.moles }); totalVol += cc.volume; }
    }
    const mixed = mixHexColors(colors);
    const lc = mixed.hex === "#ffffff" || mixed.hex === "#88ccff" ? "#a8c8e0" : mixed.hex;
    const fill = Math.min(0.85, (totalVol / container.capacity) * 0.85);
    return { liquidColor: lc, fillLevel: fill, totalVolume: totalVol };
  }, [container.contents, container.capacity, chemicalsMap]);

  const tempGlow = container.temperature > 60 ? "#ff3300" : container.temperature < 10 ? "#3399ff" : null;
  const beakerRadius = 0.05;
  const beakerHeight = 0.14;

  return (
    <InteractableMesh interactable={interactable} highlightColor={heldItem?.type === "chemical" ? "#22d3ee" : "#34d399"}>
      <group position={container.position}>
        {/* Glass beaker (lathe) */}
        <BeakerGlass radius={beakerRadius} height={beakerHeight} />

        {/* Liquid — opaque for visibility */}
        {fillLevel > 0 && (
          <>
            <mesh position={[0, (fillLevel * beakerHeight) / 2, 0]}>
              <cylinderGeometry args={[beakerRadius * 0.93, beakerRadius * 0.9, fillLevel * beakerHeight, 24]} />
              <meshStandardMaterial color={liquidColor} roughness={0.15} emissive={tempGlow || liquidColor} emissiveIntensity={tempGlow ? 0.3 : 0.08} />
            </mesh>
            <mesh position={[0, fillLevel * beakerHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[beakerRadius * 0.92, 24]} />
              <meshStandardMaterial color={liquidColor} roughness={0.1} emissive={tempGlow || liquidColor} emissiveIntensity={tempGlow ? 0.3 : 0.08} />
            </mesh>
          </>
        )}

        {/* Temperature glow */}
        {tempGlow && fillLevel > 0 && (
          <pointLight position={[0, beakerHeight / 2, 0]} color={tempGlow} intensity={0.4} distance={0.4} />
        )}

        {/* Bubbles when hot */}
        {fillLevel > 0.05 && (container.isHeating || container.temperature > 50) && (
          <Bubbles count={Math.min(10, Math.floor(container.temperature / 15))} radius={beakerRadius * 0.7} baseY={0.01} topY={fillLevel * beakerHeight} />
        )}

        {/* Steam when > 70°C */}
        {container.temperature > 70 && fillLevel > 0.05 && (
          <SteamCloud intensity={Math.min(1, (container.temperature - 70) / 30)} radius={beakerRadius * 0.5} topY={beakerHeight} />
        )}

        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[beakerRadius + 0.02, beakerRadius + 0.03, 32]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Label (hover/selected only) */}
        {(isHovered || isSelected) && (
          <Html position={[0, beakerHeight + 0.08, 0]} center distanceFactor={3} occlude>
            <div className={`pointer-events-none select-none whitespace-nowrap rounded-md border px-2 py-1 backdrop-blur-md shadow-xl ${isSelected ? "border-emerald-500/60 bg-emerald-950/90" : "border-slate-600/50 bg-slate-950/90"}`}>
              <div className={`text-[11px] font-bold ${isSelected ? "text-emerald-300" : "text-slate-200"}`}>{container.id.toUpperCase()}</div>
              <div className="font-mono text-[9px] text-slate-400">{container.temperature.toFixed(0)}°C · {totalVolume.toFixed(0)}mL{container.contents.length > 0 && ` · ${container.contents.length} items`}</div>
            </div>
          </Html>
        )}
      </group>
    </InteractableMesh>
  );
}

// ============================================
// REAGENT BOTTLE — real model on shelf
// ============================================
export function RealReagentBottle({ chemical, position }: { chemical: any; position: [number, number, number] }) {
  const heldItem = usePlayerStore((s) => s.heldItem);
  const isHeld = heldItem?.type === "chemical" && heldItem.chemicalId === chemical.id;
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const isHovered = hoveredId === `bottle-${chemical.id}`;

  const interactable: Interactable = {
    id: `bottle-${chemical.id}`,
    kind: "chemical-bottle",
    label: `${chemical.name} (${chemical.formula})`,
    position,
    chemicalId: chemical.id,
    action: isHeld ? "Put down" : `Pick up ${chemical.name}`,
  };

  if (isHeld) return null;

  return (
    <InteractableMesh interactable={interactable} highlightColor="#f59e0b">
      <group position={position}>
        <ModelFB url="/models/01_reagent_bottle_100ml.glb" position={[0, 0, 0]} scale={0.12} />
        {/* Color dot indicator */}
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.006, 8, 8]} />
          <meshStandardMaterial color={chemical.hexColor} emissive={chemical.hexColor} emissiveIntensity={0.3} />
        </mesh>
        {isHovered && (
          <Html position={[0, 0.1, 0]} center distanceFactor={3} occlude>
            <div className="pointer-events-none select-none whitespace-nowrap rounded-md border border-amber-500/50 bg-slate-950/90 px-2 py-1 backdrop-blur-md shadow-xl">
              <div className="text-[11px] font-bold text-amber-300">{chemical.name}</div>
              <div className="font-mono text-[9px] text-slate-400">{chemical.formula}</div>
              <div className="mt-0.5 text-[8px] text-emerald-400">[E] to pick up</div>
            </div>
          </Html>
        )}
      </group>
    </InteractableMesh>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function BeakerGlass({ radius, height }: { radius: number; height: number }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(radius * 0.95, 0));
    points.push(new THREE.Vector2(radius, 0.002));
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      points.push(new THREE.Vector2(radius + (radius * 0.05 - radius) * t * 0.1, t * height));
    }
    points.push(new THREE.Vector2(radius * 1.05 + 0.002, height + 0.002));
    return new THREE.LatheGeometry(points, 32);
  }, [radius, height]);

  return (
    <mesh geometry={geometry} castShadow>
      <meshPhysicalMaterial color="#e8f5f4" transparent opacity={0.22} roughness={0.02} metalness={0} transmission={0.92} ior={1.5} clearcoat={1} clearcoatRoughness={0.02} thickness={0.005} side={THREE.DoubleSide} />
    </mesh>
  );
}

function FlameEffect({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.scale.y = 1 + Math.sin(t * 8) * 0.1;
  });
  return (
    <group ref={ref} position={position}>
      <pointLight color="#ff6600" intensity={2} distance={2} decay={1.5} />
      <mesh position={[0, 0.08, 0]}>
        <coneGeometry args={[0.03, 0.15, 12]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <coneGeometry args={[0.02, 0.12, 8]} />
        <meshBasicMaterial color="#00bbff" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#ffdd00" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Bubbles({ count, radius, baseY, topY }: { count: number; radius: number; baseY: number; topY: number }) {
  const ref = useRef<THREE.Group>(null);
  const positions = useMemo(() => Array.from({ length: count }).map(() => ({
    x: (Math.random() - 0.5) * radius * 1.6, z: (Math.random() - 0.5) * radius * 1.6,
    startY: baseY + Math.random() * 0.02, speed: 0.3 + Math.random() * 0.5,
    size: 0.006 + Math.random() * 0.01, phase: Math.random() * Math.PI * 2,
  })), [count, radius, baseY]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const d = positions[i]; if (!d) return;
      const cycle = (t * d.speed + d.phase) % 1;
      (child as THREE.Mesh).position.y = d.startY + cycle * (topY - baseY);
      (child as THREE.Mesh).scale.setScalar(cycle < 0.1 ? cycle * 10 : 1);
    });
  });

  return (
    <group ref={ref}>
      {positions.map((b, i) => (
        <mesh key={i} position={[b.x, b.startY, b.z]}>
          <sphereGeometry args={[b.size, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0} />
        </mesh>
      ))}
    </group>
  );
}

function SteamCloud({ intensity, radius, topY }: { intensity: number; radius: number; topY: number }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() => Array.from({ length: 8 }).map(() => ({
    x: (Math.random() - 0.5) * radius, z: (Math.random() - 0.5) * radius,
    speed: 0.2 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2,
    size: 0.015 + Math.random() * 0.02,
  })), [radius]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const d = particles[i]; if (!d) return;
      const cycle = (t * d.speed + d.phase) % 1;
      (child as THREE.Mesh).position.y = topY + cycle * 0.15;
      (child as THREE.Mesh).position.x = d.x + Math.sin(t * 2 + d.phase) * 0.01;
      (child as THREE.Mesh).position.z = d.z + Math.cos(t * 2 + d.phase) * 0.01;
      (child as THREE.Mesh).scale.setScalar((1 - cycle) * d.size * 2);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - cycle) * 0.3 * intensity;
    });
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, topY, p.z]}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// Preload all models
export function preloadAllModels() {
  const urls = [
    "/models/fume_cupboards.glb", "/models/lab_bench.glb",
    "/models/laboratory_cabinet_storage__pbr_low_poly__free.glb",
    "/models/06_safety_cabinet_yellow.glb", "/models/gameready_wash_basin_model.glb",
    "/models/bunsen_burner.glb", "/models/02_hot_plate_magnetic_stirrer.glb",
    "/models/04_analytical_balance.glb", "/models/microscope_swift_sw380b.glb",
    "/models/spectrophotometer.glb", "/models/13_centrifuge.glb",
    "/models/03_ring_retort_stand.glb", "/models/05_burette_50ml.glb",
    "/models/12_desiccator.glb", "/models/mortar_and_pestle.glb",
    "/models/gas_cylinder_tank_co2_helium_nitrogen.glb",
    "/models/carbon_dioxide_fire_extinguisher_-__co2.glb",
    "/models/fire_blanket_free_low_poly.glb", "/models/tactical_first_aid_kit.glb",
    "/models/emergency_shower_with_eye_wash.glb", "/models/hospital_sharps_container.glb",
    "/models/nitrile_glove_box_v2.glb", "/models/07_lab_coat_hanging.glb",
    "/models/glasses.glb", "/models/warning_signs__virus_laboratory.glb",
    "/models/whiteboard__1_.glb", "/models/the_3d_periodic_table.glb",
    "/models/wall_clock.glb", "/models/bookshelf_cc0.glb", "/models/book_stack.glb",
    "/models/indoor_plant.glb", "/models/lab_chair.glb", "/models/office_chair.glb",
    "/models/trash_bin.glb", "/models/apple_desktop.glb", "/models/double_door.glb",
    "/models/window.glb", "/models/ceiling_light_round.glb",
    "/models/test_tube_rack.glb", "/models/graduated_cylinder.glb",
    "/models/cc0_-_funnel_3.glb", "/models/free_pipette__laboratory__low_poly.glb",
    "/models/stopwatch-284.glb", "/models/fever_thermometer.glb",
    "/models/low_poly_digital_ph_meter.glb", "/models/01_reagent_bottle_100ml.glb",
  ];
  urls.forEach((url) => useGLTF.preload(url));
}
