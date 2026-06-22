"use client";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { useLabStore } from "@/lib/store/lab-store";
import type { ContainerState, ContainerContent, ChemicalData } from "@/lib/chemistry/types";
import { mixHexColors, calculatePH, phToColor } from "@/lib/chemistry/mixture";

interface BeakerProps {
  container: ContainerState;
}

export function Beaker({ container }: BeakerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const wobbleRef = useRef(0);
  // Smoothed color (lerps toward target for color-change animation during reactions)
  const smoothedColor = useRef(new THREE.Color("#88ccff"));
  const smoothedOpacity = useRef(0.3);

  const {
    selectContainer,
    setHoveredContainer,
    selectedContainerId,
    secondaryContainerId,
    hoveredContainerId,
    chemicalsMap,
    showPHStrip,
    reactingContainerId,
    reactionProgress,
  } = useLabStore();
  const isSelected = selectedContainerId === container.id;
  const isSecondary = secondaryContainerId === container.id;
  const isHovered = hoveredContainerId === container.id;
  const isReacting = reactingContainerId === container.id && reactionProgress > 0;

  // Calculate fill level
  const totalVolume = container.contents.reduce((s, c) => s + c.volume, 0);
  const fillRatio = Math.min(1, totalVolume / container.capacity);

  // Mix colors of contents
  const colorData = useMemo(() => {
    return container.contents.map((c) => {
      const chem = chemicalsMap.get(c.chemicalId);
      return { hex: chem?.hexColor || "#88ccff", moles: c.moles };
    });
  }, [container.contents, chemicalsMap]);

  const { hex: liquidColor, opacity: liquidOpacity } = useMemo(
    () => mixHexColors(colorData),
    [colorData]
  );

  // Beaker dimensions based on capacity
  const radius = 0.4 + (container.capacity / 400) * 0.2;
  const height = 1.0 + (container.capacity / 400) * 0.4;
  const liquidHeight = height * fillRatio * 0.85;

  // Temperature-based color tint for the glass
  const tempColor = useMemo(() => {
    if (container.temperature > 60) return "#ff6644";
    if (container.temperature < 10) return "#66ccff";
    return "#ffffff";
  }, [container.temperature]);

  // Precipitate amount (scaled particles)
  const precipitates = container.precipitate || [];
  const totalPrecipMoles = precipitates.reduce((s, p) => s + p.moles, 0);
  const precipParticleCount = Math.min(80, Math.max(0, Math.floor(totalPrecipMoles * 30)));
  // Blend precipitate colors weighted by moles (computed inline — cheap operation)
  const precipColor = (() => {
    if (precipitates.length === 0) return "#dddddd";
    if (precipitates.length === 1) return precipitates[0].color;
    let r = 0, g = 0, b = 0, total = 0;
    for (const p of precipitates) {
      const hex = p.color.replace("#", "");
      r += parseInt(hex.substring(0, 2), 16) * p.moles;
      g += parseInt(hex.substring(2, 4), 16) * p.moles;
      b += parseInt(hex.substring(4, 6), 16) * p.moles;
      total += p.moles;
    }
    const toHex = (n: number) => Math.round(n / total).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  })();

  // Gas emission
  const gasEmitting = container.gasEmitting;
  const gasIntensity = gasEmitting?.intensity || 0;

  useFrame((state, delta) => {
    wobbleRef.current += delta;
    // Smooth color transition (lerp toward target color)
    const targetColor = new THREE.Color(liquidColor);
    smoothedColor.current.lerp(targetColor, Math.min(1, delta * 4));
    smoothedOpacity.current += (liquidOpacity - smoothedOpacity.current) * Math.min(1, delta * 4);
    if (liquidRef.current && liquidHeight > 0) {
      const wobble = Math.sin(wobbleRef.current * 3) * 0.005 * fillRatio;
      liquidRef.current.scale.y = Math.max(0.01, liquidHeight + wobble);
      // Apply smoothed color to liquid material
      const mat = liquidRef.current.material as THREE.MeshPhysicalMaterial;
      if (mat.color) mat.color.copy(smoothedColor.current);
      mat.opacity = smoothedOpacity.current;
    }
    if (groupRef.current && container.isHeating) {
      // Slight vibration when heating
      groupRef.current.position.y =
        container.position[1] + Math.sin(wobbleRef.current * 20) * 0.002;
    }
  });

  // If the beaker is broken, render broken-glass shards and no liquid
  if (container.isBroken) {
    return <BrokenBeaker container={container} isSelected={isSelected} isHovered={isHovered} />;
  }

  // Selection ring color
  const ringColor = isSecondary ? "#f59e0b" : isSelected ? "#22c55e" : isHovered ? "#88ccff" : null;

  return (
    <group
      ref={groupRef}
      position={container.position}
      rotation={container.rotation}
      onClick={(e) => {
        e.stopPropagation();
        selectContainer(container.id, e.shiftKey);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredContainer(container.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHoveredContainer(null);
        document.body.style.cursor = "default";
      }}
    >
      {/* Glass body — cylinder */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.95, height, 64, 1, true]} />
        <meshPhysicalMaterial
          color={tempColor}
          transparent
          opacity={0.15}
          roughness={0.02}
          metalness={0}
          transmission={0.95}
          thickness={0.3}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0}
          side={THREE.DoubleSide}
        />
        {ringColor && <Edges color={ringColor} linewidth={2} />}
      </mesh>

      {/* Bottom of beaker */}
      <mesh position={[0, -height / 2, 0]} receiveShadow>
        <cylinderGeometry args={[radius * 0.95, radius * 0.95, 0.02, 64]} />
        <meshPhysicalMaterial
          color={tempColor}
          transparent
          opacity={0.2}
          roughness={0.05}
          transmission={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pour spout */}
      <mesh position={[radius, height / 2 - 0.02, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.12, 0.08, 0.1]} />
        <meshPhysicalMaterial
          color={tempColor}
          transparent
          opacity={0.15}
          transmission={0.9}
        />
      </mesh>

      {/* Liquid inside */}
      {liquidHeight > 0.01 && (
        <mesh
          ref={liquidRef}
          position={[0, -height / 2 + liquidHeight / 2 + 0.02, 0]}
        >
          <cylinderGeometry
            args={[radius * 0.92, radius * 0.88, 1, 48]}
          />
          <meshPhysicalMaterial
            color={liquidColor}
            transparent
            opacity={liquidOpacity}
            roughness={0.1}
            metalness={0}
            transmission={0.3}
            ior={1.33}
            clearcoat={0.5}
            emissive={container.temperature > 50 ? "#ff3300" : "#000000"}
            emissiveIntensity={container.temperature > 50 ? 0.1 : 0}
          />
        </mesh>
      )}

      {/* Reaction progress ring (top of beaker) */}
      {isReacting && (
        <mesh position={[0, height / 2 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.95, radius * 1.05, 64, 1, 0, reactionProgress * Math.PI * 2]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* pH test strip — dips into beaker from above */}
      {showPHStrip && isSelected && liquidHeight > 0.01 && (
        <PHStrip
          radius={radius}
          height={height}
          liquidTopY={-height / 2 + liquidHeight}
          contents={container.contents}
          chemicalsMap={chemicalsMap}
        />
      )}

      {/* Liquid surface (meniscus) */}
      {liquidHeight > 0.01 && (
        <mesh position={[0, -height / 2 + liquidHeight + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius * 0.92, 48]} />
          <meshStandardMaterial
            color={liquidColor}
            transparent
            opacity={liquidOpacity * 0.8}
            roughness={0.05}
            metalness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Precipitate — solid particles settled at bottom */}
      {precipParticleCount > 0 && (
        <Precipitate
          count={precipParticleCount}
          color={precipColor}
          radius={radius * 0.85}
          baseY={-height / 2 + 0.02}
          height={Math.min(0.15, totalPrecipMoles * 0.1)}
          liquidTopY={-height / 2 + liquidHeight}
        />
      )}

      {/* Bubbles when gas evolved or heating */}
      {((container.isHeating || container.temperature > 50 || gasIntensity > 0.1) && liquidHeight > 0.01) && (
        <Bubbles
          count={Math.floor(Math.max(container.temperature / 10, gasIntensity * 20))}
          radius={radius * 0.85}
          baseY={-height / 2}
          topY={-height / 2 + liquidHeight}
        />
      )}

      {/* Gas emission — particles rising above the liquid surface */}
      {gasIntensity > 0.05 && (
        <GasEmission
          intensity={gasIntensity}
          color={gasEmitting?.color || "#dddddd"}
          radius={radius * 0.6}
          topY={height / 2}
        />
      )}

      {/* Steam / vapor cloud when hot */}
      {container.temperature > 70 && liquidHeight > 0.01 && (
        <SteamCloud
          intensity={Math.min(1, (container.temperature - 70) / 30)}
          radius={radius * 0.5}
          topY={height / 2}
        />
      )}

      {/* Heat shimmer when hot */}
      {container.temperature > 50 && (
        <mesh position={[0, height / 2 + 0.3, 0]}>
          <sphereGeometry args={[radius * 0.6, 16, 16]} />
          <meshBasicMaterial
            color="#ff8800"
            transparent
            opacity={0.05}
          />
        </mesh>
      )}

      {/* Graduation marks */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[radius - 0.01, -height / 2 + (height * (i + 1)) / 6, 0]}>
          <boxGeometry args={[0.08, 0.005, 0.01]} />
          <meshStandardMaterial color="#333333" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Beaker label */}
      <Text
        position={[0, -height / 2 - 0.2, radius + 0.01]}
        fontSize={0.08}
        color={isSelected ? "#22c55e" : isSecondary ? "#f59e0b" : "#1f2937"}
        anchorX="center"
        anchorY="middle"
      >
        {container.id.toUpperCase()}
      </Text>

      {/* Volume indicator */}
      {totalVolume > 0 && (
        <Text
          position={[0, height / 2 + 0.15, 0]}
          fontSize={0.07}
          color="#1f2937"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.003}
          outlineColor="#ffffff"
        >
          {`${totalVolume.toFixed(0)} mL · ${container.temperature.toFixed(0)}°C`}
        </Text>
      )}

      {/* Contents labels */}
      {container.contents.length > 0 && (
        <Text
          position={[0, height / 2 + 0.28, 0]}
          fontSize={0.055}
          color="#374151"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.002}
          outlineColor="#ffffff"
          maxWidth={2}
        >
          {container.contents
            .map((c) => {
              const chem = chemicalsMap.get(c.chemicalId);
              return chem ? chem.formula : "?";
            })
            .join(" + ")}
        </Text>
      )}

      {/* Precipitate indicator badge */}
      {precipitates.length > 0 && (
        <Text
          position={[0, -height / 2 - 0.32, radius + 0.01]}
          fontSize={0.05}
          color="#a855f7"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.002}
          outlineColor="#ffffff"
        >
          {`▼ ${totalPrecipMoles.toFixed(2)} mol precipitate`}
        </Text>
      )}

      {/* Hover tooltip */}
      {isHovered && !isSelected && (
        <Html position={[0, height / 2 + 0.5, 0]} center distanceFactor={6}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded-md border border-slate-600/50 bg-slate-900/90 px-2.5 py-1 text-[10px] font-medium text-white shadow-lg backdrop-blur">
            {container.id.toUpperCase()} · {totalVolume.toFixed(0)}mL · {container.temperature.toFixed(0)}°C
            <span className="ml-1 text-slate-400">(click to select · shift-click for pour)</span>
          </div>
        </Html>
      )}

      {/* Selection glow ring on the bench */}
      {(isSelected || isSecondary) && (
        <mesh position={[0, -height / 2 - 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.05, radius * 1.25, 64]} />
          <meshBasicMaterial
            color={isSecondary ? "#f59e0b" : "#22c55e"}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

function Precipitate({
  count,
  color,
  radius,
  baseY,
  height,
  liquidTopY,
}: {
  count: number;
  color: string;
  radius: number;
  baseY: number;
  height: number;
  liquidTopY: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        // Some particles are still falling, some have settled
        targetY: baseY + Math.random() * height,
        startY: liquidTopY + Math.random() * 0.3,
        fallDelay: Math.random() * 2,
        size: 0.015 + Math.random() * 0.025,
        rotation: Math.random() * Math.PI,
      };
    });
  }, [count, radius, baseY, height, liquidTopY]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const data = particles[i];
      const fallT = Math.max(0, (t - data.fallDelay) / 1.5);
      const progress = Math.min(1, fallT);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const y = data.startY + (data.targetY - data.startY) * eased;
      child.position.y = y;
      const mesh = child as THREE.Mesh;
      mesh.rotation.x = data.rotation + t * 0.5 * (1 - progress);
      mesh.rotation.z = data.rotation + t * 0.3 * (1 - progress);
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.startY, p.z]}>
          <dodecahedronGeometry args={[p.size, 0]} />
          <meshStandardMaterial
            color={color}
            roughness={0.6}
            metalness={0.1}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function GasEmission({
  intensity,
  color,
  radius,
  topY,
}: {
  intensity: number;
  color: string;
  radius: number;
  topY: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const count = Math.floor(intensity * 25);
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      startR: Math.random() * radius,
      drift: 0.3 + Math.random() * 0.5,
      size: 0.04 + Math.random() * 0.04,
      phase: Math.random(),
      speed: 0.5 + Math.random() * 0.5,
    }));
  }, [count, radius]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const data = particles[i];
      if (!data) return;
      const cycle = ((t * data.speed + data.phase) % 1);
      const r = data.startR + cycle * data.drift;
      child.position.x = Math.cos(data.angle) * r;
      child.position.z = Math.sin(data.angle) * r;
      child.position.y = topY + cycle * 0.8;
      const mesh = child as THREE.Mesh;
      const scale = cycle < 0.2 ? cycle * 5 : 1 - (cycle - 0.2) * 0.5;
      mesh.scale.setScalar(Math.max(0.01, scale));
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = (1 - cycle) * 0.5 * intensity;
    });
  });

  if (count === 0) return null;
  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.4}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function SteamCloud({
  intensity,
  radius,
  topY,
}: {
  intensity: number;
  radius: number;
  topY: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const count = Math.floor(intensity * 12);
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      drift: 0.2 + Math.random() * 0.4,
      size: 0.08 + Math.random() * 0.06,
      phase: Math.random(),
      speed: 0.3 + Math.random() * 0.3,
    }));
  }, [count]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const data = particles[i];
      if (!data) return;
      const cycle = ((t * data.speed + data.phase) % 1);
      const r = cycle * data.drift * radius * 2;
      child.position.x = Math.cos(data.angle) * r;
      child.position.z = Math.sin(data.angle) * r;
      child.position.y = topY + 0.3 + cycle * 1.2;
      const mesh = child as THREE.Mesh;
      mesh.scale.setScalar(Math.max(0.01, cycle < 0.3 ? cycle * 3 : 1 + (cycle - 0.3) * 0.5));
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = (1 - cycle) * 0.3 * intensity;
    });
  });

  if (count === 0) return null;
  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[p.size, 12, 12]} />
          <meshStandardMaterial
            color="#f8fafc"
            transparent
            opacity={0.25}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function Bubbles({
  count,
  radius,
  baseY,
  topY,
}: {
  count: number;
  radius: number;
  baseY: number;
  topY: number;
}) {
  const bubbles = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: (Math.random() - 0.5) * radius * 1.6,
      z: (Math.random() - 0.5) * radius * 1.6,
      startY: baseY + Math.random() * 0.1,
      speed: 0.3 + Math.random() * 0.5,
      size: 0.015 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, radius, baseY]);

  useFrame((state) => {
    if (!bubbles.current) return;
    bubbles.current.children.forEach((child, i) => {
      const data = positions[i];
      const t = state.clock.elapsedTime;
      const cycle = (t * data.speed + data.phase) % 1;
      child.position.y = data.startY + cycle * (topY - baseY);
      (child as THREE.Mesh).scale.setScalar(cycle < 0.1 ? cycle * 10 : 1);
    });
  });

  return (
    <group ref={bubbles}>
      {positions.map((b, i) => (
        <mesh key={i} position={[b.x, b.startY, b.z]}>
          <sphereGeometry args={[b.size, 8, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.6}
            roughness={0}
          />
        </mesh>
      ))}
    </group>
  );
}

