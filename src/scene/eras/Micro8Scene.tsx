import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../../store/simStore';

export function Micro8Scene() {
  const xray = useSimStore((s) => s.xray);
  const powerOn = useSimStore((s) => s.pcPowerOn);
  const bootProgress = useSimStore((s) => s.pcBootProgress);
  const stage = useSimStore((s) => s.pcStage);

  const togglePower = useSimStore((s) => s.togglePcPower);
  const tickPc = useSimStore((s) => s.tickPc);
  const setHoveredPart = useSimStore((s) => s.setHoveredPart);

  const rockerRef = useRef<THREE.Mesh>(null);
  const busGlowRef = useRef<THREE.MeshStandardMaterial>(null);

  // Offscreen canvas for authentic P31 green phosphor CRT display
  const { crtCanvas, crtTexture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { crtCanvas: canvas, crtTexture: texture };
  }, []);

  useEffect(() => {
    return () => {
      crtTexture.dispose();
    };
  }, [crtTexture]);

  useFrame(({ clock }, dt) => {
    tickPc(dt);
    const state = useSimStore.getState();
    const t = state.remotionMode ? state.remotionTimeSec : clock.elapsedTime;

    // Red rocker switch tilt
    if (rockerRef.current) {
      rockerRef.current.rotation.x = THREE.MathUtils.lerp(
        rockerRef.current.rotation.x,
        state.pcPowerOn ? -0.25 : 0.25,
        state.remotionMode ? 1 : Math.min(1, dt * 16)
      );
    }

    // Pulse internal copper data bus when running Fetch/Decode/Execute
    if (busGlowRef.current) {
      const pulse =
        state.pcPowerOn && state.pcRunning
          ? 1.5 + Math.sin(t * 18) * 1.1
          : state.pcPowerOn
            ? 0.35
            : 0;
      busGlowRef.current.emissiveIntensity = pulse;
    }

    // Draw CRT screen every frame for scanlines, bloom, and blinking cursor
    const ctx = crtCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0B120D';
      ctx.fillRect(0, 0, 512, 384);

      if (state.pcPowerOn) {
        const bp = state.pcBootProgress;
        if (bp < 0.45) {
          // Horizontal collapse line -> vertical bloom!
          const lineH = Math.max(4, (bp / 0.45) * 320);
          const grad = ctx.createRadialGradient(256, 192, 6, 256, 192, 230);
          grad.addColorStop(0, 'rgba(130, 255, 165, 0.95)');
          grad.addColorStop(1, 'rgba(18, 60, 30, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(24, 192 - lineH * 0.5, 464, lineH);
        } else {
          // Subtle phosphor radial glow
          const bgGrad = ctx.createRadialGradient(256, 192, 40, 256, 192, 290);
          bgGrad.addColorStop(0, '#132617');
          bgGrad.addColorStop(1, '#09110B');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, 512, 384);

          ctx.fillStyle = '#48FF78';
          ctx.font = 'bold 20px "IBM Plex Mono", monospace';
          ctx.fillText('COMPUTE-8 BASIC v1.0', 28, 48);
          ctx.fillStyle = '#2ED45A';
          ctx.font = '16px "IBM Plex Mono", monospace';
          ctx.fillText(`6502 CPU @ ${state.pcClockHz} Hz VISUAL`, 28, 78);

          ctx.strokeStyle = 'rgba(72, 255, 120, 0.35)';
          ctx.beginPath();
          ctx.moveTo(28, 94);
          ctx.lineTo(484, 94);
          ctx.stroke();

          state.pcLines.forEach((line, i) => {
            ctx.fillStyle = line.includes('ACC = 08') ? '#D9FF00' : '#48FF78';
            ctx.font = 'bold 20px "IBM Plex Mono", monospace';
            const displayLine =
              i === state.pcLines.length - 1 && line.endsWith('_')
                ? Math.floor(t * 2) % 2 === 0
                  ? line
                  : line.slice(0, -1)
                : line;
            ctx.fillText(displayLine, 28, 136 + i * 36);
          });

          if (state.pcRunning) {
            ctx.fillStyle = '#9EFFB5';
            ctx.font = '16px "IBM Plex Mono", monospace';
            ctx.fillText(`STAGE: [${state.pcStage}]`, 28, 336);
          }
        }
      }

      // Subtle CRT horizontal scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      for (let y = 0; y < 384; y += 4) {
        ctx.fillRect(0, y, 512, 2);
      }

      crtTexture.needsUpdate = true;
    }
  });

  return (
    <group position={[0, -0.45, 0]}>
      {/* Retro Putty/Beige Desktop Wedge Base (cutaway ghost wireframe in X-Ray to reveal motherboard) */}
      <mesh position={[0, 0.08, 0.15]} castShadow={!xray} receiveShadow>
        <boxGeometry args={[3.35, 0.42, 2.35]} />
        <meshStandardMaterial
          key={xray ? 'base-xray' : 'base-solid'}
          color="#D9D1BF"
          roughness={0.58}
          metalness={0.05}
          transparent={xray}
          opacity={xray ? 0.12 : 1}
          depthWrite={!xray}
        />
      </mesh>

      {/* Sloped Keyboard Deck (hidden in X-Ray to give clear view of motherboard & buses) */}
      {!xray && (
        <mesh position={[0, 0.25, 0.92]} rotation={[0.14, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.15, 0.14, 0.85]} />
          <meshStandardMaterial color="#CFC6B2" roughness={0.55} />
        </mesh>
      )}

      {/* Charcoal Sculpted Keycaps */}
      {!xray &&
        Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 12 }).map((__, col) => (
            <mesh
              key={`${row}-${col}`}
              position={[-1.18 + col * 0.215, 0.34 - row * 0.018, 0.66 + row * 0.165]}
              rotation={[0.14, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.17, 0.075, 0.13]} />
              <meshStandardMaterial
                color={row === 3 && col > 2 && col < 9 ? '#3B3D42' : '#26282C'}
                roughness={0.45}
              />
            </mesh>
          ))
        )}

      {/* Iconic Side Red Rocker Power Switch (Clickable!) */}
      <group
        position={[1.7, 0.12, 0.25]}
        onClick={(e) => {
          e.stopPropagation();
          togglePower();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart(powerOn ? 'Red Rocker Power Switch (ON)' : 'Red Rocker Power Switch (Click to Boot 8-Bit PC)');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredPart(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.22, 0.18]} />
          <meshStandardMaterial color="#1E1E1E" roughness={0.4} />
        </mesh>
        <mesh ref={rockerRef} position={[0.03, 0, 0]} rotation={[0.25, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.15, 0.11]} />
          <meshStandardMaterial color="#C8342A" roughness={0.32} />
        </mesh>
      </group>

      {/* Internal Green Motherboard, 40-Pin DIP CPU & Data Buses (elevated cleanly inside open shell in X-Ray!) */}
      <group position={[0, xray ? 0.12 : -0.02, -0.08]}>
        <mesh receiveShadow>
          <boxGeometry args={[2.95, 0.05, 1.45]} />
          <meshStandardMaterial color="#1D5C38" roughness={0.48} metalness={0.12} />
        </mesh>

        {/* 40-Pin DIP Microprocessor Chip */}
        <group position={[-0.25, 0.07, 0.05]}>
          <mesh castShadow>
            <boxGeometry args={[0.92, 0.08, 0.34]} />
            <meshStandardMaterial color="#1C1D20" roughness={0.38} />
          </mesh>
          {/* Silver DIP Pins */}
          {Array.from({ length: 10 }).map((_, i) => (
            <group key={i}>
              <mesh position={[-0.38 + i * 0.085, -0.02, 0.19]}>
                <boxGeometry args={[0.025, 0.08, 0.03]} />
                <meshStandardMaterial color="#D5D9E0" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[-0.38 + i * 0.085, -0.02, -0.19]}>
                <boxGeometry args={[0.025, 0.08, 0.03]} />
                <meshStandardMaterial color="#D5D9E0" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>

        {/* RAM & ROM DIP Chips */}
        {[-1.0, 0.55, 0.95].map((x, idx) => (
          <mesh key={idx} position={[x, 0.06, -0.35]} castShadow>
            <boxGeometry args={[0.32, 0.06, 0.2]} />
            <meshStandardMaterial color="#1F2024" roughness={0.42} />
          </mesh>
        ))}

        {/* Silver Quartz Clock Crystal */}
        <mesh position={[-0.95, 0.08, 0.25]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.08]} />
          <meshStandardMaterial color="#CFD5DD" metalness={0.92} roughness={0.18} />
        </mesh>

        {/* Pulsing Data Bus Trace */}
        <mesh position={[0.1, 0.035, -0.14]}>
          <boxGeometry args={[2.1, 0.012, 0.055]} />
          <meshStandardMaterial
            ref={busGlowRef}
            color="#C98A3A"
            emissive={stage === 'EXECUTE' ? '#D9FF00' : '#45FF78'}
            emissiveIntensity={powerOn ? 0.4 : 0}
          />
        </mesh>
      </group>

      {/* Stacked Retro CRT Monitor */}
      <group position={[0, 1.05, -0.25]}>
        {/* Outer Molded Beige Monitor Housing (ghost wireframe shell in X-Ray) */}
        <mesh position={[0, 0, -0.2]} castShadow={!xray} receiveShadow>
          <boxGeometry args={[2.35, 1.72, 1.48]} />
          <meshStandardMaterial
            key={xray ? 'crt-xray' : 'crt-solid'}
            color="#D5CCB9"
            roughness={0.55}
            metalness={0.04}
            transparent={xray}
            opacity={xray ? 0.1 : 1}
            depthWrite={!xray}
          />
        </mesh>

        {/* Exposed CRT Glass Vacuum Neck + Copper Deflection Yoke in X-Ray */}
        {xray && (
          <group position={[0, 0, -0.35]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.25, 0.85, 0.9, 24]} />
              <meshPhysicalMaterial color="#DDE6ED" transparent opacity={0.42} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.29, 0.29, 0.26, 20]} />
              <meshStandardMaterial color="#B96832" metalness={0.82} roughness={0.32} />
            </mesh>
          </group>
        )}

        {/* Recessed Dark Charcoal CRT Bezel */}
        <mesh position={[0, 0.05, 0.54]} castShadow>
          <boxGeometry args={[2.05, 1.42, 0.06]} />
          <meshStandardMaterial color="#25272B" roughness={0.45} />
        </mesh>

        {/* Green Phosphor Screen Surface */}
        <mesh position={[0, 0.05, 0.576]}>
          <planeGeometry args={[1.82, 1.24]} />
          <meshStandardMaterial
            map={crtTexture}
            emissiveMap={crtTexture}
            emissive="#ffffff"
            emissiveIntensity={powerOn ? 0.65 + bootProgress * 0.55 : 0}
            roughness={0.14}
            metalness={0.08}
          />
        </mesh>

        {/* Front Power Pilot LED on Monitor */}
        <mesh position={[0.78, -0.74, 0.55]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial
            color={powerOn ? '#48FF78' : '#2C3D2E'}
            emissive={powerOn ? '#48FF78' : '#000000'}
            emissiveIntensity={powerOn ? 2.2 : 0}
          />
        </mesh>
      </group>
    </group>
  );
}
