import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../../store/simStore';
import { createDigitWheelTexture, createGearGeometry } from '../materials';

export function MechanicalScene() {
  const xray = useSimStore((s) => s.xray);
  const mechValue = useSimStore((s) => s.mechValue);
  const crankAngle = useSimStore((s) => s.mechCrankAngle);
  const jammed = useSimStore((s) => s.mechJammed);
  const overdrive = useSimStore((s) => s.mechOverdrive);
  const turnCrankOneStep = useSimStore((s) => s.turnCrankOneStep);
  const unjamMech = useSimStore((s) => s.unjamMech);
  const tickMech = useSimStore((s) => s.tickMech);
  const setHoveredPart = useSimStore((s) => s.setHoveredPart);

  const driveGearRef = useRef<THREE.Mesh>(null);
  const idlerGearRef = useRef<THREE.Mesh>(null);
  const carryGearRef = useRef<THREE.Mesh>(null);
  const crankGroupRef = useRef<THREE.Group>(null);
  const onesDrumRef = useRef<THREE.Mesh>(null);
  const tensDrumRef = useRef<THREE.Mesh>(null);
  const leverRef = useRef<THREE.Group>(null);

  const smoothAngle = useRef(crankAngle);
  const smoothOnes = useRef(mechValue % 10);
  const smoothTens = useRef(Math.floor(mechValue / 10));

  const gearMain = useMemo(() => createGearGeometry(16, 0.72, 0.45, 0.16, 0.11), []);
  const gearIdler = useMemo(() => createGearGeometry(12, 0.54, 0.32, 0.16, 0.09), []);
  const gearCarry = useMemo(() => createGearGeometry(10, 0.46, 0.25, 0.16, 0.09), []);
  const digitTex = useMemo(() => createDigitWheelTexture(), []);

  useFrame((_, dt) => {
    tickMech(dt);
    const state = useSimStore.getState();

    // Smooth angle interpolation (instant exact pose in Remotion frame-by-frame render)
    const timeVal = state.remotionMode ? state.remotionTimeSec : performance.now() * 0.001;
    const jitter = state.mechJammed ? Math.sin(timeVal * 50) * 0.015 : 0;
    const snap = state.remotionMode ? 1 : Math.min(1, dt * 12);
    smoothAngle.current = THREE.MathUtils.lerp(smoothAngle.current, state.mechCrankAngle, snap);

    if (crankGroupRef.current) {
      crankGroupRef.current.rotation.z = -smoothAngle.current + jitter;
    }
    if (driveGearRef.current) {
      driveGearRef.current.rotation.z = -smoothAngle.current + jitter;
    }
    if (idlerGearRef.current) {
      // Opposite rotation scaled by 16/12 teeth ratio
      idlerGearRef.current.rotation.z = smoothAngle.current * (16 / 12) + 0.14 + jitter;
    }
    if (carryGearRef.current) {
      carryGearRef.current.rotation.z = -smoothAngle.current * (16 / 10) + jitter;
    }

    const targetOnes = state.mechValue % 10;
    const targetTens = Math.floor(state.mechValue / 10);

    if (state.remotionMode) {
      smoothOnes.current = targetOnes;
      smoothTens.current = targetTens;
    } else {
      // Handle wrap-around smoothly for ones drum
      let diffOnes = targetOnes - (smoothOnes.current % 10);
      if (diffOnes < -5) diffOnes += 10;
      if (diffOnes > 5) diffOnes -= 10;
      smoothOnes.current += diffOnes * Math.min(1, dt * 14);
      smoothTens.current = THREE.MathUtils.lerp(smoothTens.current, targetTens, Math.min(1, dt * 10));
    }

    const segAngle = (Math.PI * 2) / 10;
    if (onesDrumRef.current) {
      onesDrumRef.current.rotation.x = -smoothOnes.current * segAngle - Math.PI * 0.48;
    }
    if (tensDrumRef.current) {
      tensDrumRef.current.rotation.x = -smoothTens.current * segAngle - Math.PI * 0.48;
    }

    // Carry lever kick when ones hits 0 or jammed
    if (leverRef.current) {
      const kick = state.mechJammed ? -0.35 : targetOnes === 0 && state.mechValue > 0 ? 0.24 : 0;
      leverRef.current.rotation.z = state.remotionMode
        ? kick
        : THREE.MathUtils.lerp(leverRef.current.rotation.z, kick, Math.min(1, dt * 15));
    }
  });

  return (
    <group position={[0, -0.35, 0]}>
      {/* Cast Iron Base Frame */}
      <mesh position={[0, -0.32, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.9, 0.24, 2.2]} />
        <meshStandardMaterial color="#2A2D31" metalness={0.55} roughness={0.62} />
      </mesh>
      {/* Brass corner bolts on base */}
      {[
        [-1.75, -0.18, 0.92],
        [1.75, -0.18, 0.92],
        [-1.75, -0.18, -0.92],
        [1.75, -0.18, -0.92],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.05, 6]} />
          <meshStandardMaterial color="#C89F42" metalness={0.85} roughness={0.28} />
        </mesh>
      ))}

      {/* Back & Front Cast-Iron Upright Side Plates (fade in X-Ray mode) */}
      <mesh position={[0, 0.55, -0.68]} castShadow={!xray} receiveShadow>
        <boxGeometry args={[3.15, 1.5, 0.12]} />
        <meshStandardMaterial
          key={xray ? 'plate-xray' : 'plate-solid'}
          color="#32363B"
          metalness={0.5}
          roughness={0.55}
          transparent={xray}
          opacity={xray ? 0.16 : 1}
          depthWrite={!xray}
        />
      </mesh>
      {!xray && (
        <mesh position={[-0.4, 0.45, 0.68]} castShadow receiveShadow>
          <boxGeometry args={[2.35, 1.32, 0.1]} />
          <meshStandardMaterial color="#32363B" metalness={0.5} roughness={0.55} />
        </mesh>
      )}

      {/* Protective Brass Top Hood / Cover (hidden in X-Ray to expose internals) */}
      {!xray && (
        <group position={[-0.45, 1.15, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.09, 1.46]} />
            <meshStandardMaterial color="#3A3E44" metalness={0.5} roughness={0.52} />
          </mesh>
          {/* Viewing Window Bezel for Digit Wheels */}
          <mesh position={[-0.45, 0.06, 0.2]} castShadow>
            <boxGeometry args={[0.92, 0.05, 0.52]} />
            <meshStandardMaterial color="#C89F42" metalness={0.85} roughness={0.28} />
          </mesh>
        </group>
      )}

      {/* Steel Axles / Shafts */}
      <mesh position={[1.1, 0.48, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 1.75, 24]} />
        <meshStandardMaterial color="#CFD4DC" metalness={0.92} roughness={0.2} />
      </mesh>
      <mesh position={[-0.08, 0.52, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 1.48, 24]} />
        <meshStandardMaterial color="#CFD4DC" metalness={0.92} roughness={0.2} />
      </mesh>
      <mesh position={[-0.95, 0.72, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.15, 24]} />
        <meshStandardMaterial color="#CFD4DC" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Interlocking Brass Spur Gears */}
      <mesh ref={driveGearRef} geometry={gearMain} position={[1.1, 0.48, 0.12]} castShadow receiveShadow>
        <meshStandardMaterial color="#C99E38" metalness={0.86} roughness={0.28} />
      </mesh>
      <mesh ref={idlerGearRef} geometry={gearIdler} position={[-0.08, 0.52, 0.12]} castShadow receiveShadow>
        <meshStandardMaterial color="#B7892E" metalness={0.86} roughness={0.32} />
      </mesh>
      <mesh ref={carryGearRef} geometry={gearCarry} position={[-0.95, 0.72, 0.12]} castShadow receiveShadow>
        <meshStandardMaterial color="#D4AA46" metalness={0.86} roughness={0.26} />
      </mesh>

      {/* Carry Mechanism Lever (Clickable to Unjam!) */}
      <group
        ref={leverRef}
        position={[-0.48, 0.95, 0.36]}
        onClick={(e) => {
          e.stopPropagation();
          if (jammed) unjamMech();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart(jammed ? 'Release Jammed Carry Lever (Click)' : 'Brass Carry Pawl');
          document.body.style.cursor = jammed ? 'pointer' : 'auto';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh position={[-0.22, 0, 0]} castShadow>
          <boxGeometry args={[0.56, 0.08, 0.08]} />
          <meshStandardMaterial
            color={jammed ? '#D94336' : '#C89F42'}
            metalness={0.75}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[-0.5, 0.06, 0]} castShadow>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial color={jammed ? '#D94336' : '#8C2D23'} roughness={0.4} />
        </mesh>
      </group>

      {/* Tens & Ones Numbered Register Drums */}
      <group position={[-0.95, 0.72, -0.24]}>
        {/* Tens Drum */}
        <mesh
          ref={tensDrumRef}
          position={[-0.24, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.38, 0.38, 0.34, 32]} />
          <meshStandardMaterial map={digitTex} roughness={0.45} metalness={0.08} />
        </mesh>
        {/* Ones Drum */}
        <mesh
          ref={onesDrumRef}
          position={[0.18, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.38, 0.38, 0.34, 32]} />
          <meshStandardMaterial map={digitTex} roughness={0.45} metalness={0.08} />
        </mesh>
      </group>

      {/* Interactive Hand Crank Assembly */}
      <group
        ref={crankGroupRef}
        position={[1.1, 0.48, 0.88]}
        onClick={(e) => {
          e.stopPropagation();
          if (jammed) unjamMech();
          else turnCrankOneStep();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart(jammed ? 'Jammed — Click Carry Lever or Crank to Reset' : 'Hand Crank (Click to Turn +1)');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Steel Collar */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.14, 24]} />
          <meshStandardMaterial color="#CFD4DC" metalness={0.9} roughness={0.22} />
        </mesh>
        {/* Crank Arm */}
        <mesh position={[0, 0.38, 0.04]} castShadow>
          <boxGeometry args={[0.14, 0.85, 0.08]} />
          <meshStandardMaterial
            color={overdrive ? '#B87A28' : '#C99E38'}
            metalness={0.85}
            roughness={0.28}
          />
        </mesh>
        {/* Turned Walnut Wooden Handle */}
        <mesh position={[0, 0.76, 0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.072, 0.44, 20]} />
          <meshStandardMaterial color="#5B371E" roughness={0.55} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.76, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <sphereGeometry args={[0.088, 16, 16]} />
          <meshStandardMaterial color="#4A2B16" roughness={0.55} />
        </mesh>
      </group>
    </group>
  );
}
