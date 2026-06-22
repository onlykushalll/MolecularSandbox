"use client";
import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  buildMoleculeModel,
  getElementInfo,
  type MoleculeModel,
  type Bond,
} from "@/lib/chemistry/molecule";
import { cn } from "@/lib/utils";

interface AtomMeshProps {
  element: string;
  position: [number, number, number];
  spaceFill: boolean;
  hovered: boolean;
  onHover: (h: boolean, el: string) => void;
  index: number;
}

function AtomMesh({ element, position, spaceFill, hovered, onHover }: AtomMeshProps) {
  const info = getElementInfo(element);
  // Ball-and-stick uses fixed small radius; space-fill uses VDW radius
  const radius = spaceFill ? Math.max(0.25, info.radius * 0.55) : hovered ? 0.34 : 0.28;
  const emissive = hovered ? info.color : "#000000";

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true, element);
        }}
        onPointerOut={() => onHover(false, "")}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={info.color}
          roughness={0.35}
          metalness={0.18}
          emissive={emissive}
          emissiveIntensity={hovered ? 0.5 : 0}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={8} position={[0, radius + 0.3, 0]} center>
          <div className="pointer-events-none whitespace-nowrap rounded-md border border-slate-600 bg-slate-900/95 px-2 py-1 text-xs text-white shadow-lg">
            <span className="font-bold" style={{ color: info.color }}>
              {element}
            </span>
            <span className="ml-1 text-slate-300">{info.name}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function BondMesh({ bond, atoms }: { bond: Bond; atoms: MoleculeModel["atoms"] }) {
  const a = atoms[bond.a];
  const b = atoms[bond.b];
  if (!a || !b) return null;

  const start = new THREE.Vector3(...a.position);
  const end = new THREE.Vector3(...b.position);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const len = start.distanceTo(end);
  const dir = end.clone().sub(start).normalize();

  const quat = new THREE.Quaternion();
  quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  // For multiple bond orders, render parallel cylinders
  const offsets: number[] = bond.order === 1 ? [0] : bond.order === 2 ? [-0.08, 0.08] : [-0.13, 0, 0.13];

  return (
    <>
      {offsets.map((off, i) => {
        // Perpendicular offset
        const perp = new THREE.Vector3(1, 0, 0).applyQuaternion(quat).multiplyScalar(off);
        return (
          <mesh key={i} position={mid.clone().add(perp)} quaternion={quat}>
            <cylinderGeometry args={[0.055, 0.055, len, 12]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.5} metalness={0.25} />
          </mesh>
        );
      })}
    </>
  );
}

function MoleculeGroup({
  model,
  spaceFill,
  autoRotate,
  onHover,
  hoveredEl,
}: {
  model: MoleculeModel;
  spaceFill: boolean;
  autoRotate: boolean;
  onHover: (h: boolean, el: string) => void;
  hoveredEl: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Bonds first (rendered behind atoms) */}
      {model.bonds.map((bond, i) => (
        <BondMesh key={`bond-${i}`} bond={bond} atoms={model.atoms} />
      ))}
      {/* Atoms */}
      {model.atoms.map((atom) => (
        <AtomMesh
          key={`atom-${atom.index}`}
          element={atom.element}
          position={atom.position}
          spaceFill={spaceFill}
          hovered={hoveredEl === atom.element}
          onHover={onHover}
          index={atom.index}
        />
      ))}
    </group>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <directionalLight position={[-5, 3, -3]} intensity={0.4} color="#a8c5ff" />
      <pointLight position={[0, 0, 4]} intensity={0.4} color="#ffffff" />
    </>
  );
}

export interface MoleculeViewer3DProps {
  formula: string;
  height?: number;
  spaceFill?: boolean;
  autoRotate?: boolean;
}

export function MoleculeViewer3D({
  formula,
  height = 320,
  spaceFill: initialSpaceFill = false,
  autoRotate: initialAutoRotate = true,
}: MoleculeViewer3DProps) {
  const [spaceFill, setSpaceFill] = useState(initialSpaceFill);
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate);
  const [hoveredEl, setHoveredEl] = useState("");

  const model = useMemo(() => buildMoleculeModel(formula), [formula]);

  // Determine scale based on molecule size
  const scale = useMemo(() => {
    const maxDist = Math.max(
      ...model.atoms.map((a) => Math.sqrt(a.position[0] ** 2 + a.position[1] ** 2 + a.position[2] ** 2)),
      0.5
    );
    return Math.min(2.5, 2.2 / Math.max(0.5, maxDist));
  }, [model]);

  return (
    <div className="viewer-glow relative w-full overflow-hidden rounded-lg border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      <Canvas
        camera={{ position: [0, 1.5, 4.5], fov: 50 }}
        style={{ height: `${height}px` }}
        dpr={[1, 2]}
      >
        <SceneLighting />
        <group scale={scale}>
          <MoleculeGroup
            model={model}
            spaceFill={spaceFill}
            autoRotate={autoRotate}
            onHover={(h, el) => setHoveredEl(h ? el : "")}
            hoveredEl={hoveredEl}
          />
        </group>
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {/* Top-left: formula badge */}
      <div className="pointer-events-none absolute left-3 top-3">
        <div className="rounded-md border border-emerald-500/30 bg-slate-950/80 px-2.5 py-1 font-mono text-sm font-bold text-emerald-300 backdrop-blur">
          {formula}
        </div>
      </div>

      {/* Top-right: controls */}
      <div className="absolute right-3 top-3 flex gap-1.5">
        <button
          onClick={() => setSpaceFill(false)}
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-medium transition-all",
            !spaceFill
              ? "bg-emerald-600 text-white shadow"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          )}
        >
          Ball-Stick
        </button>
        <button
          onClick={() => setSpaceFill(true)}
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-medium transition-all",
            spaceFill
              ? "bg-emerald-600 text-white shadow"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          )}
        >
          Space-Fill
        </button>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-medium transition-all",
            autoRotate
              ? "bg-cyan-600 text-white shadow"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          )}
          title="Toggle auto-rotate"
        >
          {autoRotate ? "⏸ Spin" : "▶ Spin"}
        </button>
      </div>

      {/* Bottom-left: hovered element info */}
      {hoveredEl && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-slate-600 bg-slate-950/90 px-3 py-1.5 text-xs backdrop-blur">
          <span className="font-bold" style={{ color: getElementInfo(hoveredEl).color }}>
            {hoveredEl}
          </span>
          <span className="ml-2 text-slate-300">{getElementInfo(hoveredEl).name}</span>
          <span className="ml-2 text-slate-500">· valence {getElementInfo(hoveredEl).valence}</span>
        </div>
      )}

      {/* Bottom-right: atom count */}
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-400 backdrop-blur">
        {model.atoms.length} atoms · {model.bonds.length} bonds
      </div>
    </div>
  );
}
