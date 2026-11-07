"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { fibonacciSphere, randomInSphere } from "./geometry";
import type { Quality } from "./use-quality";

const COLORS = ["#36D9FF", "#4D7CFE", "#8B5CF6", "#B6A4FF"];

function CareerSphere({ low }: { low: boolean }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const dots = useMemo(() => fibonacciSphere(low ? 700 : 1800, 1.7), [low]);
  const ambient = useMemo(() => randomInSphere(low ? 250 : 800, 7, 7), [low]);

  const nodes = useMemo(() => {
    const n = low ? 8 : 13;
    const pts = fibonacciSphere(n, 1).map((v) => v);
    return Array.from({ length: n }, (_, i) => {
      const dir = new THREE.Vector3(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
      const radius = 2.5 + (i % 3) * 0.45;
      return { pos: dir.multiplyScalar(radius), color: COLORS[i % COLORS.length], speed: 0.4 + (i % 4) * 0.12 };
    });
  }, [low]);

  const lines = useMemo(() => {
    const arr: number[] = [];
    nodes.forEach((n) => {
      const d = n.pos.clone().setLength(1.72);
      arr.push(d.x, d.y, d.z, n.pos.x, n.pos.y, n.pos.z);
    });
    return new Float32Array(arr);
  }, [nodes]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (core.current) { core.current.rotation.y += dt * 0.18; core.current.rotation.x = Math.sin(t * 0.2) * 0.12; }
    if (group.current) {
      const { x, y } = state.pointer;
      group.current.rotation.y += (x * 0.45 - group.current.rotation.y) * 0.04;
      group.current.rotation.x += (-y * 0.3 - group.current.rotation.x) * 0.04;
    }
    nodeRefs.current.forEach((m, i) => {
      if (!m) return;
      const s = 1 + Math.sin(t * nodes[i].speed * 2 + i) * 0.25;
      m.scale.setScalar(s);
    });
  });

  return (
    <group ref={group}>
      <group ref={core}>
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[dots, 3]} /></bufferGeometry>
          <pointsMaterial size={low ? 0.045 : 0.034} color="#6FA3FF" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>
        <mesh>
          <icosahedronGeometry args={[1.45, 2]} />
          <meshBasicMaterial color="#4D7CFE" wireframe transparent opacity={0.16} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color="#8B5CF6" transparent opacity={0.14} />
        </mesh>
        <lineSegments>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[lines, 3]} /></bufferGeometry>
          <lineBasicMaterial color="#36D9FF" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
        </lineSegments>
        {nodes.map((n, i) => (
          <mesh key={i} position={n.pos} ref={(m) => { if (m) nodeRefs.current[i] = m; }}>
            <sphereGeometry args={[0.085, 16, 16]} />
            <meshBasicMaterial color={n.color} />
          </mesh>
        ))}
      </group>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[ambient, 3]} /></bufferGeometry>
        <pointsMaterial size={0.02} color="#B6A4FF" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

export default function HeroScene({ quality, active }: { quality: Exclude<Quality, "static">; active: boolean }) {
  const low = quality === "low";
  return (
    <Canvas
      camera={{ position: [0, 0, 7.4], fov: 45 }}
      dpr={low ? [1, 1.25] : [1, 2]}
      gl={{ antialias: !low, alpha: true, powerPreference: low ? "default" : "high-performance" }}
      frameloop={active ? "always" : "never"}
      style={{ background: "transparent" }}
      aria-hidden="true"
    >
      <CareerSphere low={low} />
    </Canvas>
  );
}
