import { create } from 'zustand';
import { EraId } from '../types/era';
import { soundEngine } from '../audio/soundEngine';

export type PcStage = 'IDLE' | 'FETCH' | 'DECODE' | 'EXECUTE' | 'DONE';

interface SimState {
  remotionMode: boolean;
  remotionTimeSec: number;
  activeEra: EraId;
  xray: boolean;
  soundEnabled: boolean;
  hoveredPart: string | null;

  // 1. Mechanical
  mechValue: number;
  mechCrankAngle: number;
  mechAutoSteps: number;
  mechOverdrive: boolean;
  mechJammed: boolean;

  // 2. Relay
  relayPowerOn: boolean;
  relayCardIn: boolean;
  relayRunning: boolean;
  relayStep: number;
  relayResult: number | null;
  relayBug: boolean;

  // 3. Vacuum Tube
  tubeHeaterOn: boolean;
  tubeTemp: number; // 25..980 C
  tubeHvOn: boolean;
  tubeColdWarn: boolean;
  tubeStress: boolean;
  tubeBurnedIdx: number | null;
  tubeComputing: boolean;
  tubeComputeProgress: number;
  tubeResult: number | null;

  // 4. Transistor
  txPowerOn: boolean;
  txBitsA: [number, number, number, number];
  txBitsB: [number, number, number, number];
  txCompareTube: boolean;

  // 5. 8-Bit Micro
  pcPowerOn: boolean;
  pcBootProgress: number;
  pcClockHz: number; // 1, 8, 64
  pcRunning: boolean;
  pcStage: PcStage;
  pcStageTimer: number;
  pcLines: string[];

  // 6. Modern Silicon
  modPowerOn: boolean;
  modMode: 'CPU' | 'GPU';
  modRunning: boolean;
  modProgress: number; // 0..256
  modElapsedMs: number | null;

  // Global actions
  setEra: (era: EraId) => void;
  toggleXray: () => void;
  toggleSound: () => void;
  setHoveredPart: (label: string | null) => void;
  resetActiveEra: () => void;

  // Mechanical actions
  turnCrankOneStep: () => void;
  startMechCompute: () => void;
  toggleMechOverdrive: () => void;
  unjamMech: () => void;
  tickMech: (dt: number) => void;

  // Relay actions
  toggleRelayPower: () => void;
  toggleRelayCard: () => void;
  runRelayCompute: () => void;
  toggleRelayBug: () => void;
  clearRelayBug: () => void;
  tickRelay: (dt: number) => void;

  // Vacuum actions
  toggleTubeHeater: () => void;
  toggleTubeHv: () => void;
  toggleTubeStress: () => void;
  runTubeCompute: () => void;
  replaceTube: () => void;
  tickVacuum: (dt: number) => void;

  // Transistor actions
  toggleTxPower: () => void;
  flipTxBit: (bank: 'A' | 'B', index: number) => void;
  toggleTxCompare: () => void;
  presetTxFivePlusThree: () => void;

  // 8-Bit PC actions
  togglePcPower: () => void;
  setPcClockHz: (hz: number) => void;
  runPcCompute: () => void;
  tickPc: (dt: number) => void;

  // Modern actions
  toggleModPower: () => void;
  setModMode: (mode: 'CPU' | 'GPU') => void;
  runModCompute: () => void;
  tickModern: (dt: number) => void;
}

const syncHumForState = (s: SimState) => {
  if (!s.soundEnabled) {
    soundEngine.stopHum();
    return;
  }
  if (s.activeEra === 'relay' && s.relayPowerOn) {
    soundEngine.setHum('motor', 1);
  } else if (s.activeEra === 'vacuum' && s.tubeHeaterOn) {
    const heatRatio = Math.min(1, (s.tubeTemp - 25) / 600);
    soundEngine.setHum('tube', 0.35 + heatRatio * 0.65);
  } else if (s.activeEra === 'micro8' && s.pcPowerOn) {
    soundEngine.setHum('crt', s.pcBootProgress);
  } else {
    soundEngine.stopHum();
  }
};

