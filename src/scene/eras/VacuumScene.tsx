import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../../store/simStore';
import { createGaugeFaceTexture } from '../materials';

export function VacuumScene() {
  const xray = useSimStore((s) => s.xray);
  const heaterOn = useSimStore((s) => s.tubeHeaterOn);
  const hvOn = useSimStore((s) => s.tubeHvOn);
  const burnedIdx = useSimStore((s) => s.tubeBurnedIdx);

  const toggleHeater = useSimStore((s) => s.toggleTubeHeater);
  const toggleHv = useSimStore((s) => s.toggleTubeHv);
  const replaceTube = useSimStore((s) => s.replaceTube);
  const tickVacuum = useSimStore((s) => s.tickVacuum);
  const setHoveredPart = useSimStore((s) => s.setHoveredPart);

  const heaterLeverRef = useRef<THREE.Mesh>(null);
  const hvLeverRef = useRef<THREE.Mesh>(null);
  const needleRef = useRef<THREE.Group>(null);
  const filamentRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([null, null, null, null]);
  const plasmaRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([null, null, null, null]);
  const lightRef = useRef<THREE.PointLight>(null);

  const gaugeTex = useMemo(() => createGaugeFaceTexture('kW LOAD'), []);

  useFrame(({ clock }, dt) => {
    tickVacuum(dt);
    const state = useSimStore.getState();
    const snap = state.remotionMode ? 1 : Math.min(1, dt * 16);

    // Toggle levers
    if (heaterLeverRef.current) {
      heaterLeverRef.current.rotation.x = THREE.MathUtils.lerp(
        heaterLeverRef.current.rotation.x,
        state.tubeHeaterOn ? -0.45 : 0.45,
        snap
      );
    }
    if (hvLeverRef.current) {
      hvLeverRef.current.rotation.x = THREE.MathUtils.lerp(
        hvLeverRef.current.rotation.x,
        state.tubeHvOn ? -0.45 : 0.45,
        snap
      );
    }

    // Analog wattmeter needle deflection
    if (needleRef.current) {
      const heatRatio = Math.max(0, (state.tubeTemp - 25) / 900);
      const loadRatio = state.tubeHeaterOn
        ? 0.35 + heatRatio * 0.32 + (state.tubeHvOn ? 0.25 : 0) + (state.tubeStress ? 0.14 : 0)
        : 0;
      const clamped = Math.min(1.05, loadRatio);
      // Gauge arc runs from +2.05 rad (left) to -2.05 rad (right)
      const targetRot = 1.95 - clamped * 3.85;
      needleRef.current.rotation.z = THREE.MathUtils.lerp(
        needleRef.current.rotation.z,
        targetRot,
        state.remotionMode ? 1 : Math.min(1, dt * 6)
      );
    }

    const warmFactor = THREE.MathUtils.clamp((state.tubeTemp - 110) / 520, 0, 1);
    const overFactor = THREE.MathUtils.clamp((state.tubeTemp - 720) / 220, 0, 1);
    const t = state.remotionMode ? state.remotionTimeSec : clock.elapsedTime;

    for (let i = 0; i < 4; i++) {
      const isBurned = state.tubeBurnedIdx === i;
      const fMat = filamentRefs.current[i];
      if (fMat) {
        if (isBurned) {
          fMat.emissiveIntensity = 0;
          fMat.color.set('#141414');
        } else {
          const pulse = state.tubeComputing ? 0.35 * Math.sin(t * 28 + i * 1.9) : 0;
          const intensity = warmFactor * (2.6 + overFactor * 3.2 + pulse);
          fMat.emissive.set(overFactor > 0.5 ? '#FF9A3C' : '#FF5A00');
          fMat.emissiveIntensity = intensity;
          fMat.color.set(warmFactor > 0.1 ? '#FF7722' : '#555555');
        }
      }

      const pMat = plasmaRefs.current[i];
      if (pMat) {
        if (isBurned || !state.tubeHvOn) {
          pMat.opacity = 0;
        } else {
          const activeBit =
            state.tubeComputing
              ? 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 22 + i * 1.4))
              : state.tubeResult === 8 && i === 0
                ? 0.42
                : 0.16;
          pMat.opacity = activeBit;
        }
      }
    }

    if (lightRef.current) {
      lightRef.current.intensity = state.tubeBurnedIdx !== null && !state.tubeHeaterOn ? 0 : warmFactor * 2.4;
    }
  });

  return (
    <group position={[0, -0.35, 0]}>
      {/* Warm orange point light emitted by glowing filaments */}
      <pointLight ref={lightRef} position={[0, 0.9, 0.2]} color="#FF6E1A" intensity={0} distance={4.5} />

      {/* Brushed Galvanized Steel Chassis Box */}
      <mesh position={[0, -0.1, 0]} receiveShadow castShadow={!xray}>
        <boxGeometry args={[4.2, 0.55, 2.1]} />
        <meshStandardMaterial
          key={xray ? 'vac-xray' : 'vac-solid'}
          color="#767C82"
          metalness={0.68}
          roughness={0.42}
          transparent={xray}
          opacity={xray ? 0.18 : 1}
          depthWrite={!xray}
        />
      </mesh>

      {/* Internal Wiring & Transformer Core exposed under X-Ray */}
      {xray && (
        <group position={[0, -0.1, 0]}>
          <mesh position={[-1.35, 0, -0.3]} castShadow>
            <boxGeometry args={[0.7, 0.38, 0.65]} />
            <meshStandardMaterial color="#B56A36" metalness={0.75} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.05, 0.15]}>
            <boxGeometry args={[3.4, 0.04, 0.04]} />
            <meshStandardMaterial color="#C83B2B" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.12, -0.15]}>
            <boxGeometry args={[3.4, 0.04, 0.04]} />
            <meshStandardMaterial color="#E0AA2B" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* Front Control Apron */}
      <mesh position={[0, -0.1, 1.07]} castShadow>
        <boxGeometry args={[4.1, 0.48, 0.04]} />
        <meshStandardMaterial color="#25282C" roughness={0.5} metalness={0.35} />
      </mesh>

      {/* Vintage Analog Wattmeter Gauge (Left Front) */}
      <group position={[-1.25, -0.08, 1.11]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.08, 28]} />
          <meshStandardMaterial color="#1B1B1B" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.042]}>
          <circleGeometry args={[0.205, 28]} />
          <meshStandardMaterial map={gaugeTex} roughness={0.45} />
        </mesh>
        <group ref={needleRef} position={[0, -0.02, 0.048]}>
          <mesh position={[0, 0.075, 0]}>
            <boxGeometry args={[0.012, 0.15, 0.008]} />
            <meshBasicMaterial color="#C42B1C" />
          </mesh>
        </group>
      </group>

      {/* Switch 1: Filament Heater Toggle (Clickable) */}
      <group
        position={[-0.35, -0.08, 1.12]}
        onClick={(e) => {
          e.stopPropagation();
          toggleHeater();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart(heaterOn ? 'Filament Heater Switch (ON — Click to Cut)' : '1. Filament Heater Switch (Click to Warm Tubes)');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
          <meshStandardMaterial color="#C8CCD2" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh ref={heaterLeverRef} position={[0, 0, 0.09]} rotation={[0.45, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.016, 0.22, 12]} />
          <meshStandardMaterial color="#E0E3E8" metalness={0.92} roughness={0.18} />
        </mesh>
      </group>

      {/* Switch 2: High Voltage B+ Toggle (Clickable) */}
      <group
        position={[0.45, -0.08, 1.12]}
        onClick={(e) => {
          e.stopPropagation();
          toggleHv();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart(hvOn ? 'High Voltage B+ (ON)' : '2. High Voltage B+ Switch (Requires Warm Tubes)');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
          <meshStandardMaterial color="#C43B2B" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh ref={hvLeverRef} position={[0, 0, 0.09]} rotation={[0.45, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.016, 0.22, 12]} />
          <meshStandardMaterial color="#E0E3E8" metalness={0.92} roughness={0.18} />
        </mesh>
      </group>

      {/* Vintage Red Cloth-Braided Patch Cable connecting across front */}
      <mesh position={[1.25, 0.24, 0.62]} rotation={[0.4, 0.3, 0]} castShadow>
        <torusGeometry args={[0.32, 0.024, 10, 28, Math.PI * 1.1]} />
        <meshStandardMaterial color="#9B2D24" roughness={0.85} />
      </mesh>

      {/* 4 Thermionic Vacuum Tubes */}
      {[-1.35, -0.45, 0.45, 1.35].map((xPos, idx) => {
        const isBurned = burnedIdx === idx;
        return (
          <group
            key={idx}
            position={[xPos, 0.2, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (isBurned) replaceTube();
            }}
            onPointerOver={(e) => {
              if (!isBurned) return;
              e.stopPropagation();
              setHoveredPart('Burned-Out Tube — Click to Replace');
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredPart(null);
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Dark Bakelite Octal Socket Base */}
            <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.25, 0.27, 0.22, 24]} />
              <meshStandardMaterial color="#181513" roughness={0.38} metalness={0.12} />
            </mesh>
            {/* Brass guide ring */}
            <mesh position={[0, 0.19, 0]}>
              <cylinderGeometry args={[0.23, 0.23, 0.03, 24]} />
              <meshStandardMaterial color="#A9863D" metalness={0.85} roughness={0.3} />
            </mesh>

            {/* Internal Nickel Anode Box */}
            <mesh position={[0, 0.62, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.56, 8, 1, true]} />
              <meshStandardMaterial
                color={isBurned ? '#242424' : '#585E66'}
                metalness={0.8}
                roughness={0.35}
                side={THREE.DoubleSide}
                transparent
                opacity={0.78}
              />
            </mesh>

            {/* Glowing Tungsten Filament Core */}
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.026, 0.026, 0.64, 12]} />
              <meshStandardMaterial
                ref={(el) => {
                  filamentRefs.current[idx] = el;
                }}
                color="#555555"
                emissive="#FF5A00"
                emissiveIntensity={0}
              />
            </mesh>

            {/* Subtle Blue-Violet Anode Electron Glow when HV ON */}
            <mesh position={[0, 0.62, 0]}>
              <cylinderGeometry args={[0.155, 0.155, 0.58, 16]} />
              <meshStandardMaterial
                ref={(el) => {
                  plasmaRefs.current[idx] = el;
                }}
                color="#7FA6FF"
                emissive="#4F7DFF"
                emissiveIntensity={1.5}
                transparent
                opacity={0}
                depthWrite={false}
              />
            </mesh>

            {/* Outer Glass Envelope (smoked black top if burned out!) */}
            <mesh position={[0, 0.66, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.88, 28]} />
              <meshPhysicalMaterial
                color={isBurned ? '#363230' : '#F2F6FA'}
                transparent
                opacity={isBurned ? 0.72 : 0.28}
                roughness={0.08}
                metalness={0.05}
                reflectivity={0.9}
              />
            </mesh>
            {/* Domed Glass Top + Silver Getter Flashing */}
            <mesh position={[0, 1.1, 0]}>
              <sphereGeometry args={[0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial
                color={isBurned ? '#1C1918' : '#A6ACB5'}
                metalness={isBurned ? 0.1 : 0.92}
                roughness={isBurned ? 0.8 : 0.15}
                transparent={!isBurned}
                opacity={isBurned ? 0.95 : 0.75}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