// ===== Broken Beaker =====
function BrokenBeaker({
  container,
  isSelected,
  isHovered,
}: {
  container: ContainerState;
  isSelected: boolean;
  isHovered: boolean;
}) {
  const radius = 0.4 + (container.capacity / 400) * 0.2;
  const height = 1.0 + (container.capacity / 400) * 0.4;
  const { selectContainer, setHoveredContainer } = useLabStore();

  // Pre-compute random shard positions (jagged bottom rim + scattered pieces)
  const shards = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
      const dist = radius * (0.3 + Math.random() * 0.8);
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        rotX: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        size: 0.08 + Math.random() * 0.12,
        y: -height / 2 + Math.random() * 0.05,
      };
    });
  }, [radius, height]);

  // Pooled liquid on the bench (if any was inside when broken)
  const spilledVolume = container.contents.reduce((s, c) => s + c.volume, 0);
  const puddleRadius = Math.min(radius * 1.8, radius + Math.sqrt(spilledVolume) * 0.03);
  const puddleColor = (() => {
    const cd = container.contents.map((c) => {
      const chem = useLabStore.getState().chemicalsMap.get(c.chemicalId);
      return { hex: chem?.hexColor || "#88ccff", moles: c.moles };
    });
    if (cd.length === 0) return "#88ccff";
    return mixHexColors(cd).hex;
  })();

  return (
    <group
      position={container.position}
      rotation={container.rotation}
      onClick={(e) => {
        e.stopPropagation();
        selectContainer(container.id, e.shiftKey);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredContainer(container.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHoveredContainer(null);
        document.body.style.cursor = "default";
      }}
    >
      {/* Broken beaker base (jagged stump) */}
      <mesh position={[0, -height / 2 + 0.1, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius * 0.95, 0.2, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.18}
          roughness={0.05}
          transmission={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Jagged top edge — irregular triangles */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const jagHeight = 0.05 + Math.random() * 0.15;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius * 0.95,
              -height / 2 + 0.2 + jagHeight / 2,
              Math.sin(angle) * radius * 0.95,
            ]}
            rotation={[0, -angle, 0]}
          >
            <coneGeometry args={[0.06, jagHeight, 4]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.2}
              transmission={0.85}
              roughness={0.05}
            />
          </mesh>
        );
      })}
      {/* Shards scattered around */}
      {shards.map((s, i) => (
        <mesh
          key={`shard-${i}`}
          position={[s.x, s.y, s.z]}
          rotation={[s.rotX, 0, s.rotZ]}
          castShadow
        >
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            transmission={0.7}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Puddle of spilled liquid */}
      {spilledVolume > 0.5 && (
        <mesh position={[0, -height / 2 - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[puddleRadius, 32]} />
          <meshStandardMaterial
            color={puddleColor}
            transparent
            opacity={0.7}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      )}
      {/* Label */}
      <Text
        position={[0, -height / 2 - 0.25, radius + 0.01]}
        fontSize={0.08}
        color="#dc2626"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.003}
        outlineColor="#ffffff"
      >
        {`${container.id.toUpperCase()} ⚠ BROKEN`}
      </Text>
      {/* Selection ring (red for broken) */}
      {isSelected && (
        <mesh position={[0, -height / 2 - 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.05, radius * 1.25, 64]} />
          <meshBasicMaterial color="#dc2626" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Hover tooltip */}
      {isHovered && !isSelected && (
        <Html position={[0, height / 2 + 0.3, 0]} center distanceFactor={6}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded-md border border-red-500/50 bg-red-950/90 px-2.5 py-1 text-[10px] font-medium text-red-100 shadow-lg backdrop-blur">
            {container.id.toUpperCase()} · BROKEN · Empty and reset
          </div>
        </Html>
      )}
    </group>
  );
}

// ===== pH Test Strip =====
function PHStrip({
  radius,
  height,
  liquidTopY,
  contents,
  chemicalsMap,
}: {
  radius: number;
  height: number;
  liquidTopY: number;
  contents: ContainerContent[];
  chemicalsMap: Map<string, ChemicalData>;
}) {
  const stripRef = useRef<THREE.Group>(null);
  const indicatorRef = useRef<THREE.Mesh>(null);
  const pH = calculatePH(contents, chemicalsMap);
  const pHColor = phToColor(pH);

  // Animate dipping into the beaker
  useEffect(() => {
    if (!stripRef.current) return;
    stripRef.current.position.y = height / 2 + 0.5; // start above
    let raf: number;
    const start = performance.now();
    const duration = 800;
    const targetY = liquidTopY - 0.15; // dipped into liquid
    const startY = height / 2 + 0.5;
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease in-out
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (stripRef.current) {
        stripRef.current.position.y = startY + (targetY - startY) * eased;
      }
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [height, liquidTopY]);

  return (
    <group ref={stripRef} position={[radius * 0.3, height / 2 + 0.5, 0]}>
      {/* Paper strip — long thin rectangle */}
      <mesh>
        <boxGeometry args={[0.08, 0.7, 0.005]} />
        <meshStandardMaterial color="#fff8e7" roughness={0.9} />
      </mesh>
      {/* Indicator pad at the tip — colored by pH */}
      <mesh ref={indicatorRef} position={[0, -0.3, 0.003]}>
        <boxGeometry args={[0.07, 0.12, 0.006]} />
        <meshStandardMaterial
          color={pHColor}
          emissive={pHColor}
          emissiveIntensity={0.2}
          roughness={0.5}
        />
      </mesh>
      {/* Strip holder (small ring at top) */}
      <mesh position={[0, 0.36, 0]}>
        <torusGeometry args={[0.05, 0.012, 8, 16]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* pH label floating beside strip */}
      <Html position={[0.18, 0.1, 0]} center distanceFactor={5}>
        <div className="pointer-events-none select-none whitespace-nowrap rounded-md border border-slate-600/50 bg-slate-900/95 px-2 py-1 text-[10px] font-bold shadow-lg backdrop-blur">
          <span style={{ color: pHColor }}>pH {pH.toFixed(1)}</span>
        </div>
      </Html>
    </group>
  );
}
