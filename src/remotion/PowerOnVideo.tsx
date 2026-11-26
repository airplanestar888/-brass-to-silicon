import { useLayoutEffect } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { ControlPanel } from '../components/ControlPanel';
import { MechanicalScene } from '../scene/eras/MechanicalScene';
import { RelayScene } from '../scene/eras/RelayScene';
import { VacuumScene } from '../scene/eras/VacuumScene';
import { TransistorScene } from '../scene/eras/TransistorScene';
import { Micro8Scene } from '../scene/eras/Micro8Scene';
import { ModernScene } from '../scene/eras/ModernScene';
import { useSimStore } from '../store/simStore';
import { DEMO_SEGMENTS } from './manifest';
import { applyDemoFrameState, CameraPose } from './timeline';
import { SubtitleBar } from './SubtitleBar';
import { SponsorWhiteOutroLayer } from './SponsorLayer';

function RemotionCameraSync({ cameraPose }: { cameraPose: CameraPose }) {
  const camera = useThree((s) => s.camera);

  useLayoutEffect(() => {
    camera.position.set(...cameraPose.position);
    camera.lookAt(...cameraPose.target);
    camera.updateProjectionMatrix();
  }, [camera, cameraPose]);

  return null;
}

function ActiveDemoMachine() {
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

export function PowerOnVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Synchronously set deterministic Zustand machine state for this exact frame
  const { segment, localSec, camera } = applyDemoFrameState(frame, fps);
  const xray = useSimStore((s) => s.xray);

  // Scale up UI chrome cleanly for 1920x1080 video legibility without altering the web app
  const headerScale = 1.36;
  const headerHeightPx = Math.round(64 * headerScale); // 87px
  const panelScale = 1.34;
  const panelReserveWidth = Math.round(376 * panelScale) + 28; // 532px
  const stageWidth = 1920 - panelReserveWidth; // 1388px
  const stageHeight = 1080 - headerHeightPx; // 993px

  return (
    <AbsoluteFill className="drafting-bg flex flex-col overflow-hidden bg-white text-[#0b0b0b]">
      {/* Scaled Top Header for crisp 1920x1080 video readability */}
      <div
        style={{
          width: 1920,
          height: headerHeightPx,
          position: 'relative',
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 1920 / headerScale,
            transform: `scale(${headerScale})`,
            transformOrigin: 'top left',
          }}
        >
          <TopBar />
        </div>
      </div>

      {/* Main Content Area: 1388x993 3D Stage + Scaled Right Inspector */}
      <div className="relative flex-1 min-h-0 flex flex-row">
        <div className="relative flex-1 min-w-0 min-h-0">
          <ThreeCanvas
            width={stageWidth}
            height={stageHeight}
            shadows
            dpr={1}
            camera={{ position: camera.position, fov: 36, near: 0.1, far: 50 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.06,
            }}
          >
            <RemotionCameraSync cameraPose={camera} />

            <ambientLight intensity={0.48} />
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
            <directionalLight position={[-5, 3, -3]} intensity={0.5} color="#EEF4FF" />

            <Environment resolution={256} frames={1}>
              <group rotation={[-Math.PI / 3, 0, 1]}>
                <Lightformer form="rect" intensity={2.4} position={[0, 5, -9]} scale={[10, 5, 1]} />
                <Lightformer form="rect" intensity={1.8} position={[-5, 2, 4]} scale={[6, 4, 1]} color="#FFF8EE" />
                <Lightformer form="rect" intensity={1.4} position={[5, 1, 2]} scale={[6, 4, 1]} color="#F2F7FF" />
                <Lightformer
                  form="ring"
                  intensity={0.9}
                  position={[0, 8, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  scale={[8, 8, 1]}
                />
              </group>
            </Environment>

            <ActiveDemoMachine />

            {/* Crisp Dynamic Ground Shadow Receiver */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <shadowMaterial opacity={0.16} />
            </mesh>
          </ThreeCanvas>

          {/* Optional Cutaway Indicator Badge during X-Ray beats */}
          {xray && (
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2.5 bg-[#d9ff00] border-[2px] border-[#0b0b0b] px-4 py-2 shadow-[4px_4px_0_#0b0b0b]">
              <span className="w-3 h-3 bg-[#0b0b0b] inline-block" />
              <span className="font-mono-tech text-sm font-bold uppercase tracking-wide text-[#0b0b0b]">
                X-RAY CUTAWAY ACTIVE
              </span>
            </div>
          )}

          {/* Compact Scaled Bottom-Left Prev / Next Stepper */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 24,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transform: 'scale(1.25)',
              transformOrigin: 'bottom left',
            }}
          >
            <div className="swiss-pill flex items-center gap-1.5 px-3.5 py-2 bg-white font-mono-tech text-[13px] font-bold">
              <ChevronLeft className="w-4 h-4" />
              PREV
            </div>
            <div className="swiss-pill flex items-center gap-1.5 px-3.5 py-2 bg-[#d9ff00] font-mono-tech text-[13px] font-bold">
              NEXT ERA
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Scaled Right Inspector Column for Video Readability */}
        <div
          style={{
            width: panelReserveWidth,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 28,
            zIndex: 20,
          }}
        >
          <div
            style={{
              transform: `scale(${panelScale})`,
              transformOrigin: 'right center',
            }}
          >
            <ControlPanel />
          </div>
        </div>
      </div>

      {/* Separate Overlay Layer: Classic Yellow TV Subtitles (No Panel) */}
      <SubtitleBar words={segment.words} localMs={localSec * 1000} />

      {/* Full White Sponsor End-Card Layer */}
      <SponsorWhiteOutroLayer />

      {/* Mixed Voiceover Narration + Hardware SFX Tracks */}
      {DEMO_SEGMENTS.map((seg) => (
        <Sequence key={seg.id} from={seg.startFrame} durationInFrames={seg.durationInFrames}>
          <Audio src={staticFile(seg.audioFile)} volume={1} />
          <Audio src={staticFile(seg.sfxFile)} volume={0.48} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
