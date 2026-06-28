"use client";

import { useMemo } from "react";
import { usePlayerStore } from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { RealReagentBottle } from "./RealModels";

/**
 * ChemicalShelfRack — renders all owned chemical bottles on the shelf cabinet
 *
 * The shelf has 3 levels. Bottles are arranged left-to-right on each level.
 * When a new chemical is ordered and delivered, it appears here.
 */

const SHELF_POSITIONS = [
  // Level 1 (bottom shelf, y=0.4)
  { y: 0.45, z: -2.5, startX: 6.0, spacing: 0.16, maxPerRow: 16 },
  // Level 2 (middle shelf, y=1.1)
  { y: 1.15, z: -2.5, startX: 6.0, spacing: 0.16, maxPerRow: 16 },
  // Level 3 (top shelf, y=1.8)
  { y: 1.85, z: -2.5, startX: 6.0, spacing: 0.16, maxPerRow: 16 },
];

export function ChemicalShelfRack() {
  const shelfChemicals = usePlayerStore((s) => s.shelfChemicals);
  const chemicalsMap = useLabStore((s) => s.chemicalsMap);

  // Assign positions to each chemical on the shelf
  const bottlePositions = useMemo(() => {
    const positions: { chemicalId: string; pos: [number, number, number]; index: number }[] = [];
    shelfChemicals.forEach((chemId, idx) => {
      const level = Math.floor(idx / 16);
      const col = idx % 16;
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
