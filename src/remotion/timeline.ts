import { DEMO_SEGMENTS, DemoSegment } from './manifest';
import { useSimStore } from '../store/simStore';

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export function getSegmentAtFrame(frame: number): {
  segment: DemoSegment;
  localSec: number;
  localFrame: number;
} {
  for (let i = DEMO_SEGMENTS.length - 1; i >= 0; i--) {
    const seg = DEMO_SEGMENTS[i];
    if (frame >= seg.startFrame) {
      const localFrame = frame - seg.startFrame;
      return {
        segment: seg,
        localFrame,
        localSec: localFrame / 30,
      };
    }
  }
  return {
    segment: DEMO_SEGMENTS[0],
    localFrame: 0,
    localSec: 0,
  };
}

/**
 * Deterministically drives Zustand hardware state and camera pose for any Remotion frame.
 */
export function applyDemoFrameState(globalFrame: number, fps: number): {
  segment: DemoSegment;
  localSec: number;
  camera: CameraPose;
} {
  const { segment, localFrame } = getSegmentAtFrame(globalFrame);
  const t = localFrame / fps;
  const dur = segment.durationInFrames / fps;
  const progress = Math.min(1, Math.max(0, t / dur));

  // Reset deterministic flags cleanly per segment
  let xray = false;
  let camera: CameraPose = {
    position: [3.65, 2.35, 4.55],
    target: [0, 0.15, 0],
  };

  if (segment.id === 'mechanical') {
    // Orbit slowly from front-right toward brass gears, framed cleanly above subtitle bar
    const orbit = -0.18 + progress * 0.42;
    camera = {
      position: [Math.sin(orbit + 0.65) * 6.3, 2.55, Math.cos(orbit + 0.65) * 6.3],
      target: [0, -0.08, 0],
    };

    // Crank starts right around "cranking" (~2.6s) -> 5 steps: 5 -> 6 -> 7 -> 8 -> 9 -> 10
    const crankStart = 2.6;
    const stepDur = 0.45;
    let stepsDone = 0;
    let angle = 0;
    if (t >= crankStart) {
      const elapsed = t - crankStart;
      const rawSteps = Math.min(5, elapsed / stepDur);
      stepsDone = Math.floor(rawSteps);
      angle = rawSteps * Math.PI * 0.5;
    }
    xray = t >= 5.1;

    useSimStore.setState({
      remotionMode: true,
      remotionTimeSec: t,
      activeEra: 'mechanical',
      xray,
      mechValue: 5 + stepsDone,
      mechCrankAngle: angle,
      mechAutoSteps: stepsDone < 5 && t >= crankStart ? 5 - stepsDone : 0,
      mechOverdrive: false,
      mechJammed: false,
    });
  } else if (segment.id === 'relay') {
    const orbit = -0.2 + progress * 0.4;
    camera = {
      position: [Math.sin(orbit + 0.6) * 6.35, 2.65, Math.cos(orbit + 0.6) * 6.35],
      target: [0, -0.05, 0],
    };

    const powerOn = t >= 3.1;
    const cardIn = t >= 4.25;
    const running = t >= 5.35 && t < 6.85;
    const step =
      t < 5.35 ? 0 : t < 5.7 ? 1 : t < 6.05 ? 2 : t < 6.4 ? 3 : 4;
    const bug = t >= 6.05;
    const result = t >= 6.85 ? 4 : null;

    useSimStore.setState({
      remotionMode: true,
      remotionTimeSec: t,
      activeEra: 'relay',
      xray: t >= 7.05,
      relayPowerOn: powerOn,
      relayCardIn: cardIn,
      relayRunning: running,
      relayStep: step,
      relayBug: bug,
      relayResult: result,
    });
  } else if (segment.id === 'vacuum') {
    const orbit = -0.15 + progress * 0.35;
    camera = {
      position: [Math.sin(orbit + 0.58) * 6.5, 2.55, Math.cos(orbit + 0.58) * 6.5],
      target: [0, 0.0, 0],
    };

    const coldWarn = t >= 2.75 && t < 4.4;
    const heaterOn = t >= 4.45;
    const hvOn = t >= 6.55;
    const temp = !heaterOn
      ? 25
      : Math.min(710, 25 + ((t - 4.45) / 2.7) * 660);
    const computing = t >= 6.65 && t < 7.45;
    const result = t >= 7.45 ? 8 : null;

    useSimStore.setState({
      remotionMode: true,
      remotionTimeSec: t,
      activeEra: 'vacuum',
      xray: false,
      tubeHeaterOn: heaterOn,
      tubeTemp: temp,
      tubeHvOn: hvOn,
      tubeColdWarn: coldWarn,
      tubeStress: false,
      tubeBurnedIdx: null,
      tubeComputing: computing,
      tubeComputeProgress: computing ? (t - 6.65) / 0.8 : result ? 1 : 0,
      tubeResult: result,
    });
  } else if (segment.id === 'transistor') {
    const orbit = -0.12 + progress * 0.3;
    camera = {
      position: [Math.sin(orbit + 0.55) * 6.3, 2.55, Math.cos(orbit + 0.55) * 6.3],
      target: [0, 0.0, 0],
    };

    const powerOn = t >= 2.2;
    const compare = t >= 5.5;

    useSimStore.setState({
      remotionMode: true,
      remotionTimeSec: t,
      activeEra: 'transistor',
      xray: false,
      txPowerOn: powerOn,
      txBitsA: [0, 1, 0, 1],
      txBitsB: [0, 0, 1, 1],
      txCompareTube: compare,
    });
  } else if (segment.id === 'micro8') {
    const orbit = -0.1 + progress * 0.45;
    camera = {
      position: [Math.sin(orbit + 0.55) * 6.45, 2.75, Math.cos(orbit + 0.55) * 6.45],
      target: [0, 0.18, 0],
    };

    const powerOn = t >= 4.2;
    const bootProgress = powerOn ? Math.min(1, (t - 4.2) / 1.1) : 0;
    const pcStage =
      !powerOn
        ? 'IDLE'
        : t < 5.6
          ? 'IDLE'
          : t < 6.1
            ? 'FETCH'
            : t < 6.6
              ? 'DECODE'
              : t < 7.1
                ? 'EXECUTE'
                : 'DONE';
    const running = pcStage === 'FETCH' || pcStage === 'DECODE' || pcStage === 'EXECUTE';
    const pcLines = !powerOn
      ? ['SYSTEM OFF']
      : t < 5.6
        ? ['64KB RAM OK', 'READY > _']
        : pcStage !== 'DONE'
          ? ['> LOAD A, #05', '> ADD  A, #03', 'EXECUTING...']
          : ['> LOAD A, #05', '> ADD  A, #03', 'ACC = 08 (00001000)', 'READY > _'];
    xray = t >= 6.0;

    useSimStore.setState({
      remotionMode: true,
      remotionTimeSec: t,
      activeEra: 'micro8',
      xray,
      pcPowerOn: powerOn,
      pcBootProgress: bootProgress,
      pcClockHz: 8,
      pcRunning: running,
      pcStage,
      pcLines,
    });
  } else if (segment.id === 'modern') {
    const orbit = -0.15 + progress * 0.35;
    camera = {
      position: [Math.sin(orbit + 0.55) * 5.85, 3.05, Math.cos(orbit + 0.55) * 5.85],
      target: [0, -0.06, 0],
    };

    const powerOn = t >= 1.2;
    const isGpu = t >= 4.25;
    let modProgress = 0;
    let modRunning = false;
    let modElapsedMs: number | null = null;

    if (powerOn && !isGpu && t >= 1.8) {
      modRunning = true;
      modProgress = Math.min(72, Math.floor((t - 1.8) * 34));
    } else if (isGpu) {
      modRunning = false;
      if (t >= 4.35) {
        modProgress = 256;
        modElapsedMs = 0.4;
      }
    }

    useSimStore.setState({
      remotionMode: true,
      remotionTimeSec: t,
      activeEra: 'modern',
      xray: t >= 5.5,
      modPowerOn: powerOn,
      modMode: isGpu ? 'GPU' : 'CPU',
      modRunning,
      modProgress,
      modElapsedMs,
    });
  }

  return { segment, localSec: t, camera };
}
