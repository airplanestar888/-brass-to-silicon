import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../../store/simStore';

export function ModernScene() {
  const xray = useSimStore((s) => s.xray);
  const powerOn = useSimStore((s) => s.modPowerOn);
  const mode = useSimStore((s) => s.modMode);
  const progress = useSimStore((s) => s.modProgress);

  const togglePower = useSimStore((s) => s.toggleModPower);
  const tickModern = useSimStore((s) => s.tickModern);
  const setHoveredPart = useSimStore((s) => s.setHoveredPart);

  const fanRef = useRef<THREE.Group>(null);
  const cpuCellRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const gridIndices = useMemo(() => {
    const arr: { row: number; col: number; idx: number }[] = [];
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        arr.push({ row: r, col: c, idx: r * 16 + c });
      }
    }
    return arr;
  }, []);

  useFrame(({ clock }, dt) => {
    tickModern(dt);
    const state = useSimStore.getState();
    const t = state.remotionMode ? state.remotionTimeSec : clock.elapsedTime;

    // Smooth whisper-quiet cooling fan rotation
    if (fanRef.current && state.modPowerOn) {
      if (state.remotionMode) {
        fanRef.current.rotation.y = -t * (state.modRunning ? 14 : 6);
      } else {
        fanRef.current.rotation.y -= dt * (state.modRunning ? 14 : 6);
      }
    }

    // Update 16x16 silicon die cores illumination
    const activeCount = Math.floor(state.modProgress);

    for (let i = 0; i < 256; i++) {
      const mat = cpuCellRefs.current[i];
      if (!mat) continue;

      if (!state.modPowerOn) {
        mat.color.set('#1F2633');
        mat.emissive.set('#000000');
        mat.emissiveIntensity = 0;
      } else if (i < activeCount) {
        const isFreshHead = state.modMode === 'CPU' && i >= activeCount - 4 && state.modRunning;
        if (state.modMode === 'GPU') {
          mat.color.set('#D9FF00');
          mat.emissive.set('#C8F500');
          mat.emissiveIntensity = 1.4 + Math.sin(t * 6 + i * 0.05) * 0.2;
        } else {
          mat.color.set(isFreshHead ? '#D9FF00' : '#4C9EFF');
          mat.emissive.set(isFreshHead ? '#D9FF00' : '#2563EB');
          mat.emissiveIntensity = isFreshHead ? 2.4 : 0.85;
        }
      } else {
        mat.color.set('#283142');
        mat.emissive.set('#0E1624');
        mat.emissiveIntensity = 0.25;
      }
    }
  });

  return (
    <group position={[0, -0.35, 0]}>
      {/* Anodized Space-Gray Precision Aluminum Unibody Base */}
      <mesh position={[0, 0.02, 0]} castShadow={!xray} receiveShadow>
        <boxGeometry args={[3.9, 0.34, 2.4]} />
        <meshStandardMaterial
          key={xray ? 'unibody-xray' : 'unibody-solid'}
          color="#3A3E45"
          metalness={0.82}
          roughness={0.28}
          transparent={xray}
          opacity={xray ? 0.16 : 1}
          depthWrite={!xray}
        />
      </mesh>

      {/* Matte Black Multi-layer PCB */}
      <mesh position={[0, 0.21, 0]} receiveShadow>
        <boxGeometry args={[3.65, 0.06, 2.15]} />
        <meshStandardMaterial color="#141619" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Machined Aluminum Heatsink Fin Stack (Left — partially hidden in X-Ray) */}
      <group position={[-1.08, 0.48, 0]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[-0.45 + i * 0.082, 0, 0]} castShadow={!xray}>
            <boxGeometry args={[0.024, 0.44, 1.55]} />
            <meshStandardMaterial
              key={xray ? `fin-xray-${i}` : `fin-solid-${i}`}
              color="#C4C9D0"
              metalness={0.9}
              roughness={0.24}
              transparent={xray}
              opacity={xray ? 0.18 : 1}
              depthWrite={!xray}
            />
          </mesh>
        ))}

        {/* Axial Cooling Fan */}
        <group position={[0, 0.26, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.56, 0.04, 12, 32]} />
            <meshStandardMaterial color="#23262B" roughness={0.4} metalness={0.4} />
          </mesh>
          <group ref={fanRef}>
            <mesh>
              <cylinderGeometry args={[0.14, 0.14, 0.08, 16]} />
              <meshStandardMaterial color="#181A1E" metalness={0.6} roughness={0.3} />
            </mesh>
            {Array.from({ length: 7 }).map((_, i) => {
              const ang = (i * Math.PI * 2) / 7;
              return (
                <mesh
                  key={i}
                  position={[Math.cos(ang) * 0.32, 0, Math.sin(ang) * 0.32]}
                  rotation={[0.28, -ang, 0]}
                >
                  <boxGeometry args={[0.36, 0.02, 0.12]} />
                  <meshStandardMaterial color="#2D3138" roughness={0.4} />
                </mesh>
              );
            })}
          </group>
        </group>
      </group>

      {/* Dual Copper Heatpipes running from Silicon Die to Fin Stack */}
      {[-0.24, 0.24].map((z, idx) => (
        <mesh key={idx} position={[-0.35, 0.29, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 1.75, 16]} />
          <meshStandardMaterial color="#B96E3D" metalness={0.88} roughness={0.22} />
        </mesh>
      ))}

      {/* Exposed Nanometer Silicon Die Package + 16x16 Core Matrix (Right Center) */}
      <group position={[0.62, 0.28, 0]}>
        {/* Green/Dark Substrate Package */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.68, 0.06, 1.68]} />
          <meshStandardMaterial color="#1E4631" roughness={0.4} metalness={0.25} />
        </mesh>

        {/* Brushed Nickel Integrated Heat Spreader Frame (lifts cleanly in X-Ray) */}
        {!xray && (
          <mesh position={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[1.45, 0.04, 1.45]} />
            <meshStandardMaterial color="#AEB5BF" metalness={0.9} roughness={0.22} transparent opacity={0.18} />
          </mesh>
        )}

        {/* Iridescent Mirror Silicon Wafer Die */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[1.28, 0.03, 1.28]} />
          <meshStandardMaterial color="#1E2532" metalness={0.92} roughness={0.14} />
        </mesh>

        {/* 16x16 Parallel Compute Core Grid */}
        {gridIndices.map(({ row, col, idx }) => (
          <mesh
            key={idx}
            position={[-0.54 + col * 0.072, 0.065, -0.54 + row * 0.072]}
          >
            <boxGeometry args={[0.056, 0.018, 0.056]} />
            <meshStandardMaterial
              ref={(el) => {
                cpuCellRefs.current[idx] = el;
              }}
              color="#1F2633"
              roughness={0.25}
              metalness={0.4}
            />
          </mesh>
        ))}

        {/* Mode Indicator Label Plate: CPU vs GPU active silhouette */}
        <mesh position={[0, -0.02, 0.94]}>
          <boxGeometry args={[1.2, 0.03, 0.06]} />
          <meshStandardMaterial
            color={powerOn ? (mode === 'GPU' ? '#D9FF00' : '#3B82F6') : '#32363E'}
            emissive={powerOn ? (mode === 'GPU' ? '#D9FF00' : '#3B82F6') : '#000000'}
            emissiveIntensity={powerOn ? 1.5 : 0}
          />
        </mesh>
      </group>

      {/* Precision Anodized Capacitive Power Button (Front Right Corner — Clickable!) */}
      <group
        position={[1.68, 0.25, 0.92]}
        onClick={(e) => {
          e.stopPropagation();
          togglePower();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart(powerOn ? 'Power Button (ON — Click to Sleep)' : 'Power Button (Click for Instant Wake)');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.04, 28]} />
          <meshStandardMaterial color="#C8CDD4" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Glowing Ring Indicator */}
        <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.085, 0.115, 28]} />
          <meshStandardMaterial
            color={powerOn ? (progress >= 256 ? '#D9FF00' : '#FFFFFF') : '#4B5058'}
            emissive={powerOn ? '#D9FF00' : '#000000'}
            emissiveIntensity={powerOn ? 1.8 : 0}
          />
        </mesh>
      </group>
    </group>
  );
}
