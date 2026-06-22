"use client";
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useLabStore } from "@/lib/store/lab-store";

export function PourStream() {
  const { isPouring, pourSourceId, pourTargetId, pourProgress, containers, chemicalsMap } =
    useLabStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const dropRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const source = containers.find((c) => c.id === pourSourceId);
  const target = containers.find((c) => c.id === pourTargetId);

  // Get the source liquid color
  const streamColor = useMemo(() => {
    if (!source || source.contents.length === 0) return "#88ccff";
    // Mix colors of source contents
    let r = 0, g = 0, b = 0, totalMoles = 0;
    for (const c of source.contents) {
      const chem = chemicalsMap.get(c.chemicalId);
      if (!chem) continue;
      const hex = chem.hexColor.replace("#", "");
      const cr = parseInt(hex.substring(0, 2), 16);
      const cg = parseInt(hex.substring(2, 4), 16);
      const cb = parseInt(hex.substring(4, 6), 16);
      r += cr * c.moles;
      g += cg * c.moles;
      b += cb * c.moles;
      totalMoles += c.moles;
    }
    if (totalMoles === 0) return "#88ccff";
    const toHex = (n: number) => Math.round(n / totalMoles).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, [source, chemicalsMap]);

  const streamData = useMemo(() => {
    if (!source || !target) return null;
    // Source spout position (top of beaker, tilted)
    const sourceRadius = 0.4 + (source.capacity / 400) * 0.2;
    const sourceHeight = 1.0 + (source.capacity / 400) * 0.4;
    const start: [number, number, number] = [
      source.position[0] + sourceRadius * 0.9,
      source.position[1] + sourceHeight / 2,
      source.position[2],
    ];
    // Target opening (top center)
    const targetRadius = 0.4 + (target.capacity / 400) * 0.2;
    const targetHeight = 1.0 + (target.capacity / 400) * 0.4;
    const end: [number, number, number] = [
      target.position[0],
      target.position[1] + targetHeight / 2,
      target.position[2],
    ];
    // Arc midpoint — higher than start/end for a realistic pour arc
    const mid: [number, number, number] = [
      (start[0] + end[0]) / 2,
      Math.max(start[1], end[1]) + 0.3,
      (start[2] + end[2]) / 2,
    ];
    return { start, mid, end };
  }, [source, target]);

  useFrame(() => {
    if (!dropRef.current || !streamData) return;
    // Animate a "droplet" traveling along the curve
    const t = pourProgress;
    const { start, mid, end } = streamData;
    const oneMinusT = 1 - t;
    const pos = dropRef.current.position;
    pos.x = oneMinusT * oneMinusT * start[0] + 2 * oneMinusT * t * mid[0] + t * t * end[0];
    pos.y = oneMinusT * oneMinusT * start[1] + 2 * oneMinusT * t * mid[1] + t * t * end[1];
    pos.z = oneMinusT * oneMinusT * start[2] + 2 * oneMinusT * t * mid[2] + t * t * end[2];
  });

  if (!isPouring || !source || !target || !streamData) return null;

  return (
    <group>
      <StreamTube
        start={streamData.start}
        mid={streamData.mid}
        end={streamData.end}
        color={streamColor}
      />
      {/* Leading droplet */}
      <group ref={dropRef}>
        <mesh>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshPhysicalMaterial
            color={streamColor}
            roughness={0.1}
            transmission={0.4}
            ior={1.33}
          />
        </mesh>
      </group>
      <Html position={streamData.mid} center distanceFactor={8}>
        <div className="pointer-events-none select-none whitespace-nowrap rounded-full border border-emerald-400/40 bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur">
          Pouring... {Math.round(pourProgress * 100)}%
        </div>
      </Html>
    </group>
  );
}

function StreamTube({
  start,
  mid,
  end,
  color,
}: {
  start: [number, number, number];
  mid: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...end)
    );
  }, [start, mid, end]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 24, 0.03, 8, false);
  }, [curve]);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.85}
        roughness={0.05}
        transmission={0.6}
        ior={1.33}
        clearcoat={1}
      />
    </mesh>
  );
}
