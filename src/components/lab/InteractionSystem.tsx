"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  usePlayerStore,
  PLAYER,
  type Interactable,
} from "@/lib/store/player-store";
import { getSoundManager } from "@/lib/sound/sound-manager";

/**
 * InteractionSystem
 *
 * Uses a center-screen raycaster to detect what the player is looking at.
 * - Highlights interactable objects on hover
 * - Shows a floating prompt ("[E] Pick up HCl bottle")
 * - Handles click (E key) to trigger interactions
 *
 * This component renders no visible 3D geometry — it's pure logic.
 * The crosshair and prompt are rendered as HTML overlays in the parent.
 */
export function InteractionSystem({
  onInteract,
}: {
  onInteract?: (interactable: Interactable) => void;
}) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const [hovered, setHovered] = useState<Interactable | null>(null);
  const interactCooldown = useRef(0);

  const setHoveredInteractable = usePlayerStore((s) => s.setHoveredInteractable);
  const isLocked = usePlayerStore((s) => s.isLocked);
  const mode = usePlayerStore((s) => s.mode);
  const showStartScreen = usePlayerStore((s) => s.showStartScreen);

  // === Raycast every frame to find what player is looking at ===
  useFrame((_, delta) => {
    if (mode !== "first-person" || showStartScreen || !isLocked) {
      if (hovered) {
        setHovered(null);
        setHoveredInteractable(null);
      }
      return;
    }

    interactCooldown.current = Math.max(0, interactCooldown.current - delta);

    // Raycast from camera center
    raycaster.current.setFromCamera(
      new THREE.Vector2(0, 0),
      camera
    );
    raycaster.current.far = PLAYER.reach;

    const intersects = raycaster.current.intersectObjects(
      scene.children,
      true
    );

    // Find first interactable object (walk up the parent chain to find userData.interactable)
    let foundInteractable: Interactable | null = null;
    for (const hit of intersects) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (obj.userData?.interactable) {
          foundInteractable = obj.userData.interactable as Interactable;
          break;
        }
        obj = obj.parent;
      }
      if (foundInteractable) break;
    }

    if (foundInteractable?.id !== hovered?.id) {
      setHovered(foundInteractable);
      setHoveredInteractable(foundInteractable);
      if (foundInteractable) {
        // subtle hover sound could go here
      }
    }
  });

  // === Handle LEFT-CLICK = interact/use (E key also works) ===
  const handleInteract = useCallback(() => {
    if (interactCooldown.current > 0) return;
    const current = usePlayerStore.getState().hoveredInteractable;
    if (!current) return;
    interactCooldown.current = 0.3;
    const sm = getSoundManager();
    sm.play("click");
    onInteract?.(current);
  }, [onInteract]);

  // === Handle RIGHT-CLICK = pick up / grab ===
  const handlePickup = useCallback(() => {
    if (interactCooldown.current > 0) return;
    const current = usePlayerStore.getState().hoveredInteractable;
    if (!current) return;
    interactCooldown.current = 0.3;
    const sm = getSoundManager();
    sm.play("click");
    // For bottles: pick up. For beakers: select. For others: same as interact
    onInteract?.(current);
  }, [onInteract]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.code === "KeyE" || e.code === "Enter") {
        e.preventDefault();
        handleInteract();
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      if (e.button === 0) {
        // LEFT-CLICK = interact/use
        handleInteract();
      } else if (e.button === 2) {
        // RIGHT-CLICK = pick up / grab
        e.preventDefault();
        handlePickup();
      }
    };
    // Prevent context menu on right-click
    const onContextMenu = (e: MouseEvent) => { e.preventDefault(); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, [handleInteract, handlePickup]);

  return null;
}
