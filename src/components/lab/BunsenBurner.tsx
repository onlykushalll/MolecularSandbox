"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useLabStore } from "@/lib/store/lab-store";

interface BunsenBurnerProps {
  position: [number, number, number];
  active: boolean;
}

export function BunsenBurner({ position, active }: BunsenBurnerProps) {
  const flameGroupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const innerFlameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const time = useRef(0);
  // Flame intensity 0..3 (off / low / medium / high) — affects visual size & light
  const flameIntensity = useLabStore((s) => s.flameIntensity);

  const flameParticles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      radius: 0.02 + Math.random() * 0.04,
      speed: 0.8 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      size: 0.03 + Math.random() * 0.04,
    }));
  }, []);

  // Size multiplier based on flame intensity (1=low, 2=medium, 3=high)
  // Made flames bigger and more visible
  const sizeMult =
    flameIntensity === 0 ? 0.6
    : flameIntensity === 1 ? 1.0
    : flameIntensity === 2 ? 1.4
    : 1.8;
  // Light intensity scales with flame size
  const lightMult =
    flameIntensity === 0 ? 0
    : flameIntensity === 1 ? 0.8
    : flameIntensity === 2 ? 1.3
    : 2.0;

  useFrame((_, delta) => {
    time.current += delta;
    const t = time.current;

    if (flameRef.current) {
      const scale = active ? sizeMult * (1 + Math.sin(t * 8) * 0.08) : 0.001;
      flameRef.current.scale.set(scale * 0.9, scale, scale * 0.9);
      flameRef.current.rotation.y = t * 0.5;
    }
    if (innerFlameRef.current) {
      const scale = active ? sizeMult * (0.7 + Math.sin(t * 10 + 1) * 0.06) : 0.001;
      innerFlameRef.current.scale.set(scale, scale * 1.1, scale);
    }
    if (lightRef.current) {
      lightRef.current.intensity = active
        ? lightMult * (1.5 + Math.sin(t * 15) * 0.3 + Math.sin(t * 23) * 0.2)
        : 0;
    }
    if (flameGroupRef.current && active) {
      flameGroupRef.current.children.forEach((child, i) => {
        if (i < flameParticles.length) {
          const data = flameParticles[i];
          const mesh = child as THREE.Mesh;
          const cycle = (t * data.speed + data.phase) % 1;
          mesh.position.y = 0.05 + cycle * 0.25 * sizeMult;
          const r = data.radius * (1 - cycle * 0.3);
          mesh.position.x = Math.cos(data.angle) * r;
          mesh.position.z = Math.sin(data.angle) * r;
          mesh.scale.setScalar((1 - cycle) * 0.8 * sizeMult);
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = (1 - cycle) * 0.7;
        }
      });
    }
  });

  return (
    <group position={position}>
      {/* Burner stand */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
        <meshStandardMaterial color="#444444" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* Burner tube */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.3, 16]} />
        <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.85} />
      </mesh>

      {/* Burner base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.04, 16]} />
        <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.9} />
      </mesh>

      {/* Gas adjustment knob */}
      <mesh position={[0.08, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.04, 8]} />
        <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.95} />
      </mesh>

      {/* Tripod legs */}
      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(angle) * 0.1,
            0,
            Math.sin(angle) * 0.1,
          ]}
          rotation={[Math.sin(angle) * 0.3, 0, -Math.cos(angle) * 0.3]}
          castShadow
        >
          <cylinderGeometry args={[0.008, 0.008, 0.15, 6]} />
          <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.85} />
        </mesh>
      ))}

      {/* Flame group — only visible when active */}
      {active && (
        <>
          <pointLight
            ref={lightRef}
            position={[0, 0.5, 0]}
            color="#ff6600"
            intensity={2.5}
            distance={4}
            decay={1.5}
          />
          {/* Extra warm glow light */}
          <pointLight
            position={[0, 0.3, 0]}
            color="#ffaa00"
            intensity={1.5}
            distance={2.5}
            decay={2}
          />

          {/* Outer flame cone — bigger, more orange */}
          <mesh ref={flameRef} position={[0, 0.5, 0]}>
            <coneGeometry args={[0.12, 0.5, 16]} />
            <meshBasicMaterial
              color="#ff5500"
              transparent
              opacity={0.65}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Inner flame (blue core) — taller */}
          <mesh ref={innerFlameRef} position={[0, 0.45, 0]}>
            <coneGeometry args={[0.06, 0.35, 12]} />
            <meshBasicMaterial
              color="#00bbff"
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Bright yellow tip */}
          <mesh position={[0, 0.7, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial
              color="#ffdd00"
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Flame particles */}
          <group ref={flameGroupRef} position={[0, 0.15, 0]}>
            {flameParticles.map((p, i) => (
              <mesh key={i} position={[0, 0.05, 0]}>
                <sphereGeometry args={[p.size * 1.3, 6, 6]} />
                <meshBasicMaterial
                  color={i % 2 === 0 ? "#ff8800" : "#ffcc00"}
                  transparent
                  opacity={0.8}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        </>
      )}

      {/* Inactive indicator */}
      {!active && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#4a5568" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
