"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Coordinate = { latitude: number; longitude: number };

function RouteLine({ points, reduceMotion }: { points: Coordinate[]; reduceMotion: boolean }) {
  const { curve, markers } = useMemo(() => {
    const xs = points.map((point) => point.longitude);
    const ys = points.map((point) => point.latitude);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const width = Math.max(maxX - minX, 0.0001),
      height = Math.max(maxY - minY, 0.0001);
    const positions = points.map(
      (point, index) =>
        new THREE.Vector3(
          ((point.longitude - minX) / width - 0.5) * 3,
          0.1 + index * 0.025,
          ((point.latitude - minY) / height - 0.5) * 1.7,
        ),
    );
    return { curve: new THREE.CatmullRomCurve3(positions), markers: positions };
  }, [points]);
  const tracer = useRef<THREE.Mesh>(null);
  const startedAt = useRef<number | null>(null);

  useFrame(({ clock, invalidate }) => {
    if (reduceMotion || !tracer.current) return;
    startedAt.current ??= clock.elapsedTime;
    const elapsed = clock.elapsedTime - startedAt.current;
    const duration = 3.8;
    const progress = Math.min(elapsed / duration, 1);
    tracer.current.position.copy(curve.getPoint(progress));
    if (progress < 1) invalidate();
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, Math.max(points.length * 8, 24), 0.025, 6, false]} />
        <meshStandardMaterial color="#0f766e" roughness={0.55} />
      </mesh>
      {markers.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial color={index === 0 ? "#d18e22" : "#154d43"} />
        </mesh>
      ))}
      {!reduceMotion && (
        <mesh ref={tracer} position={markers[0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#f3b84b" emissive="#d18e22" emissiveIntensity={0.32} />
        </mesh>
      )}
    </group>
  );
}

export default function RouteVisualizationScene({
  points,
  reduceMotion,
}: {
  points: Coordinate[];
  reduceMotion: boolean;
}) {
  if (points.length < 2) return null;
  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [0, 3.3, 4.7], fov: 42 }}
      dpr={[1, 1.3]}
      gl={{ antialias: true, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <color attach="background" args={["#eaf3ef"]} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[3, 4, 3]} intensity={1.8} />
      <gridHelper args={[5, 12, "#c4d9d0", "#d6e5de"]} position={[0, -0.08, 0]} />
      <RouteLine points={points} reduceMotion={reduceMotion} />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={!reduceMotion} autoRotate={false} />
    </Canvas>
  );
}
