"use client";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
  Html,
} from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Beaker } from "./Beaker";
import { LabBench } from "./LabBench";
import { PourStream } from "./PourStream";
import { BunsenBurner } from "./BunsenBurner";
import { Thermometer3D } from "./Thermometer3D";
import { useLabStore } from "@/lib/store/lab-store";

function SceneContents() {
  const containers = useLabStore((s) => s.containers);
  const selectedContainerId = useLabStore((s) => s.selectedContainerId);

  return (
    <>
      <LabBench />
      {containers.map((c) => (
        <group key={c.id}>
          <Beaker container={c} />
          {/* Bunsen burner under selected/hot beaker */}
          {(selectedContainerId === c.id || c.isHeating) && (
            <BunsenBurner
              position={[c.position[0], c.position[1] - 1.1, c.position[2]]}
              active={c.isHeating}
            />
          )}
        </group>
      ))}
      <PourStream />
      <Thermometer3D position={[4.0, -0.6, -0.5]} />
    </>
  );
}

function Lighting() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  return (
    <>
      <ambientLight intensity={0.55} color="#ffffff" />
      <directionalLight
        ref={lightRef}
        position={[5, 8, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-5, 5, -3]} intensity={0.5} color="#aaccff" />
      <pointLight position={[0, 3, 2]} intensity={0.4} color="#ffffff" />
      {/* Warm fill light to simulate lab lighting */}
      <pointLight position={[3, 2, -2]} intensity={0.3} color="#ffd4a0" distance={8} />
    </>
  );
}

export function LabScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, useLegacyLights: false }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
      camera={{ position: [0, 2.5, 6], fov: 45 }}
      style={{
        background:
          "radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%, #020617 100%)",
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 2.5, 6]} fov={45} />
      <Lighting />

      <Suspense
        fallback={
          <Html center>
            <div className="rounded-lg bg-slate-900/80 px-4 py-2 text-white backdrop-blur">
              Loading lab...
            </div>
          </Html>
        }
      >
        <SceneContents />
        <ContactShadows
          position={[0, -1.144, 0]}
          opacity={0.45}
          scale={12}
          blur={2.5}
          far={4}
          color="#000000"
        />
        <Environment preset="studio" />
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={12}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, -0.3, 0]}
        makeDefault
      />

      {/* Subtle fog for depth */}
      <fog attach="fog" args={["#0f172a", 12, 25]} />
    </Canvas>
  );
}
