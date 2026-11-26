import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useSimStore } from '../store/simStore';
import { MechanicalScene } from './eras/MechanicalScene';
import { RelayScene } from './eras/RelayScene';
import { VacuumScene } from './eras/VacuumScene';
import { TransistorScene } from './eras/TransistorScene';
import { Micro8Scene } from './eras/Micro8Scene';
import { ModernScene } from './eras/ModernScene';

function CameraPresetHelper({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const activeEra = useSimStore((s) => s.activeEra);
  const lastEra = useRef(activeEra);

  useFrame(({ camera }, dt) => {
    if (lastEra.current !== activeEra) {
      lastEra.current = activeEra;
      const targetPos =
        activeEra === 'micro8'
          ? new THREE.Vector3(3.9, 2.5, 5.1)
          : activeEra === 'modern'
            ? new THREE.Vector3(3.3, 2.9, 4.3)
            : new THREE.Vector3(3.75, 2.35, 4.65);

      camera.position.lerp(targetPos, 0.25);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, activeEra === 'micro8' ? 0.35 : 0.15, 0);
        controlsRef.current.update();
      }
    } else if (controlsRef.current) {
      controlsRef.current.update();
    }
    void dt;
  });

  return null;
}

function ActiveMachine() {
  const activeEra = useSimStore((s) => s.activeEra);

  switch (activeEra) {
    case 'mechanical':
      return <MechanicalScene />;
    case 'relay':
      return <RelayScene />;
    case 'vacuum':
      return <VacuumScene />;
    case 'transistor':
      return <TransistorScene />;
    case 'micro8':
      return <Micro8Scene />;
    case 'modern':
      return <ModernScene />;
  }
}

export function SceneStage() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const hoveredPart = useSimStore((s) => s.hoveredPart);

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [3.75, 2.35, 4.65], fov: 36, near: 0.1, far: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.06 }}
      >
        {/* Crisp Architectural Studio Lights */}
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.55}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={20}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-5, 3, -3]} intensity={0.48} color="#EEF4FF" />

        {/* 100% Procedural Local Studio Softbox Reflections (no external CDN fetches) */}
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="rect" intensity={2.4} position={[0, 5, -9]} scale={[10, 5, 1]} />
            <Lightformer form="rect" intensity={1.8} position={[-5, 2, 4]} scale={[6, 4, 1]} color="#FFF8EE" />
            <Lightformer form="rect" intensity={1.4} position={[5, 1, 2]} scale={[6, 4, 1]} color="#F2F7FF" />
            <Lightformer form="ring" intensity={0.9} position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} />
          </group>
        </Environment>

        {/* Realistic Hardware Diorama Centered on Open White Studio Floor */}
        <group position={[0, 0, 0]}>
          <ActiveMachine />
          <ContactShadows
            position={[0, -0.7, 0]}
            opacity={0.32}
            scale={10}
            blur={2.2}
            far={3}
            color="#0B0B0B"
          />
        </group>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.07}
          minDistance={2.6}
          maxDistance={8.5}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI * 0.48}
          enablePan={false}
        />
        <CameraPresetHelper controlsRef={controlsRef} />
      </Canvas>

      {/* Interactive 3D Part Hover Pill (White + Black border + Lemon Neon dot) */}
      {hoveredPart && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white border-[1.5px] border-[#0b0b0b] px-3.5 py-2 shadow-[3px_3px_0_#0b0b0b]">
          <span className="w-3 h-3 bg-[#d9ff00] border border-[#0b0b0b] inline-block" />
          <span className="font-mono-tech text-xs md:text-[13px] font-bold uppercase tracking-wide text-[#0b0b0b]">
            {hoveredPart}
          </span>
        </div>
      )}
    </div>
  );
}
