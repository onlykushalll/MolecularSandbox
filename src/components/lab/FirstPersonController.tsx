"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import {
  usePlayerStore,
  PLAYER,
  checkCollision,
} from "@/lib/store/player-store";
import { getSoundManager } from "@/lib/sound/sound-manager";

/**
 * FirstPersonController
 *
 * Handles:
 * - PointerLockControls for mouse-look (pitch/yaw)
 * - WASD + Shift sprint movement
 * - AABB collision against lab furniture/walls
 * - Footstep sounds
 * - Key state tracking via refs (not React state, for performance)
 *
 * The player is a cylinder at PLAYER.height (eye level).
 * Movement is camera-relative: W = forward, S = back, A/D = strafe.
 */
export function FirstPersonController() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  // Key state — use ref to avoid re-renders every frame
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  // Footstep timer
  const stepTimer = useRef(0);
  const lastFootstep = useRef(0);

  // Get store actions
  const setLocked = usePlayerStore((s) => s.setLocked);
  const setMoving = usePlayerStore((s) => s.setMoving);
  const setSprinting = usePlayerStore((s) => s.setSprinting);
  const setStartScreen = usePlayerStore((s) => s.setStartScreen);

  // === Keyboard handlers ===
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = true;
          break;
        case "Escape":
          // Exit pointer lock handled by PointerLockControls automatically
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // === Pointer lock change handler ===
  useEffect(() => {
    const onLockChange = () => {
      const locked = document.pointerLockElement === gl.domElement;
      setLocked(locked);
      if (!locked) {
        // Reset keys when unlocked
        keys.current = {
          forward: false,
          backward: false,
          left: false,
          right: false,
          sprint: false,
        };
        setMoving(false);
        setSprinting(false);
      }
    };
    document.addEventListener("pointerlockchange", onLockChange);
    return () => document.removeEventListener("pointerlockchange", onLockChange);
  }, [gl.domElement, setLocked, setMoving, setSprinting]);

  // === Click to lock ===
  const handleCanvasClick = useCallback(() => {
    if (controlsRef.current && !document.pointerLockElement) {
      // Only lock if we're in first-person mode and not on start screen
      const state = usePlayerStore.getState();
      if (state.mode === "first-person" && !state.showStartScreen) {
        controlsRef.current.lock();
      }
    }
  }, []);

  useEffect(() => {
    gl.domElement.addEventListener("click", handleCanvasClick);
    return () => gl.domElement.removeEventListener("click", handleCanvasClick);
  }, [gl.domElement, handleCanvasClick]);

  // === Movement loop ===
  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const moveVec = useRef(new THREE.Vector3());
  const newPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const state = usePlayerStore.getState();
    if (state.mode !== "first-person" || state.showStartScreen) return;

    const { forward, backward, left, right, sprint } = keys.current;
    const isMoving = forward || backward || left || right;

    if (!isMoving) {
      setMoving(false);
      setSprinting(false);
      return;
    }

    const speed = sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    setMoving(true);
    setSprinting(sprint);

    // Get camera direction (forward and right vectors)
    camera.getWorldDirection(forwardVec.current);
    forwardVec.current.y = 0; // keep movement on XZ plane
    forwardVec.current.normalize();

    rightVec.current.crossVectors(forwardVec.current, camera.up);
    rightVec.current.normalize();

    // Compute movement direction
    moveVec.current.set(0, 0, 0);
    if (forward) moveVec.current.add(forwardVec.current);
    if (backward) moveVec.current.sub(forwardVec.current);
    if (right) moveVec.current.add(rightVec.current);
    if (left) moveVec.current.sub(rightVec.current);

    if (moveVec.current.lengthSq() > 0) {
      moveVec.current.normalize().multiplyScalar(speed * delta);
    }

    // Try moving on X axis
    const currentPos = state.position;
    newPos.current.set(
      currentPos[0] + moveVec.current.x,
      currentPos[1],
      currentPos[2]
    );

    let finalX = currentPos[0];
    let finalZ = currentPos[2];

    // Check X movement
    if (
      !checkCollision([newPos.current.x, currentPos[1], currentPos[2]])
    ) {
      finalX = newPos.current.x;
    }

    // Check Z movement
    newPos.current.set(finalX, currentPos[1], currentPos[2] + moveVec.current.z);
    if (
      !checkCollision([finalX, currentPos[1], newPos.current.z])
    ) {
      finalZ = newPos.current.z;
    }

    // Update camera position
    camera.position.set(finalX, PLAYER.height, finalZ);

    // Update store
    usePlayerStore.getState().setPosition([finalX, PLAYER.height, finalZ]);

    // Footstep sounds
    stepTimer.current += delta;
    const stepInterval = sprint ? 0.32 : 0.5;
    if (stepTimer.current - lastFootstep.current > stepInterval) {
      lastFootstep.current = stepTimer.current;
      const sm = getSoundManager();
      // Use the "click" sound as a soft footstep for now
      // (proper footstep sounds can be added to sound-manager later)
      sm.play("click");
    }
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      selector="#enter-lab-btn"
      onLock={() => {
        setLocked(true);
        setStartScreen(false);
      }}
      onUnlock={() => {
        setLocked(false);
      }}
    />
  );
}
