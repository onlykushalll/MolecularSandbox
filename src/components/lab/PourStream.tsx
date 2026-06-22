"use client";
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useLabStore } from "@/lib/store/lab-store";

export function PourStream() {
  const { isPouring, pourSourceId, pourTargetId, pourProgress, containers } =
    useLabStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const source = containers.find((c) => c.id === pourSourceId);
  const target = containers.find((c) => c.id === pourTargetId);

  const streamData = useMemo(() => {
    if (!source || !target) return null;
    const start: [number, number, number] = [
      source.position[0],
      source.position[1] + 0.6,
      source.position[2],
    ];
    const end: [number, number, number] = [
      target.position[0],
      target.position[1] + 0.6,
      target.position[2],
    ];
    const mid: [number, number, number] = [
      (start[0] + end[0]) / 2,
      Math.min(start[1], end[1]) - 0.4,
      (start[2] + end[2]) / 2,
    ];
    return { start, mid, end };
  }, [source, target]);

  useFrame(() => {
    if (!meshRef.current || !streamData) return;
    // Curve the stream using a quadratic bezier
    const t = pourProgress;
    const { start, mid, end } = streamData;
    const pos = meshRef.current.position;
    // Stream follows source position as progress increases
    const oneMinusT = 1 - t;
    pos.x = oneMinusT * oneMinusT * start[0] + 2 * oneMinusT * t * mid[0] + t * t * end[0];
    pos.y = oneMinusT * oneMinusT * start[1] + 2 * oneMinusT * t * mid[1] + t * t * end[1];
    pos.z = oneMinusT * oneMinusT * start[2] + 2 * oneMinusT * t * mid[2] + t * t * end[2];
  });

  if (!isPouring || !source || !target || !streamData) return null;

  return (
    <group>
      {/* Curved stream using tube geometry */}
      <StreamTube start={streamData.start} mid={streamData.mid} end={streamData.end} />
      <Html position={streamData.mid} center>
        <div className="pointer-events-none select-none rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg">
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
}: {
  start: [number, number, number];
  mid: [number, number, number];
  end: [number, number, number];
}) {
  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...end)
    );
  }, [start, mid, end]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 20, 0.025, 8, false);
  }, [curve]);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color="#88ccff"
        transparent
        opacity={0.7}
        roughness={0.1}
        transmission={0.5}
        ior={1.33}
      />
    </mesh>
  );
}
