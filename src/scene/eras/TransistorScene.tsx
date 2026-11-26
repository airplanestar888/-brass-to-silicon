import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../../store/simStore';

export function TransistorScene() {
  const xray = useSimStore((s) => s.xray);
  const powerOn = useSimStore((s) => s.txPowerOn);
  const bitsA = useSimStore((s) => s.txBitsA);
  const bitsB = useSimStore((s) => s.txBitsB);
  const compareTube = useSimStore((s) => s.txCompareTube);

  const togglePower = useSimStore((s) => s.toggleTxPower);
  const flipBit = useSimStore((s) => s.flipTxBit);
  const setHoveredPart = useSimStore((s) => s.setHoveredPart);

  const powerLeverRef = useRef<THREE.Mesh>(null);
  const bitALeverRefs = useRef<(THREE.Mesh | null)[]>([null, null, null, null]);
  const bitBLeverRefs = useRef<(THREE.Mesh | null)[]>([null, null, null, null]);

  const valA = bitsA[0] * 8 + bitsA[1] * 4 + bitsA[2] * 2 + bitsA[3];
  const valB = bitsB[0] * 8 + bitsB[1] * 4 + bitsB[2] * 2 + bitsB[3];
  const sum = valA + valB;
  const sumBits = useMemo(
    () => [
      (sum >> 4) & 1,
      (sum >> 3) & 1,
      (sum >> 2) & 1,
      (sum >> 1) & 1,
      sum & 1,
    ],
    [sum]
  );

  useFrame((_, dt) => {
    const state = useSimStore.getState();
    const speed = state.remotionMode ? 1 : Math.min(1, dt * 18);

    if (powerLeverRef.current) {
      powerLeverRef.current.rotation.x = THREE.MathUtils.lerp(
        powerLeverRef.current.rotation.x,
        state.txPowerOn ? -0.46 : 0.46,
        speed
      );
    }

    for (let i = 0; i < 4; i++) {
      const aMesh = bitALeverRefs.current[i];
      if (aMesh) {
        aMesh.rotation.x = THREE.MathUtils.lerp(
          aMesh.rotation.x,
          state.txBitsA[i] ? -0.45 : 0.45,
          speed
        );
      }
      const bMesh = bitBLeverRefs.current[i];
      if (bMesh) {
        bMesh.rotation.x = THREE.MathUtils.lerp(
          bMesh.rotation.x,
          state.txBitsB[i] ? -0.45 : 0.45,
          speed
        );
      }
    }
  });

  return (
    <group position={[compareTube ? -0.45 : 0, -0.35, 0]}>
      {/* Brushed Aluminum Main Cabinet */}
      <mesh position={[0, 0.35, -0.15]} castShadow={!xray} receiveShadow>
        <boxGeometry args={[3.6, 1.32, 1.55]} />
        <meshStandardMaterial
          key={xray ? 'cab-xray' : 'cab-solid'}
          color="#C9CDD2"
          metalness={0.72}
          roughness={0.34}
          transparent={xray}
          opacity={xray ? 0.16 : 1}
          depthWrite={!xray}
        />
      </mesh>

      {/* Dark Charcoal Anodized Front Instrument Panel */}
      <mesh position={[0, 0.35, 0.64]} castShadow={!xray} receiveShadow>
        <boxGeometry args={[3.48, 1.2, 0.06]} />
        <meshStandardMaterial
          key={xray ? 'front-xray' : 'front-solid'}
          color="#26292E"
          metalness={0.45}
          roughness={0.48}
          transparent={xray}
          opacity={xray ? 0.22 : 1}
          depthWrite={!xray}
        />
      </mesh>

      {/* Internal Phenolic Tan PCB + Discrete Silver Transistors (exposed on top & fully in X-Ray) */}
      <group position={[0, 0.72, -0.18]}>
        {/* Tan Fiberglass PCB */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.15, 0.06, 1.1]} />
          <meshStandardMaterial color="#8F764A" roughness={0.62} metalness={0.08} />
        </mesh>

        {/* Etched Copper Traces */}
        {[-0.32, 0, 0.32].map((z, i) => (
          <mesh key={i} position={[0, 0.033, z]}>
            <boxGeometry args={[2.8, 0.008, 0.035]} />
            <meshStandardMaterial color="#C87A3C" metalness={0.85} roughness={0.28} />
          </mesh>
        ))}

        {/* Row of 10 Silver TO-18 Metal-Can Transistors */}
        {Array.from({ length: 10 }).map((_, i) => {
          const x = -1.25 + i * 0.28;
          return (
            <group key={i} position={[x, 0.04, -0.18]}>
              <mesh position={[0, 0.09, 0]} castShadow>
                <cylinderGeometry args={[0.065, 0.072, 0.14, 18]} />
                <meshStandardMaterial color="#D2D6DC" metalness={0.92} roughness={0.18} />
              </mesh>
              {/* 3 wire legs */}
              {[-0.025, 0, 0.025].map((lx, j) => (
                <mesh key={j} position={[lx, 0.015, 0]}>
                  <cylinderGeometry args={[0.007, 0.007, 0.04, 6]} />
                  <meshStandardMaterial color="#C8CCD2" metalness={0.9} roughness={0.2} />
                </mesh>
              ))}
            </group>
          );
        })}

        {/* Color-banded Carbon Resistors + Electrolytic Capacitors */}
        {Array.from({ length: 8 }).map((_, i) => {
          const x = -1.1 + i * 0.31;
          return (
            <group key={i} position={[x, 0.06, 0.2]}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.036, 0.036, 0.16, 12]} />
                <meshStandardMaterial color="#CBB795" roughness={0.55} />
              </mesh>
              {/* Red/Violet/Gold resistor bands */}
              <mesh position={[-0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.038, 0.038, 0.016, 12]} />
                <meshStandardMaterial color="#B82921" />
              </mesh>
              <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.038, 0.038, 0.016, 12]} />
                <meshStandardMaterial color="#C89B3C" metalness={0.6} />
              </mesh>
            </group>
          );
        })}

        {/* Heavy TO-3 Power Transistors on Aluminum Heatsink (back) */}
        {[-0.9, 0, 0.9].map((x, idx) => (
          <group key={idx} position={[x, 0.07, -0.44]}>
            <mesh castShadow>
              <boxGeometry args={[0.32, 0.08, 0.18]} />
              <meshStandardMaterial color="#AEB4BC" metalness={0.88} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0.08, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.075, 0.09, 20]} />
              <meshStandardMaterial color="#D8DCE2" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Main Power Toggle Switch (Left of Front Panel) */}
      <group
        position={[-1.32, 0.4, 0.69]}
        onClick={(e) => {
          e.stopPropagation();
          togglePower();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart(powerOn ? 'Solid-State Power (ON — Instant)' : 'Main Chrome Toggle (Click for Instant Boot)');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.04, 16]} />
          <meshStandardMaterial color="#D4D7DD" metalness={0.92} roughness={0.18} />
        </mesh>
        <mesh ref={powerLeverRef} position={[0, 0, 0.08]} rotation={[0.46, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.015, 0.2, 12]} />
          <meshStandardMaterial color="#E6E8EC" metalness={0.95} roughness={0.14} />
        </mesh>
        {/* Amber power pilot jewel */}
        <mesh position={[0, 0.24, -0.01]}>
          <sphereGeometry args={[0.052, 16, 16]} />
          <meshStandardMaterial
            color={powerOn ? '#FFB320' : '#40341E'}
            emissive={powerOn ? '#FF9000' : '#000000'}
            emissiveIntensity={powerOn ? 2.4 : 0}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* 5 Output Sum Indicator Jewel Lamps (Top Front Row) */}
      {sumBits.map((bit, idx) => {
        const lit = powerOn && bit === 1;
        return (
          <group key={idx} position={[-0.65 + idx * 0.42, 0.68, 0.68]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.072, 0.072, 0.04, 18]} />
              <meshStandardMaterial color="#B8BCC4" metalness={0.88} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <sphereGeometry args={[0.055, 16, 16]} />
              <meshStandardMaterial
                color={lit ? '#FF4433' : '#4B1D1A'}
                emissive={lit ? '#FF2A1A' : '#000000'}
                emissiveIntensity={lit ? 2.5 : 0}
                roughness={0.2}
              />
            </mesh>
          </group>
        );
      })}

      {/* 4-Bit Operand A Chrome Switches (Middle Row) */}
      {bitsA.map((_, idx) => (
        <group
          key={`a-${idx}`}
          position={[-0.45 + idx * 0.42, 0.34, 0.68]}
          onClick={(e) => {
            e.stopPropagation();
            flipBit('A', idx);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredPart(`Operand A · Bit ${8 >> idx} (Click to Flip)`);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoveredPart(null);
            document.body.style.cursor = 'auto';
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.046, 0.046, 0.03, 14]} />
            <meshStandardMaterial color="#CFD4DC" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh
            ref={(el) => {
              bitALeverRefs.current[idx] = el;
            }}
            position={[0, 0, 0.065]}
            rotation={[0.45, 0, 0]}
          >
            <cylinderGeometry args={[0.016, 0.012, 0.14, 10]} />
            <meshStandardMaterial color="#E6E8EC" metalness={0.94} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* 4-Bit Operand B Chrome Switches (Bottom Row) */}
      {bitsB.map((_, idx) => (
        <group
          key={`b-${idx}`}
          position={[-0.45 + idx * 0.42, 0.02, 0.68]}
          onClick={(e) => {
            e.stopPropagation();
            flipBit('B', idx);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredPart(`Operand B · Bit ${8 >> idx} (Click to Flip)`);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoveredPart(null);
            document.body.style.cursor = 'auto';
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.046, 0.046, 0.03, 14]} />
            <meshStandardMaterial color="#CFD4DC" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh
            ref={(el) => {
              bitBLeverRefs.current[idx] = el;
            }}
            position={[0, 0, 0.065]}
            rotation={[0.45, 0, 0]}
          >
            <cylinderGeometry args={[0.016, 0.012, 0.14, 10]} />
            <meshStandardMaterial color="#E6E8EC" metalness={0.94} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Scale Comparison Overlay: 1945 Vacuum Tube next to 1958 Metal-Can Transistor */}
      {compareTube && (
        <group position={[2.45, -0.05, 0.25]}>
          {/* Pedestal */}
          <mesh position={[0, -0.22, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.15, 0.1, 0.85]} />
            <meshStandardMaterial color="#1F1F1F" roughness={0.5} />
          </mesh>
          {/* Full-size Vacuum Tube */}
          <group position={[-0.25, -0.17, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.26, 0.2, 24]} />
              <meshStandardMaterial color="#181513" roughness={0.38} />
            </mesh>
            <mesh position={[0, 0.64, 0]} castShadow>
              <cylinderGeometry args={[0.21, 0.21, 0.88, 24]} />
              <meshPhysicalMaterial color="#F2F6FA" transparent opacity={0.3} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.58, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.6, 12]} />
              <meshStandardMaterial color="#FF7A28" emissive="#FF5500" emissiveIntensity={1.6} />
            </mesh>
          </group>
          {/* Tiny TO-18 Transistor next to it */}
          <group position={[0.32, -0.1, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.055, 0.06, 0.11, 16]} />
              <meshStandardMaterial color="#D4D8DE" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
