"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";

function Bin({ fillPct }: { fillPct: number }) {
  const fill = Math.max(0.05, Math.min(1, fillPct / 100));
  const color = fillPct >= 95 ? "#b42332" : fillPct >= 80 ? "#c38417" : "#0f8b70";
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.45, 1.65, 1.1]} />
        <meshStandardMaterial color="#f3faf7" roughness={0.62} metalness={0.04} transparent opacity={0.34} />
      </mesh>
      <mesh position={[0, -0.68 + fill * 0.58, 0]}>
        <boxGeometry args={[1.2, Math.max(0.06, fill * 1.2), 0.86]} />
        <meshStandardMaterial color={color} roughness={0.78} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.56, 0.13, 1.2]} />
        <meshStandardMaterial color="#173f39" roughness={0.45} />
      </mesh>
      <mesh position={[-0.74, 0.06, 0]}>
        <boxGeometry args={[0.1, 1.78, 1.18]} />
        <meshStandardMaterial color="#d8e8e2" roughness={0.4} />
      </mesh>
      <mesh position={[0.74, 0.06, 0]}>
        <boxGeometry args={[0.1, 1.78, 1.18]} />
        <meshStandardMaterial color="#d8e8e2" roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function BinVisualizationScene({
  fillPct,
  reduceMotion,
}: {
  fillPct: number;
  reduceMotion: boolean;
}) {
  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [3.2, 2.4, 3.2], fov: 42 }}
      dpr={[1, 1.4]}
      gl={{ antialias: true, powerPreference: "low-power" }}
      aria-label="Illustrative simulated bin fill visualization"
    >
      <color attach="background" args={["#eaf3ef"]} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 4, 3]} intensity={2} />
      <Bin fillPct={fillPct} />
      <ContactShadows position={[0, -0.85, 0]} opacity={0.28} scale={5} blur={2} far={2} />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={!reduceMotion} autoRotate={false} />
    </Canvas>
  );
}
