"use client";

import { useRef, useMemo, Suspense, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { usePlayerStore, type Interactable } from "@/lib/store/player-store";
import { useLabStore } from "@/lib/store/lab-store";
import { InteractableMesh } from "./InteractableMesh";
import { mixHexColors } from "@/lib/chemistry/mixture";

// LazyModel — only loads GLB when player is within renderDistance
function LazyModel({ url, position, rotation = [0,0,0] as [number,number,number], scale = 1, renderDistance = 5 }: {
  url: string; position: [number,number,number]; rotation?: [number,number,number]; scale?: number; renderDistance?: number;
}) {
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const check = () => {
      const p = usePlayerStore.getState().position;
      const dx = p[0]-position[0], dz = p[2]-position[2];
      setLoad(Math.sqrt(dx*dx+dz*dz) < renderDistance);
    };
    check();
    const iv = setInterval(check, 500);
    return () => clearInterval(iv);
  }, [position, renderDistance]);
  if (!load) return null;
  return <Suspense fallback={null}><Loaded url={url} position={position} rotation={rotation} scale={scale} /></Suspense>;
}

function Loaded({ url, position, rotation, scale }: { url:string; position:[number,number,number]; rotation:[number,number,number]; scale:number }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const max = Math.max(size.x, size.y, size.z);
    const s = max > 0 ? scale/max : scale;
    c.position.sub(center.multiplyScalar(s));
    c.scale.setScalar(s);
    c.traverse((ch) => { if (ch instanceof THREE.Mesh) { ch.castShadow = true; ch.receiveShadow = true; } });
    return c;
  }, [scene, scale]);
  return <group position={position} rotation={rotation}><primitive object={cloned} /></group>;
}

// === COMPONENTS ===
export function RealFumeHood() {
  const i: Interactable = { id:"fume-hood", kind:"fume-hood", label:"Fume Hood", position:[0,0,-5], action:"Use fume hood" };
  return <InteractableMesh interactable={i} highlightColor="#ef4444"><LazyModel url="/models/fume_cupboards.glb" position={[0,0,-5]} scale={2} renderDistance={8} /><pointLight position={[0,2,-4.8]} intensity={0.3} distance={3} /></InteractableMesh>;
}
export function RealLabBench({ position = [0,0,0] as [number,number,number] }) {
  const i: Interactable = { id:"main-bench", kind:"beaker", label:"Workbench", position, action:"Work here" };
  return <InteractableMesh interactable={i}><LazyModel url="/models/lab_bench.glb" position={position} scale={2.5} renderDistance={8} /></InteractableMesh>;
}
export function RealSafetyCabinet({ position = [-7,0,-2] as [number,number,number] }) {
  const i: Interactable = { id:"safety-cabinet", kind:"storage-shelf", label:"Flammable Storage", position, action:"Store flammables" };
  return <InteractableMesh interactable={i} highlightColor="#f59e0b"><LazyModel url="/models/06_safety_cabinet_yellow.glb" position={position} scale={1} renderDistance={6} /></InteractableMesh>;
}
export function RealBunsenBurner({ position = [-1,1,0.3] as [number,number,number] }) {
  const isOn = usePlayerStore(s=>s.bunsenOn);
  const i: Interactable = { id:"bunsen-burner", kind:"bunsen-burner", label:"Bunsen Burner", position, action: isOn?"Turn off":"Ignite" };
  return <InteractableMesh interactable={i} highlightColor="#f59e0b"><LazyModel url="/models/bunsen_burner.glb" position={position} scale={0.3} renderDistance={4} />{isOn&&<Flame position={[position[0],position[1]+0.1,position[2]]} />}</InteractableMesh>;
}
export function RealHotPlate({ position = [-2.5,1,-0.3] as [number,number,number] }) {
  const isOn = usePlayerStore(s=>s.hotPlateOn);
  const i: Interactable = { id:"hot-plate", kind:"bunsen-burner", label:"Hot Plate", position, action: isOn?"Turn off":"Turn on" };
  return <InteractableMesh interactable={i} highlightColor="#f59e0b"><LazyModel url="/models/02_hot_plate_magnetic_stirrer.glb" position={position} scale={0.2} renderDistance={4} />{isOn&&<pointLight position={[position[0],position[1]+0.03,position[2]]} color="#ff3300" intensity={0.3} distance={0.3} />}</InteractableMesh>;
}
export function RealAnalyticalBalance({ position = [2.5,1,0.5] as [number,number,number] }) {
  const sel = useLabStore(s=>s.selectedContainerId);
  const containers = useLabStore(s=>s.containers);
  const hov = usePlayerStore(s=>s.hoveredInteractable?.id);
  const mass = useMemo(() => { if(!sel) return 0; const c=containers.find(c=>c.id===sel); return c?c.contents.reduce((s,cc)=>s+cc.moles,0)*100:0; }, [sel,containers]);
  const i: Interactable = { id:"analytical-balance", kind:"apparatus" as any, label:"Balance", position, action:`Mass: ${mass.toFixed(3)}g` };
  return <InteractableMesh interactable={i} highlightColor="#22d3ee"><LazyModel url="/models/04_analytical_balance.glb" position={position} scale={0.25} renderDistance={4} />{hov==="analytical-balance"&&<Html position={[position[0],position[1]+0.12,position[2]]} center distanceFactor={3} occlude><div className="rounded bg-black/80 px-2 py-1 font-mono text-xs font-bold text-cyan-300">{mass.toFixed(3)} g</div></Html>}</InteractableMesh>;
}
export function RealRingStand({ position = [2.5,1,-0.5] as [number,number,number] }) {
  return <LazyModel url="/models/03_ring_retort_stand.glb" position={position} scale={0.3} renderDistance={4} />;
}
export function RealBurette({ position = [2.5,1.5,-0.3] as [number,number,number] }) {
  return <LazyModel url="/models/05_burette_50ml.glb" position={position} scale={0.2} renderDistance={4} />;
}
export function RealCentrifuge({ position = [3,1,-0.5] as [number,number,number] }) {
  const i: Interactable = { id:"centrifuge", kind:"apparatus" as any, label:"Centrifuge", position, action:"Toggle" };
  return <InteractableMesh interactable={i} highlightColor="#22d3ee"><LazyModel url="/models/13_centrifuge.glb" position={position} scale={0.25} renderDistance={4} /></InteractableMesh>;
}
export function RealDesiccator({ position = [-2,1,-0.5] as [number,number,number] }) {
  return <LazyModel url="/models/12_desiccator.glb" position={position} scale={0.15} renderDistance={4} />;
}
export function RealLabCoat({ position = [-6.5,1,4.5] as [number,number,number] }) {
  const i: Interactable = { id:"lab-coat", kind:"safety-station", label:"Lab Coat", position, action:"Put on coat" };
  return <InteractableMesh interactable={i} highlightColor="#22c55e"><LazyModel url="/models/07_lab_coat_hanging.glb" position={position} scale={0.4} renderDistance={6} /></InteractableMesh>;
}

