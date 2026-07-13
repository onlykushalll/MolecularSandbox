"use client";

import { useMemo } from "react";
import { usePlayerStore } from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { RealReagentBottle } from "./RealModels";

const SHELF_POSITIONS = [
  { y: 0.45, z: -4.0, startX: -5.5, spacing: 0.16, maxPerRow: 8 },
  { y: 1.15, z: -4.0, startX: -5.5, spacing: 0.16, maxPerRow: 8 },
  { y: 1.85, z: -4.0, startX: -5.5, spacing: 0.16, maxPerRow: 8 },
];

function ShelfGeometry() {
  const baseX = -5.5;
  const z = -4.0;
  const shelfWidth = 8 * 0.16 + 0.1;
  return (
    <group>
      {[0.42, 1.12, 1.82].map((y, i) => (
        <mesh key={i} position={[baseX + shelfWidth / 2 - 0.05, y, z]} receiveShadow>
          <boxGeometry args={[shelfWidth + 0.1, 0.03, 0.18]} />
          <meshStandardMaterial color="#5c6370" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {[0, shelfWidth].map((dx, i) => (
        <mesh key={`leg-${i}`} position={[baseX + dx - 0.05, 1.0, z]}>
          <boxGeometry args={[0.03, 2.0, 0.15]} />
          <meshStandardMaterial color="#4a5060" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function ChemicalShelfRack() {
  const shelfChemicals = usePlayerStore((s) => s.shelfChemicals);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);

  const bottlePositions = useMemo(() => {
    const positions: { chemicalId: string; pos: [number, number, number]; index: number }[] = [];
    shelfChemicals.forEach((chemId, idx) => {
      const level = Math.floor(idx / 8);
      const col = idx % 8;
      if (level < 3) {
        const shelf = SHELF_POSITIONS[level];
        positions.push({
          chemicalId: chemId,
          pos: [shelf.startX + col * shelf.spacing, shelf.y, shelf.z],
          index: idx,
        });
      }
    });
    return positions;
  }, [shelfChemicals]);

  return (
    <group>
      <ShelfGeometry />
      {bottlePositions.map(({ chemicalId, pos, index }) => {
        const chem = chemicalsMap.get(chemicalId);
        if (!chem) return null;
        return (
          <RealReagentBottle
            key={chemicalId}
            chemical={chem}
            position={pos}
            index={index}
          />
        );
      })}
    </group>
  );
}
