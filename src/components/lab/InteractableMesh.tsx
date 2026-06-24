"use client";

import { useRef, useEffect } from "react";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import {
  usePlayerStore,
  type Interactable,
} from "@/lib/store/player-store";

/**
 * InteractableMesh — wrapper that registers a mesh as interactable
 *
 * Sets userData.interactable on the group so the InteractionSystem
 * raycaster can find it. Shows edges highlight when hovered.
 */
export function InteractableMesh({
  interactable,
  children,
  highlightColor = "#34d399",
}: {
  interactable: Interactable;
  children: React.ReactNode;
  highlightColor?: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const hoveredId = usePlayerStore((s) => s.hoveredInteractable?.id);
  const registerInteractable = usePlayerStore((s) => s.registerInteractable);
  const unregisterInteractable = usePlayerStore((s) => s.unregisterInteractable);
  const isHovered = hoveredId === interactable.id;

  useEffect(() => {
    if (ref.current) {
      // Set interactable data on the group so raycaster can find it
      ref.current.userData.interactable = interactable;
      // Also set on all children so raycast hits work from any child mesh
      ref.current.traverse((child) => {
        child.userData.interactable = interactable;
      });
    }
    registerInteractable(interactable);
    return () => unregisterInteractable(interactable.id);
  }, [interactable, registerInteractable, unregisterInteractable]);

  return (
    <group ref={ref}>
      {children}
      {isHovered && (
        <Edges threshold={15} color={highlightColor} />
      )}
    </group>
  );
}