export const useSimStore = create<SimState>((set, get) => ({
  remotionMode: false,
  remotionTimeSec: 0,
  activeEra: 'mechanical',
  xray: false,
  soundEnabled: true,
  hoveredPart: null,

  mechValue: 5,
  mechCrankAngle: 0,
  mechAutoSteps: 0,
  mechOverdrive: false,
  mechJammed: false,

  relayPowerOn: false,
  relayCardIn: true,
  relayRunning: false,
  relayStep: 0,
  relayResult: null,
  relayBug: false,

  tubeHeaterOn: false,
  tubeTemp: 25,
  tubeHvOn: false,
  tubeColdWarn: false,
  tubeStress: false,
  tubeBurnedIdx: null,
  tubeComputing: false,
  tubeComputeProgress: 0,
  tubeResult: null,

  txPowerOn: false,
  txBitsA: [0, 1, 0, 1], // 5
  txBitsB: [0, 0, 1, 1], // 3
  txCompareTube: false,

  pcPowerOn: false,
  pcBootProgress: 0,
  pcClockHz: 1,
  pcRunning: false,
  pcStage: 'IDLE',
  pcStageTimer: 0,
  pcLines: ['SYSTEM OFF'],

  modPowerOn: false,
  modMode: 'CPU',
  modRunning: false,
  modProgress: 0,
  modElapsedMs: null,

  setEra: (era) => {
    set({ activeEra: era, hoveredPart: null });
    syncHumForState(get());
  },

  toggleXray: () => {
    soundEngine.playToggleClick(!get().xray);
    set((s) => ({ xray: !s.xray }));
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    soundEngine.setEnabled(next);
    set({ soundEnabled: next });
    if (next) {
      soundEngine.playToggleClick(true);
      syncHumForState(get());
    }
  },

  setHoveredPart: (label) => set({ hoveredPart: label }),

  resetActiveEra: () => {
    const era = get().activeEra;
    soundEngine.playToggleClick(false);
    if (era === 'mechanical') {
      set({ mechValue: 5, mechCrankAngle: 0, mechAutoSteps: 0, mechOverdrive: false, mechJammed: false });
    } else if (era === 'relay') {
      set({ relayPowerOn: false, relayCardIn: true, relayRunning: false, relayStep: 0, relayResult: null, relayBug: false });
    } else if (era === 'vacuum') {
      set({
        tubeHeaterOn: false,
        tubeTemp: 25,
        tubeHvOn: false,
        tubeColdWarn: false,
        tubeStress: false,
        tubeBurnedIdx: null,
        tubeComputing: false,
        tubeComputeProgress: 0,
        tubeResult: null,
      });
    } else if (era === 'transistor') {
      set({ txPowerOn: false, txBitsA: [0, 1, 0, 1], txBitsB: [0, 0, 1, 1], txCompareTube: false });
    } else if (era === 'micro8') {
      set({
        pcPowerOn: false,
        pcBootProgress: 0,
        pcClockHz: 1,
        pcRunning: false,
        pcStage: 'IDLE',
        pcStageTimer: 0,
        pcLines: ['SYSTEM OFF'],
      });
    } else if (era === 'modern') {
      set({ modPowerOn: false, modMode: 'CPU', modRunning: false, modProgress: 0, modElapsedMs: null });
    }
    syncHumForState(get());
  },

  // --- Mechanical ---
  turnCrankOneStep: () => {
    const s = get();
    if (s.mechJammed) {
      soundEngine.playJamClank();
      return;
    }
    const prev = s.mechValue;
    const next = (prev + 1) % 100;
    const isCarry = Math.floor(prev / 10) !== Math.floor(next / 10);
    if (isCarry) {
      soundEngine.playCarryThunk();
    } else {
      soundEngine.playCrankClick(1 + (next % 10) * 0.04);
    }
    set({
      mechValue: next,
      mechCrankAngle: s.mechCrankAngle + Math.PI * 0.5,
    });
  },

  startMechCompute: () => {
    const s = get();
    if (s.mechJammed) {
      soundEngine.playJamClank();
      return;
    }
    if (s.mechAutoSteps > 0) return;
    set({ mechValue: 5, mechAutoSteps: 3 });
  },

  toggleMechOverdrive: () => {
    const s = get();
    soundEngine.playToggleClick(!s.mechOverdrive);
    set({ mechOverdrive: !s.mechOverdrive });
  },

  unjamMech: () => {
    soundEngine.playCarryThunk();
    set({ mechJammed: false, mechOverdrive: false, mechAutoSteps: 0 });
  },

  tickMech: (dt) => {
    const s = get();
    if (s.remotionMode || s.mechJammed || s.mechAutoSteps <= 0) return;

    const speed = s.mechOverdrive ? 5.5 : 1.7;
    const prevTurn = Math.floor(s.mechCrankAngle / (Math.PI * 0.5));
    const nextAngle = s.mechCrankAngle + dt * Math.PI * speed;
    const nextTurn = Math.floor(nextAngle / (Math.PI * 0.5));

    if (nextTurn > prevTurn) {
      if (s.mechOverdrive && Math.random() < 0.45) {
        soundEngine.playJamClank();
        set({ mechJammed: true, mechAutoSteps: 0, mechCrankAngle: nextAngle });
        return;
      }
      const prevVal = s.mechValue;
      const nextVal = (prevVal + 1) % 100;
      const remaining = s.mechAutoSteps - 1;
      if (Math.floor(prevVal / 10) !== Math.floor(nextVal / 10)) {
        soundEngine.playCarryThunk();
      } else {
        soundEngine.playCrankClick(1 + (nextVal % 10) * 0.04);
      }
      set({
        mechValue: nextVal,
        mechCrankAngle: nextAngle,
        mechAutoSteps: remaining,
      });
    } else {
      set({ mechCrankAngle: nextAngle });
    }
  },

  // --- Relay ---
  toggleRelayPower: () => {
    const next = !get().relayPowerOn;
    soundEngine.playKnifeSwitch();
    set({
      relayPowerOn: next,
      relayRunning: false,
      relayStep: next ? 0 : 0,
      relayResult: next ? get().relayResult : null,
    });
    syncHumForState(get());
  },

  toggleRelayCard: () => {
    soundEngine.playToggleClick(!get().relayCardIn);
    set((s) => ({
      relayCardIn: !s.relayCardIn,
      relayResult: null,
      relayStep: 0,
      relayRunning: false,
    }));
  },

  runRelayCompute: () => {
    const s = get();
    if (!s.relayPowerOn || !s.relayCardIn || s.relayRunning) return;
    set({ relayRunning: true, relayStep: 0, relayResult: null });
    soundEngine.playRelayClack(0);
  },

  toggleRelayBug: () => {
    const next = !get().relayBug;
    soundEngine.playToggleClick(next);
    set({ relayBug: next, relayResult: null });
  },

  clearRelayBug: () => {
    soundEngine.playToggleClick(false);
    set({ relayBug: false, relayResult: null });
  },

  tickRelay: (() => {
    let acc = 0;
    return (dt: number) => {
      const s = get();
      if (s.remotionMode || !s.relayRunning || !s.relayPowerOn) {
        acc = 0;
        return;
      }
      acc += dt;
      if (acc >= 0.36) {
        acc = 0;
        const nextStep = s.relayStep + 1;
        if (nextStep <= 4) {
          soundEngine.playRelayClack(nextStep);
          set({ relayStep: nextStep });
        } else {
          // Result is 8 normally (1000), or corrupted to 4 (0100) if moth blocks bit 3!
          const result = s.relayBug ? 4 : 8;
          soundEngine.playRelayClack(5);
          set({ relayRunning: false, relayStep: 4, relayResult: result });
        }
      }
    };
  })(),

  // --- Vacuum Tube ---
  toggleTubeHeater: () => {
    const next = !get().tubeHeaterOn;
    soundEngine.playKnifeSwitch();
    set({
      tubeHeaterOn: next,
      tubeHvOn: next ? get().tubeHvOn : false,
      tubeColdWarn: false,
      tubeComputing: false,
    });
    syncHumForState(get());
  },

  toggleTubeHv: () => {
    const s = get();
    if (!s.tubeHeaterOn || s.tubeTemp < 480) {
      soundEngine.playJamClank();
      set({ tubeColdWarn: true });
      return;
    }
    if (s.tubeBurnedIdx !== null) {
      soundEngine.playJamClank();
      return;
    }
    const next = !s.tubeHvOn;
    soundEngine.playToggleClick(next);
    set({ tubeHvOn: next, tubeColdWarn: false, tubeComputing: false });
  },

  toggleTubeStress: () => {
    const next = !get().tubeStress;
    soundEngine.playToggleClick(next);
    set({ tubeStress: next });
  },

  runTubeCompute: () => {
    const s = get();
    if (!s.tubeHeaterOn || !s.tubeHvOn || s.tubeBurnedIdx !== null || s.tubeComputing) return;
    soundEngine.playToggleClick(true);
    set({ tubeComputing: true, tubeComputeProgress: 0, tubeResult: null });
  },

  replaceTube: () => {
    soundEngine.playToggleClick(true);
    set({
      tubeBurnedIdx: null,
      tubeTemp: Math.min(get().tubeTemp, 560),
      tubeStress: false,
      tubeResult: null,
    });
  },

  tickVacuum: (dt) => {
    const s = get();
    if (s.remotionMode) return;
    let temp = s.tubeTemp;
    const targetTemp = !s.tubeHeaterOn
      ? 25
      : s.tubeStress && s.tubeHvOn
        ? 980
        : s.tubeHvOn
          ? 700
          : 580;
    const rate = s.tubeHeaterOn ? (s.tubeStress ? 130 : 210) : 110;

    if (Math.abs(temp - targetTemp) > 0.5) {
      temp += Math.sign(targetTemp - temp) * Math.min(Math.abs(targetTemp - temp), rate * dt);
    }

    let burned = s.tubeBurnedIdx;
    let hvOn = s.tubeHvOn;
    let computing = s.tubeComputing;
    let prog = s.tubeComputeProgress;
    let result = s.tubeResult;

    if (temp >= 910 && burned === null && s.tubeHvOn) {
      burned = 2; // center-right tube pops!
      hvOn = false;
      computing = false;
      soundEngine.playTubePop();
    }

    if (computing && hvOn && burned === null) {
      prog += dt * 1.4;
      if (prog >= 1) {
        prog = 1;
        computing = false;
        result = 8;
        soundEngine.playToggleClick(true);
      }
    }

    const coldWarn = temp >= 480 ? false : s.tubeColdWarn;

    if (
      temp !== s.tubeTemp ||
      burned !== s.tubeBurnedIdx ||
      hvOn !== s.tubeHvOn ||
      computing !== s.tubeComputing ||
      prog !== s.tubeComputeProgress ||
      result !== s.tubeResult ||
      coldWarn !== s.tubeColdWarn
    ) {
      set({
        tubeTemp: temp,
        tubeBurnedIdx: burned,
        tubeHvOn: hvOn,
        tubeComputing: computing,
        tubeComputeProgress: prog,
        tubeResult: result,
        tubeColdWarn: coldWarn,
      });
      if (s.activeEra === 'vacuum') {
        syncHumForState(get());
      }
    }
  },

  // --- Transistor ---
  toggleTxPower: () => {
    const next = !get().txPowerOn;
    soundEngine.playToggleClick(next);
    set({ txPowerOn: next });
  },

  flipTxBit: (bank, idx) => {
    soundEngine.playToggleClick(true);
    set((s) => {
      if (bank === 'A') {
        const nextA = [...s.txBitsA] as [number, number, number, number];
        nextA[idx] = nextA[idx] ? 0 : 1;
        return { txBitsA: nextA };
      } else {
        const nextB = [...s.txBitsB] as [number, number, number, number];
        nextB[idx] = nextB[idx] ? 0 : 1;
        return { txBitsB: nextB };
      }
    });
  },

  toggleTxCompare: () => {
    soundEngine.playToggleClick(!get().txCompareTube);
    set((s) => ({ txCompareTube: !s.txCompareTube }));
  },

  presetTxFivePlusThree: () => {
    soundEngine.playToggleClick(true);
    set({ txPowerOn: true, txBitsA: [0, 1, 0, 1], txBitsB: [0, 0, 1, 1] });
  },

  // --- 8-Bit Micro ---
  togglePcPower: () => {
    const next = !get().pcPowerOn;
    soundEngine.playKnifeSwitch();
    if (next) {
      setTimeout(() => {
        if (get().pcPowerOn) soundEngine.playPostBeep();
      }, 220);
      set({
        pcPowerOn: true,
        pcBootProgress: 0.05,
        pcRunning: false,
        pcStage: 'IDLE',
        pcStageTimer: 0,
        pcLines: ['64KB RAM OK', 'READY > _'],
      });
    } else {
      set({
        pcPowerOn: false,
        pcBootProgress: 0,
        pcRunning: false,
        pcStage: 'IDLE',
        pcStageTimer: 0,
        pcLines: ['SYSTEM OFF'],
      });
    }
    syncHumForState(get());
  },

  setPcClockHz: (hz) => {
    soundEngine.playToggleClick(true);
    set({ pcClockHz: hz });
  },

  runPcCompute: () => {
    const s = get();
    if (!s.pcPowerOn || s.pcBootProgress < 0.85 || s.pcRunning) return;
    soundEngine.playClockTick();
    set({
      pcRunning: true,
      pcStage: 'FETCH',
      pcStageTimer: 0,
      pcLines: ['> LOAD A, #05', '> ADD  A, #03', 'EXECUTING...'],
    });
  },

  tickPc: (dt) => {
    const s = get();
    if (s.remotionMode) return;
    let boot = s.pcBootProgress;
    if (s.pcPowerOn && boot < 1) {
      boot = Math.min(1, boot + dt * 1.15);
      set({ pcBootProgress: boot });
      if (s.activeEra === 'micro8') syncHumForState(get());
    }

    if (!s.pcRunning || !s.pcPowerOn) return;

    const stepDur = s.pcClockHz === 1 ? 0.85 : s.pcClockHz === 8 ? 0.22 : 0.05;
    let timer = s.pcStageTimer + dt;
    if (timer >= stepDur) {
      timer = 0;
      soundEngine.playClockTick();
      if (s.pcStage === 'FETCH') {
        set({ pcStage: 'DECODE', pcStageTimer: 0 });
      } else if (s.pcStage === 'DECODE') {
        set({ pcStage: 'EXECUTE', pcStageTimer: 0 });
      } else if (s.pcStage === 'EXECUTE') {
        set({
          pcStage: 'DONE',
          pcRunning: false,
          pcStageTimer: 0,
          pcLines: ['> LOAD A, #05', '> ADD  A, #03', 'ACC = 08 (00001000)', 'READY > _'],
        });
      }
    } else {
      set({ pcStageTimer: timer });
    }
  },

  // --- Modern ---
  toggleModPower: () => {
    const next = !get().modPowerOn;
    soundEngine.playToggleClick(next);
    set({
      modPowerOn: next,
      modRunning: false,
      modProgress: 0,
      modElapsedMs: null,
    });
  },

  setModMode: (mode) => {
    soundEngine.playToggleClick(mode === 'GPU');
    set({ modMode: mode, modRunning: false, modProgress: 0, modElapsedMs: null });
  },

  runModCompute: () => {
    const s = get();
    if (!s.modPowerOn || s.modRunning) return;
    if (s.modMode === 'GPU') {
      soundEngine.playGpuFlash();
      set({ modRunning: false, modProgress: 256, modElapsedMs: 0.4 });
    } else {
      soundEngine.playToggleClick(true);
      set({ modRunning: true, modProgress: 0, modElapsedMs: null });
    }
  },

  tickModern: (dt) => {
    const s = get();
    if (s.remotionMode || !s.modRunning || !s.modPowerOn || s.modMode !== 'CPU') return;
    const next = Math.min(256, s.modProgress + dt * 95);
    if (next >= 256) {
      soundEngine.playToggleClick(true);
      set({ modProgress: 256, modRunning: false, modElapsedMs: 2680 });
    } else {
      set({ modProgress: next });
    }
  },
}));
