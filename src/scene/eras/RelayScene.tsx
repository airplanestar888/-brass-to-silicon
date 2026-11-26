import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../../store/simStore';
import { createPunchCardTexture } from '../materials';

export function RelayScene() {
  const xray = useSimStore((s) => s.xray);
  const powerOn = useSimStore((s) => s.relayPowerOn);
  const cardIn = useSimStore((s) => s.relayCardIn);
  const running = useSimStore((s) => s.relayRunning);
  const step = useSimStore((s) => s.relayStep);
  const result = useSimStore((s) => s.relayResult);
  const bug = useSimStore((s) => s.relayBug);

  const togglePower = useSimStore((s) => s.toggleRelayPower);
  const toggleCard = useSimStore((s) => s.toggleRelayCard);
  const clearBug = useSimStore((s) => s.clearRelayBug);
  const tickRelay = useSimStore((s) => s.tickRelay);
  const setHoveredPart = useSimStore((s) => s.setHoveredPart);

  const knifeBladeRef = useRef<THREE.Group>(null);
  const cardRef = useRef<THREE.Mesh>(null);
  const armatureRefs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const sparkRefs = useRef<(THREE.Mesh | null)[]>([null, null, null, null]);

  const cardTex = useMemo(() => createPunchCardTexture(), []);

  useFrame((_, dt) => {
    tickRelay(dt);
    const state = useSimStore.getState();
    const snap = state.remotionMode ? 1 : Math.min(1, dt * 16);

    // Knife switch rotates from open (0.85 rad) to closed (-0.05 rad)
    if (knifeBladeRef.current) {
      const targetRot = state.relayPowerOn ? -0.05 : 0.88;
      knifeBladeRef.current.rotation.z = THREE.MathUtils.lerp(
        knifeBladeRef.current.rotation.z,
        targetRot,
        snap
      );
    }

    // Punch card slides in/out of reader slot
    if (cardRef.current) {
      const targetY = state.relayCardIn ? 0.56 : 1.18;
      cardRef.current.position.y = THREE.MathUtils.lerp(
        cardRef.current.position.y,
        targetY,
        state.remotionMode ? 1 : Math.min(1, dt * 10)
      );
    }

    // 4 Relays representing 4 output bits [bit3(8), bit2(4), bit1(2), bit0(1)]
    // Target result 8 = [1, 0, 0, 0]; if moth bug is present on relay #0 (MSB) -> blocked!
    for (let i = 0; i < 4; i++) {
      const arm = armatureRefs.current[i];
      const spark = sparkRefs.current[i];
      const activeDuringRun = state.relayRunning && state.relayStep === i + 1;
      // Result bits for 8 (1000) or 4 if bug (0100)
      const isEnergized =
        state.relayPowerOn &&
        (activeDuringRun ||
          (state.relayResult === 8 && i === 0) ||
          (state.relayResult === 4 && i === 1));

      if (arm) {
        // If bug is wedged in relay 0, armature physically stops halfway!
        const blocked = i === 0 && state.relayBug;
        const targetAngle = blocked ? 0.1 : isEnergized ? 0.22 : 0;
        arm.rotation.z = THREE.MathUtils.lerp(
          arm.rotation.z,
          targetAngle,
          state.remotionMode ? 1 : Math.min(1, dt * 22)
        );
      }

      if (spark) {
        const showSpark =
          state.relayPowerOn && (activeDuringRun || (i === 0 && state.relayBug && state.relayRunning));
        spark.visible = showSpark;
        if (showSpark) {
          const s = state.remotionMode
            ? 0.9 + 0.4 * Math.abs(Math.sin(state.remotionTimeSec * 37 + i))
            : 0.7 + Math.random() * 0.8;
          spark.scale.set(s, s, s);
        }
      }
    }
  });

  return (
    <group position={[0, -0.35, 0]}>
      {/* Dark Phenolic Bakelite Mounting Chassis */}
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.1, 0.22, 2.3]} />
        <meshStandardMaterial color="#1F1916" roughness={0.42} metalness={0.12} />
      </mesh>
      {/* Back Vertical Relay Rack Panel */}
      <mesh position={[0, 0.55, -0.75]} receiveShadow castShadow={!xray}>
        <boxGeometry args={[3.9, 1.45, 0.14]} />
        <meshStandardMaterial
          key={xray ? 'rack-xray' : 'rack-solid'}
          color="#241D19"
          roughness={0.48}
          metalness={0.15}
          transparent={xray}
          opacity={xray ? 0.18 : 1}
          depthWrite={!xray}
        />
      </mesh>

      {/* Heavy Copper Knife Switch (Left side — Clickable!) */}
      <group
        position={[-1.42, -0.1, 0.45]}
        onClick={(e) => {
          e.stopPropagation();
          togglePower();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart(powerOn ? 'Main Knife Switch (ON — Click to Cut)' : 'Main Knife Switch (OFF — Click to Throw)');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Porcelain Insulator Block */}
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.14, 0.56]} />
          <meshStandardMaterial color="#DED8CA" roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Brass Hinge & Jaw Terminals */}
        <mesh position={[-0.24, 0.2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.22, 0.26]} />
          <meshStandardMaterial color="#C89B3C" metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[0.24, 0.2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.22, 0.26]} />
          <meshStandardMaterial color="#C89B3C" metalness={0.85} roughness={0.28} />
        </mesh>
        {/* Copper Blade + Insulated Handle */}
        <group ref={knifeBladeRef} position={[-0.24, 0.24, 0]}>
          <mesh position={[0.28, 0, 0]} castShadow>
            <boxGeometry args={[0.56, 0.045, 0.14]} />
            <meshStandardMaterial color="#C7733A" metalness={0.9} roughness={0.22} />
          </mesh>
          <mesh position={[0.66, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.055, 0.065, 0.26, 16]} />
            <meshStandardMaterial color="#181210" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* Punch Card Reader Slot + Cardstock (Clickable!) */}
      <group
        position={[1.38, 0.1, 0.42]}
        onClick={(e) => {
          e.stopPropagation();
          toggleCard();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart(cardIn ? 'Punch Card (Loaded — Click to Eject)' : 'Punch Card Slot (Click to Insert)');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Cast Metal Reader Housing */}
        <mesh position={[0, 0.18, 0]} castShadow={!xray} receiveShadow>
          <boxGeometry args={[0.92, 0.56, 0.5]} />
          <meshStandardMaterial
            key={xray ? 'reader-xray' : 'reader-solid'}
            color="#3D4248"
            metalness={0.65}
            roughness={0.45}
            transparent={xray}
            opacity={xray ? 0.2 : 1}
            depthWrite={!xray}
          />
        </mesh>
        {/* Reading Brush Pins visible in X-Ray */}
        {xray &&
          [-0.25, -0.08, 0.08, 0.25].map((x, idx) => (
            <mesh key={idx} position={[x, 0.34, 0.06]}>
              <cylinderGeometry args={[0.014, 0.014, 0.28, 8]} />
              <meshStandardMaterial color="#D4A64A" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        {/* Buff Punch Card */}
        <mesh ref={cardRef} position={[0, 0.56, 0]} castShadow>
          <boxGeometry args={[0.78, 0.56, 0.018]} />
          <meshStandardMaterial map={cardTex} roughness={0.78} metalness={0.02} />
        </mesh>
      </group>

      {/* 4 Electromechanical Relay Bank */}
      {[-0.84, -0.28, 0.28, 0.84].map((xPos, idx) => {
        const bitOn =
          powerOn &&
          ((running && step === idx + 1) ||
            (result === 8 && idx === 0) ||
            (result === 4 && idx === 1));

        return (
          <group key={idx} position={[xPos, 0.45, -0.34]}>
            {/* Clear Dust Cover (hidden in X-Ray) */}
            {!xray && (
              <mesh position={[0, 0.06, 0.1]}>
                <boxGeometry args={[0.42, 0.62, 0.44]} />
                <meshPhysicalMaterial
                  color="#F5F7F8"
                  transparent
                  opacity={0.18}
                  roughness={0.1}
                  metalness={0.05}
                />
              </mesh>
            )}

            {/* Copper Solenoid Coil */}
            <mesh position={[0, -0.06, 0]} castShadow>
              <cylinderGeometry args={[0.125, 0.125, 0.36, 24]} />
              <meshStandardMaterial color="#B96832" metalness={0.82} roughness={0.32} />
            </mesh>
            {/* Laminated Steel Core */}
            <mesh position={[0, 0.14, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.055, 0.16, 16]} />
              <meshStandardMaterial color="#8A9098" metalness={0.88} roughness={0.25} />
            </mesh>

            {/* Pivoting Iron Armature & Phosphor-Bronze Contact Leaf */}
            <group
              ref={(el) => {
                armatureRefs.current[idx] = el;
              }}
              position={[0.14, 0.24, 0]}
            >
              <mesh position={[-0.14, 0, 0]} castShadow>
                <boxGeometry args={[0.3, 0.032, 0.14]} />
                <meshStandardMaterial color="#6D727A" metalness={0.85} roughness={0.28} />
              </mesh>
              <mesh position={[-0.26, -0.04, 0.06]} castShadow>
                <boxGeometry args={[0.03, 0.12, 0.05]} />
                <meshStandardMaterial color="#C8934A" metalness={0.9} roughness={0.25} />
              </mesh>
            </group>

            {/* Contact Arc Spark */}
            <mesh
              ref={(el) => {
                sparkRefs.current[idx] = el;
              }}
              position={[-0.12, 0.18, 0.09]}
              visible={false}
            >
              <octahedronGeometry args={[0.055, 0]} />
              <meshBasicMaterial color="#FF9E2C" />
            </mesh>

            {/* Moth / Dust Bug wedged in Relay 0 when bug active (Clickable to clean!) */}
            {idx === 0 && bug && (
              <group
                position={[-0.12, 0.19, 0.07]}
                onClick={(e) => {
                  e.stopPropagation();
                  clearBug();
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredPart('Moth Fouling Contact! (Click to Clear Bug)');
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  setHoveredPart(null);
                  document.body.style.cursor = 'auto';
                }}
              >
                <mesh castShadow>
                  <sphereGeometry args={[0.045, 10, 10]} />
                  <meshStandardMaterial color="#4D3D2A" roughness={0.85} />
                </mesh>
                <mesh position={[-0.045, 0.02, 0]} rotation={[0, 0, 0.4]}>
                  <boxGeometry args={[0.08, 0.008, 0.055]} />
                  <meshStandardMaterial color="#D8CDB4" roughness={0.8} />
                </mesh>
                <mesh position={[0.045, 0.02, 0]} rotation={[0, 0, -0.4]}>
                  <boxGeometry args={[0.08, 0.008, 0.055]} />
                  <meshStandardMaterial color="#D8CDB4" roughness={0.8} />
                </mesh>
              </group>
            )}

            {/* Incandescent Indicator Jewel above each Relay */}
            <mesh position={[0, 0.56, -0.15]}>
              <sphereGeometry args={[0.065, 16, 16]} />
              <meshStandardMaterial
                color={bitOn ? '#FFAE22' : '#4E391F'}
                emissive={bitOn ? '#FF8C00' : '#000000'}
                emissiveIntensity={bitOn ? 2.2 : 0}
                roughness={0.22}
              />
            </mesh>
          </group>
        );
      })}

      {/* Copper Bus Wires connecting Knife Switch to Relays */}
      <mesh position={[-0.5, -0.11, 0.1]} castShadow>
        <boxGeometry args={[1.9, 0.025, 0.025]} />
        <meshStandardMaterial color="#B86B35" metalness={0.85} roughness={0.28} />
      </mesh>
    </group>
  );
}
