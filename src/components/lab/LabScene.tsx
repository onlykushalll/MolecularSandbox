"use client";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
  SoftShadows,
} from "@react-three/drei";
import { Suspense } from "react";
import { Beaker } from "./Beaker";
import { LabBench } from "./LabBench";
import { PourStream } from "./PourStream";
import { useLabStore } from "@/lib/store/lab-store";

export function LabScene() {
  const containers = useLabStore((s) => s.containers);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      <SoftShadows size={25} samples={10} focus={0.8} />
      <PerspectiveCamera makeDefault position={[0, 2, 6]} fov={45} />

      {/* Lighting setup — lab environment */}
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-5, 5, -3]} intensity={0.4} color="#aaccff" />
      <pointLight position={[0, 3, 2]} intensity={0.3} color="#ffffff" />

      <Suspense fallback={null}>
        <LabBench />
        {containers.map((c) => (
          <Beaker key={c.id} container={c} />
        ))}
        <PourStream />
        <ContactShadows
          position={[0, -1.145, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
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
        target={[0, -0.5, 0]}
        makeDefault
      />
    </Canvas>
  );
}
