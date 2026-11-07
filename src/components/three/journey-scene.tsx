"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { arcBetween, fibonacciSphere, latLon, randomInSphere } from "./geometry";
import type { Quality } from "./use-quality";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Cross-fades every material under `group` to weight*base opacity. */
function applyWeight(group: THREE.Group | null, w: number) {
  if (!group) return;
  group.visible = w > 0.01;
  group.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (!m) return;
    const base = (m.userData.base ??= m.opacity) as number;
    m.transparent = true;
    m.opacity = base * w;
  });
}

function Galaxy({ low }: { low: boolean }) {
  const stars = useMemo(() => randomInSphere(low ? 160 : 420, 3.4, 11), [low]);
  const key = useMemo(() => {
    const p = [[-2.2, -1.1, 0.2], [-1.2, 0.2, -0.4], [0, -0.5, 0.5], [1.1, 0.7, -0.2], [2.1, -0.2, 0.3], [0.5, 1.7, 0.1], [-0.6, 1.5, -0.5]];
    return p.map((v) => new THREE.Vector3(...v));
  }, []);
  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints([key[0], key[1], key[1], key[2], key[2], key[3], key[3], key[4], key[3], key[5], key[1], key[6], key[6], key[5]]), [key]);
  return (
    <group>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[stars, 3]} /></bufferGeometry>
        <pointsMaterial size={0.035} color="#B6A4FF" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color="#36D9FF" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {key.map((v, i) => (
        <mesh key={i} position={v}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color={i % 2 ? "#36D9FF" : "#B6A4FF"} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

const REGIONS: { name: string; lat: number; lon: number; hero?: boolean }[] = [
  { name: "Bangladesh", lat: 23.7, lon: 90.4, hero: true },
  { name: "Singapore", lat: 1.3, lon: 103.8 },
  { name: "Dubai", lat: 25.2, lon: 55.3 },
  { name: "London", lat: 51.5, lon: -0.1 },
  { name: "Berlin", lat: 52.5, lon: 13.4 },
  { name: "New York", lat: 40.7, lon: -74 },
  { name: "Toronto", lat: 43.7, lon: -79.4 },
];

function Globe({ low }: { low: boolean }) {
  const dots = useMemo(() => fibonacciSphere(low ? 900 : 2200, 1.75), [low]);
  const pins = useMemo(() => REGIONS.map((r) => ({ ...r, pos: latLon(r.lat, r.lon, 1.75) })), []);
  const arcs = useMemo(() => {
    const bd = pins[0].pos;
    return pins.slice(1).map((p) => {
      const g = new THREE.BufferGeometry().setFromPoints(arcBetween(bd, p.pos, 0.35));
      return new THREE.Line(g, new THREE.LineBasicMaterial({ color: "#36D9FF", transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
    });
  }, [pins]);
  return (
    <group>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[dots, 3]} /></bufferGeometry>
        <pointsMaterial size={0.03} color="#5E8DFF" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <mesh>
        <sphereGeometry args={[1.7, 32, 32]} />
        <meshBasicMaterial color="#0D1225" transparent opacity={0.55} />
      </mesh>
      {pins.map((p) => (
        <mesh key={p.name} position={p.pos}>
          <sphereGeometry args={[p.hero ? 0.1 : 0.06, 16, 16]} />
          <meshBasicMaterial color={p.hero ? "#B6A4FF" : "#36D9FF"} transparent opacity={1} />
        </mesh>
      ))}
      {arcs.map((a, i) => <primitive key={i} object={a} />)}
    </group>
  );
}

function Launch() {
  const plane = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Points>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.6, -1.6, 0), new THREE.Vector3(-1, -0.9, 0.4), new THREE.Vector3(0.6, 0.2, 0), new THREE.Vector3(2.4, 1.7, -0.3),
  ]), []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const v = new Float32Array([0.5, 0, 0, -0.35, 0.28, 0, -0.18, 0, 0, 0.5, 0, 0, -0.35, -0.28, 0, -0.18, 0, 0]);
    g.setAttribute("position", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);
  const trailInit = useMemo(() => new Float32Array(90 * 3), []);
  useFrame((s) => {
    const t = (s.clock.elapsedTime * 0.14) % 1;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    if (plane.current) {
      plane.current.position.copy(p);
      plane.current.rotation.z = Math.atan2(tan.y, tan.x);
    }
    if (trail.current) {
      const trailPos = trail.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 90; i++) {
        const u = Math.max(0, t - i * 0.004);
        const q = curve.getPoint(u);
        trailPos[i * 3] = q.x + (Math.sin(i * 1.7) * i) * 0.0025;
        trailPos[i * 3 + 1] = q.y + (Math.cos(i * 1.3) * i) * 0.0025;
        trailPos[i * 3 + 2] = q.z;
      }
      trail.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  return (
    <group>
      <mesh ref={plane} geometry={geo} scale={0.9}>
        <meshBasicMaterial color="#F8FAFC" side={THREE.DoubleSide} transparent opacity={1} />
      </mesh>
      <points ref={trail}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[trailInit, 3]} /></bufferGeometry>
        <pointsMaterial size={0.05} color="#36D9FF" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

function Stage({ progress, low }: { progress: React.MutableRefObject<number>; low: boolean }) {
  const g0 = useRef<THREE.Group>(null);
  const g1 = useRef<THREE.Group>(null);
  const g2 = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const p = progress.current;
    applyWeight(g0.current, 1 - smooth(0.25, 0.4, p));
    applyWeight(g1.current, smooth(0.25, 0.4, p) * (1 - smooth(0.62, 0.75, p)));
    applyWeight(g2.current, smooth(0.62, 0.75, p));
    if (g0.current) g0.current.rotation.y += dt * 0.08;
    if (g1.current) g1.current.rotation.y += dt * 0.22;
    if (root.current) {
      root.current.rotation.y += (state.pointer.x * 0.25 - root.current.rotation.y) * 0.04;
      root.current.rotation.x += (-state.pointer.y * 0.15 - root.current.rotation.x) * 0.04;
    }
    state.camera.position.z += ((p < 0.5 ? 7.2 : p < 0.7 ? 6.6 : 6.9) - state.camera.position.z) * 0.05;
  });
  return (
    <group ref={root}>
      <group ref={g0}><Galaxy low={low} /></group>
      <group ref={g1}><Globe low={low} /></group>
      <group ref={g2}><Launch /></group>
    </group>
  );
}

export default function JourneyScene({ quality, active, progress }: { quality: Exclude<Quality, "static">; active: boolean; progress: React.MutableRefObject<number> }) {
  const low = quality === "low";
  return (
    <Canvas camera={{ position: [0, 0, 7.2], fov: 45 }} dpr={low ? [1, 1.25] : [1, 2]} gl={{ antialias: !low, alpha: true }} frameloop={active ? "always" : "never"} style={{ background: "transparent" }} aria-hidden="true">
      <Stage progress={progress} low={low} />
    </Canvas>
  );
}
