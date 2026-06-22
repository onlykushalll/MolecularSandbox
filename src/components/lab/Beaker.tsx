"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Text } from "@react-three/drei";
import * as THREE from "three";
import { useLabStore } from "@/lib/store/lab-store";
import type { ContainerState } from "@/lib/chemistry/types";
import { mixHexColors } from "@/lib/chemistry/mixture";

interface BeakerProps {
  container: ContainerState;
}

export function Beaker({ container }: BeakerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const wobbleRef = useRef(0);

  const { selectContainer, setHoveredContainer, selectedContainerId, hoveredContainerId, chemicalsMap } =
    useLabStore();
  const isSelected = selectedContainerId === container.id;
  const isHovered = hoveredContainerId === container.id;

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

  useFrame((state, delta) => {
    wobbleRef.current += delta;
    if (liquidRef.current && liquidHeight > 0) {
      const wobble = Math.sin(wobbleRef.current * 3) * 0.005 * fillRatio;
      liquidRef.current.scale.y = Math.max(0.01, liquidHeight + wobble);
    }
    if (groupRef.current && container.isHeating) {
      // Slight vibration when heating
      groupRef.current.position.y =
        container.position[1] + Math.sin(wobbleRef.current * 20) * 0.002;
    }
  });

  return (
    <group
      ref={groupRef}
      position={container.position}
      rotation={container.rotation}
      onClick={(e) => {
        e.stopPropagation();
        selectContainer(container.id);
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
        {(isSelected || isHovered) && (
          <Edges color={isSelected ? "#22c55e" : "#88ccff"} linewidth={2} />
        )}
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

      {/* Bubbles when gas evolved or heating */}
      {(container.isHeating || container.temperature > 50) && liquidHeight > 0.01 && (
        <Bubbles
          count={Math.floor(container.temperature / 10)}
          radius={radius * 0.85}
          baseY={-height / 2}
          topY={-height / 2 + liquidHeight}
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
        color={isSelected ? "#22c55e" : "#1f2937"}
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