// === BEAKER (procedural, lightweight, always renders) ===
export function RealBeaker({ container }: { container: any }) {
  const heldItem = usePlayerStore(s=>s.heldItem);
  const sel = useLabStore(s=>s.selectedContainerId);
  const chems = useLabStore(s=>s.chemicalsMap);
  const hov = usePlayerStore(s=>s.hoveredInteractable?.id);
  const isHov = hov === `beaker-${container.id}`;
  const isSel = sel === container.id;
  const i: Interactable = { id:`beaker-${container.id}`, kind:"beaker", label:`Beaker (${container.id})`, position:container.position, containerId:container.id, action: heldItem?.type==="chemical"?`Pour into ${container.id}`:`Select ${container.id}` };
  const { lc, fl, tv } = useMemo(() => {
    if(!container.contents.length) return { lc:"#a8c8e0", fl:0, tv:0 };
    const cols: {hex:string;moles:number}[] = []; let v=0;
    for(const cc of container.contents) { const ch=chems.get(cc.chemicalId); if(ch){cols.push({hex:ch.hexColor,moles:cc.moles}); v+=cc.volume;} }
    const m = mixHexColors(cols); const c = m.hex==="#ffffff"||m.hex==="#88ccff"?"#a8c8e0":m.hex;
    return { lc:c, fl:Math.min(0.85,(v/container.capacity)*0.85), tv:v };
  }, [container.contents, container.capacity, chems]);
  const tg = container.temperature>60?"#ff3300":container.temperature<10?"#3399ff":null;
  const r=0.05, h=0.14;
  return <InteractableMesh interactable={i} highlightColor={heldItem?.type==="chemical"?"#22d3ee":"#34d399"}>
    <group position={container.position}>
      <mesh><cylinderGeometry args={[r,r*0.95,h,24,1,true]} /><meshPhysicalMaterial color="#e8f5f4" transparent opacity={0.22} roughness={0.02} transmission={0.92} ior={1.5} clearcoat={1} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0,-h/2,0]}><cylinderGeometry args={[r*0.95,r*0.95,0.01,24]} /><meshPhysicalMaterial color="#e8f5f4" transparent opacity={0.3} transmission={0.85} ior={1.5} /></mesh>
      {fl>0 && <><mesh position={[0,(fl*h)/2,0]}><cylinderGeometry args={[r*0.93,r*0.9,fl*h,24]} /><meshStandardMaterial color={lc} roughness={0.15} emissive={tg||lc} emissiveIntensity={tg?0.3:0.08} /></mesh><mesh position={[0,fl*h,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[r*0.92,24]} /><meshStandardMaterial color={lc} roughness={0.1} emissive={tg||lc} emissiveIntensity={tg?0.3:0.08} /></mesh></>}
      {tg&&fl>0&&<pointLight position={[0,h/2,0]} color={tg} intensity={0.4} distance={0.4} />}
      {isSel&&<mesh position={[0,0.001,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[r+0.02,r+0.03,32]} /><meshBasicMaterial color="#34d399" transparent opacity={0.5} side={THREE.DoubleSide} /></mesh>}
      {(isHov||isSel)&&<Html position={[0,h+0.08,0]} center distanceFactor={3} occlude><div className={`rounded-md border px-2 py-1 backdrop-blur-md ${isSel?"border-emerald-500/60 bg-emerald-950/90":"border-slate-600/50 bg-slate-950/90"}`}><div className={`text-[11px] font-bold ${isSel?"text-emerald-300":"text-slate-200"}`}>{container.id.toUpperCase()}</div><div className="font-mono text-[9px] text-slate-400">{container.temperature.toFixed(0)}°C · {tv.toFixed(0)}mL</div></div></Html>}
    </group>
  </InteractableMesh>;
}

// === REAGENT BOTTLE ===
export function RealReagentBottle({ chemical, position }: { chemical: any; position: [number,number,number] }) {
  const held = usePlayerStore(s=>s.heldItem);
  const isHeld = held?.type==="chemical"&&held.chemicalId===chemical.id;
  const hov = usePlayerStore(s=>s.hoveredInteractable?.id);
  const isHov = hov === `bottle-${chemical.id}`;
  const i: Interactable = { id:`bottle-${chemical.id}`, kind:"chemical-bottle", label:`${chemical.name} (${chemical.formula})`, position, chemicalId:chemical.id, action: isHeld?"Put down":`Pick up ${chemical.name}` };
  if (isHeld) return null;
  return <InteractableMesh interactable={i} highlightColor="#f59e0b">
    <group position={position}>
      <LazyModel url="/models/01_reagent_bottle_100ml.glb" position={[0,0,0]} scale={0.12} renderDistance={4} />
      <mesh position={[0,0.06,0]}><sphereGeometry args={[0.006,8,8]} /><meshStandardMaterial color={chemical.hexColor} emissive={chemical.hexColor} emissiveIntensity={0.3} /></mesh>
      {isHov&&<Html position={[0,0.1,0]} center distanceFactor={3} occlude><div className="rounded-md border border-amber-500/50 bg-slate-950/90 px-2 py-1 backdrop-blur-md"><div className="text-[11px] font-bold text-amber-300">{chemical.name}</div><div className="font-mono text-[9px] text-slate-400">{chemical.formula}</div><div className="text-[8px] text-emerald-400">[E] to pick up</div></div></Html>}
    </group>
  </InteractableMesh>;
}

// === FLAME EFFECT ===
function Flame({ position }: { position: [number,number,number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(s => { if(ref.current) ref.current.scale.y = 1+Math.sin(s.clock.elapsedTime*8)*0.1; });
  return <group ref={ref} position={position}>
    <pointLight color="#ff6600" intensity={2} distance={2} decay={1.5} />
    <mesh position={[0,0.08,0]}><coneGeometry args={[0.03,0.15,12]} /><meshBasicMaterial color="#ff5500" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    <mesh position={[0,0.06,0]}><coneGeometry args={[0.02,0.12,8]} /><meshBasicMaterial color="#00bbff" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
  </group>;
}

export function preloadAllModels() {
  try { useGLTF.preload("/models/lab_bench.glb"); } catch {}
  try { useGLTF.preload("/models/fume_cupboards.glb"); } catch {}
}
