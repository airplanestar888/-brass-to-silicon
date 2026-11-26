import { AlertTriangle, Flame, Play, Power, Wrench, Zap } from 'lucide-react';
import { ERAS } from '../data/eras';
import { useSimStore } from '../store/simStore';

function MechControls() {
  const mechValue = useSimStore((s) => s.mechValue);
  const autoSteps = useSimStore((s) => s.mechAutoSteps);
  const overdrive = useSimStore((s) => s.mechOverdrive);
  const jammed = useSimStore((s) => s.mechJammed);
  const turnCrank = useSimStore((s) => s.turnCrankOneStep);
  const startCompute = useSimStore((s) => s.startMechCompute);
  const toggleOverdrive = useSimStore((s) => s.toggleMechOverdrive);
  const unjam = useSimStore((s) => s.unjamMech);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-[1.5px] border-[#0b0b0b] px-3 py-2 bg-[#f9f9f7]">
        <span className="font-mono-tech text-xs font-semibold uppercase text-[#444]">DRUM REGISTER</span>
        <span className="font-mono-tech text-xl font-bold px-2.5 py-0.5 bg-[#d9ff00] border border-[#0b0b0b]">
          {String(mechValue).padStart(2, '0')}
        </span>
      </div>

      {jammed ? (
        <button
          onClick={unjam}
          className="swiss-pill cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 bg-[#ff3b30] text-white font-mono-tech text-[13px] font-bold"
        >
          <Wrench className="w-4 h-4" />
          GEAR JAMMED — RELEASE LEVER
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={turnCrank}
            className="swiss-pill cursor-pointer py-2.5 px-2.5 bg-white font-mono-tech text-[13px] font-bold"
          >
            CRANK +1
          </button>
          <button
            onClick={startCompute}
            disabled={autoSteps > 0}
            className="swiss-pill cursor-pointer flex items-center justify-center gap-1.5 py-2.5 px-2.5 bg-[#d9ff00] font-mono-tech text-[13px] font-bold disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {autoSteps > 0 ? 'CRANKING...' : 'COMPUTE 5+3'}
          </button>
        </div>
      )}

      <button
        onClick={toggleOverdrive}
        className={`swiss-pill cursor-pointer w-full py-2 px-3 font-mono-tech text-xs font-bold flex items-center justify-between ${
          overdrive ? 'bg-[#d9ff00]' : 'bg-white'
        }`}
      >
        <span>FORCE FAST CRANK</span>
        <span>{overdrive ? 'HIGH TORQUE' : 'NORMAL'}</span>
      </button>
    </div>
  );
}

function RelayControls() {
  const powerOn = useSimStore((s) => s.relayPowerOn);
  const cardIn = useSimStore((s) => s.relayCardIn);
  const running = useSimStore((s) => s.relayRunning);
  const step = useSimStore((s) => s.relayStep);
  const result = useSimStore((s) => s.relayResult);
  const bug = useSimStore((s) => s.relayBug);

  const togglePower = useSimStore((s) => s.toggleRelayPower);
  const toggleCard = useSimStore((s) => s.toggleRelayCard);
  const runCompute = useSimStore((s) => s.runRelayCompute);
  const toggleBug = useSimStore((s) => s.toggleRelayBug);
  const clearBug = useSimStore((s) => s.clearRelayBug);

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={togglePower}
          className={`swiss-pill cursor-pointer py-2.5 px-2.5 font-mono-tech text-[13px] font-bold flex items-center justify-center gap-1.5 ${
            powerOn ? 'bg-[#d9ff00]' : 'bg-white'
          }`}
        >
          <Power className="w-4 h-4 shrink-0" />
          {powerOn ? 'KNIFE: ON' : '1. KNIFE OFF'}
        </button>
        <button
          onClick={toggleCard}
          className={`swiss-pill cursor-pointer py-2.5 px-2.5 font-mono-tech text-[13px] font-bold ${
            cardIn ? 'bg-[#d9ff00]' : 'bg-white'
          }`}
        >
          {cardIn ? 'CARD: LOADED' : '2. INSERT CARD'}
        </button>
      </div>

      <button
        onClick={runCompute}
        disabled={!powerOn || !cardIn || running}
        className="swiss-pill cursor-pointer w-full py-2.5 px-3 bg-[#d9ff00] font-mono-tech text-[13px] font-bold flex items-center justify-center gap-1.5 disabled:bg-[#f2f2ef] disabled:text-[#888]"
      >
        <Play className="w-4 h-4" />
        {running ? `CLACKING RELAY ${step}/4...` : 'EXECUTE 5 + 3'}
      </button>

      {result !== null && (
        <div
          className={`border-[1.5px] border-[#0b0b0b] px-3 py-2 flex items-center justify-between font-mono-tech text-[13px] ${
            bug ? 'bg-[#ff3b30] text-white' : 'bg-[#d9ff00] text-[#0b0b0b]'
          }`}
        >
          <span>{bug ? 'ERR: BIT 3 BLOCKED' : 'OUTPUT: 5 + 3'}</span>
          <span className="font-bold">
            {result} ({result.toString(2).padStart(4, '0')}₂)
          </span>
        </div>
      )}

      {bug ? (
        <button
          onClick={clearBug}
          className="swiss-pill cursor-pointer w-full py-2 px-3 bg-white font-mono-tech text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <AlertTriangle className="w-4 h-4 text-[#ff3b30]" />
          MOTH IN RELAY #1 — REMOVE BUG
        </button>
      ) : (
        <button
          onClick={toggleBug}
          className="swiss-pill cursor-pointer w-full py-2 px-3 bg-white font-mono-tech text-xs font-semibold text-[#333]"
        >
          SIMULATE FIRST COMPUTER BUG
        </button>
      )}
    </div>
  );
}

function VacuumControls() {
  const heaterOn = useSimStore((s) => s.tubeHeaterOn);
  const temp = useSimStore((s) => s.tubeTemp);
  const hvOn = useSimStore((s) => s.tubeHvOn);
  const coldWarn = useSimStore((s) => s.tubeColdWarn);
  const stress = useSimStore((s) => s.tubeStress);
  const burnedIdx = useSimStore((s) => s.tubeBurnedIdx);
  const computing = useSimStore((s) => s.tubeComputing);
  const result = useSimStore((s) => s.tubeResult);

  const toggleHeater = useSimStore((s) => s.toggleTubeHeater);
  const toggleHv = useSimStore((s) => s.toggleTubeHv);
  const toggleStress = useSimStore((s) => s.toggleTubeStress);
  const runCompute = useSimStore((s) => s.runTubeCompute);
  const replaceTube = useSimStore((s) => s.replaceTube);

  const isWarm = temp >= 480;
  const tempPct = Math.min(100, Math.max(0, ((temp - 25) / 920) * 100));

  return (
    <div className="space-y-2.5">
      {/* Filament Temp Meter */}
      <div className="border-[1.5px] border-[#0b0b0b] p-2.5 bg-[#f9f9f7]">
        <div className="flex items-center justify-between font-mono-tech text-xs mb-1.5">
          <span className="flex items-center gap-1 font-bold">
            <Flame className="w-4 h-4" />
            FILAMENT TEMP
          </span>
          <span className="font-bold">
            {Math.round(temp)}°C · {isWarm ? 'WARM' : 'COLD'}
          </span>
        </div>
        <div className="w-full h-3 bg-white border border-[#0b0b0b] overflow-hidden">
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${tempPct}%`,
              backgroundColor: temp > 820 ? '#ff3b30' : '#d9ff00',
            }}
          />
        </div>
      </div>

      {/* 2-Stage Power Ritual */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={toggleHeater}
          className={`swiss-pill cursor-pointer py-2.5 px-2.5 font-mono-tech text-xs font-bold ${
            heaterOn ? 'bg-[#d9ff00]' : 'bg-white'
          }`}
        >
          {heaterOn ? '1. HEATER: ON' : '1. WARM HEATERS'}
        </button>
        <button
          onClick={toggleHv}
          className={`swiss-pill cursor-pointer py-2.5 px-2.5 font-mono-tech text-xs font-bold ${
            hvOn ? 'bg-[#d9ff00]' : isWarm ? 'bg-white' : 'bg-[#f4f4f2] text-[#777]'
          }`}
        >
          {hvOn ? '2. HV B+: ON' : '2. HIGH VOLTAGE'}
        </button>
      </div>

      {coldWarn && (
        <div className="border-[1.5px] border-[#0b0b0b] bg-[#ff3b30] text-white px-3 py-2 font-mono-tech text-xs font-semibold">
          WAIT: WARM FILAMENTS TO 480°C BEFORE HIGH VOLTAGE!
        </div>
      )}

      {burnedIdx !== null ? (
        <button
          onClick={replaceTube}
          className="swiss-pill cursor-pointer w-full py-2.5 px-3 bg-[#ff3b30] text-white font-mono-tech text-[13px] font-bold flex items-center justify-center gap-1.5"
        >
          <Wrench className="w-4 h-4" />
          TUBE #{burnedIdx + 1} BURNED OUT — REPLACE
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={runCompute}
            disabled={!hvOn || computing}
            className="swiss-pill cursor-pointer py-2.5 px-2.5 bg-[#d9ff00] font-mono-tech text-[13px] font-bold disabled:bg-[#f2f2ef] disabled:text-[#888]"
          >
            {computing ? 'PULSING...' : result === 8 ? 'OUT: 8 (DONE)' : 'COMPUTE 5+3'}
          </button>
          <button
            onClick={toggleStress}
            disabled={!hvOn}
            className={`swiss-pill cursor-pointer py-2.5 px-2.5 font-mono-tech text-xs font-bold disabled:opacity-45 ${
              stress ? 'bg-[#ff3b30] text-white' : 'bg-white'
            }`}
          >
            {stress ? 'OVERHEATING!' : 'OVERLOAD TUBE'}
          </button>
        </div>
      )}
    </div>
  );
}

function TransistorControls() {
  const powerOn = useSimStore((s) => s.txPowerOn);
  const bitsA = useSimStore((s) => s.txBitsA);
  const bitsB = useSimStore((s) => s.txBitsB);
  const compare = useSimStore((s) => s.txCompareTube);

  const togglePower = useSimStore((s) => s.toggleTxPower);
  const flipBit = useSimStore((s) => s.flipTxBit);
  const toggleCompare = useSimStore((s) => s.toggleTxCompare);

  const valA = bitsA[0] * 8 + bitsA[1] * 4 + bitsA[2] * 2 + bitsA[3];
  const valB = bitsB[0] * 8 + bitsB[1] * 4 + bitsB[2] * 2 + bitsB[3];

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={togglePower}
          className={`swiss-pill cursor-pointer py-2.5 px-2.5 font-mono-tech text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 ${
            powerOn ? 'bg-[#d9ff00]' : 'bg-white'
          }`}
        >
          <Zap className="w-4 h-4 shrink-0" />
          {powerOn ? 'POWER: ON (0s)' : 'FLIP POWER ON'}
        </button>
        <button
          onClick={toggleCompare}
          className={`swiss-pill cursor-pointer py-2.5 px-2.5 font-mono-tech text-xs font-bold whitespace-nowrap ${
            compare ? 'bg-[#d9ff00]' : 'bg-white'
          }`}
        >
          {compare ? 'HIDE COMPARE' : 'VS VACUUM TUBE'}
        </button>
      </div>

      {/* Interactive Binary Bit Inputs */}
      <div className="border-[1.5px] border-[#0b0b0b] p-2.5 bg-[#f9f9f7] space-y-2">
        <div className="flex items-center justify-between font-mono-tech text-xs">
          <span className="font-bold">A ({valA})</span>
          <div className="flex gap-1.5">
            {bitsA.map((b, i) => (
              <button
                key={i}
                onClick={() => flipBit('A', i)}
                className={`w-7 h-7 border border-[#0b0b0b] text-sm font-bold cursor-pointer ${
                  b ? 'bg-[#d9ff00]' : 'bg-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between font-mono-tech text-xs">
          <span className="font-bold">B ({valB})</span>
          <div className="flex gap-1.5">
            {bitsB.map((b, i) => (
              <button
                key={i}
                onClick={() => flipBit('B', i)}
                className={`w-7 h-7 border border-[#0b0b0b] text-sm font-bold cursor-pointer ${
                  b ? 'bg-[#d9ff00]' : 'bg-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-1.5 border-t border-[#d8d8d4] flex items-center justify-between font-mono-tech text-[13px]">
          <span className="font-semibold">SILICON SUM</span>
          <span className={`font-bold px-2.5 py-0.5 border border-[#0b0b0b] ${powerOn ? 'bg-[#d9ff00]' : 'bg-white text-[#888]'}`}>
            {powerOn ? `${valA} + ${valB} = ${valA + valB}` : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
}

function Micro8Controls() {
  const powerOn = useSimStore((s) => s.pcPowerOn);
  const bootProgress = useSimStore((s) => s.pcBootProgress);
  const clockHz = useSimStore((s) => s.pcClockHz);
  const running = useSimStore((s) => s.pcRunning);
  const stage = useSimStore((s) => s.pcStage);

  const togglePower = useSimStore((s) => s.togglePcPower);
  const setClock = useSimStore((s) => s.setPcClockHz);
  const runCompute = useSimStore((s) => s.runPcCompute);

  const ready = powerOn && bootProgress >= 0.85;

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={togglePower}
          className={`swiss-pill cursor-pointer py-2.5 px-2.5 font-mono-tech text-xs font-bold flex items-center justify-center gap-1.5 ${
            powerOn ? 'bg-[#d9ff00]' : 'bg-white'
          }`}
        >
          <Power className="w-4 h-4 shrink-0" />
          {powerOn ? 'ROCKER: ON' : 'BOOT 8-BIT PC'}
        </button>

        <button
          onClick={runCompute}
          disabled={!ready || running}
          className="swiss-pill cursor-pointer py-2.5 px-2.5 bg-[#d9ff00] font-mono-tech text-xs font-bold disabled:bg-[#f2f2ef] disabled:text-[#888]"
        >
          {running ? stage : 'RUN ADD 5, 3'}
        </button>
      </div>

      {/* Visual Clock Speed Stepper */}
      <div className="border-[1.5px] border-[#0b0b0b] p-2.5 bg-[#f9f9f7]">
        <div className="flex items-center justify-between font-mono-tech text-xs mb-2">
          <span className="font-bold">CPU CLOCK STEP RATE</span>
          <span className="font-bold">{clockHz} Hz</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 8, 64].map((hz) => (
            <button
              key={hz}
              onClick={() => setClock(hz)}
              className={`cursor-pointer py-1.5 border border-[#0b0b0b] font-mono-tech text-xs font-bold ${
                clockHz === hz ? 'bg-[#d9ff00]' : 'bg-white'
              }`}
            >
              {hz === 1 ? '1 Hz SLOW' : hz === 8 ? '8 Hz' : '64 Hz'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModernControls() {
  const powerOn = useSimStore((s) => s.modPowerOn);
  const mode = useSimStore((s) => s.modMode);
  const running = useSimStore((s) => s.modRunning);
  const progress = useSimStore((s) => s.modProgress);
  const elapsed = useSimStore((s) => s.modElapsedMs);

  const togglePower = useSimStore((s) => s.toggleModPower);
  const setMode = useSimStore((s) => s.setModMode);
  const runCompute = useSimStore((s) => s.runModCompute);

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={togglePower}
          className={`swiss-pill cursor-pointer py-2.5 px-2.5 font-mono-tech text-xs font-bold flex items-center justify-center gap-1.5 ${
            powerOn ? 'bg-[#d9ff00]' : 'bg-white'
          }`}
        >
          <Power className="w-4 h-4 shrink-0" />
          {powerOn ? 'AWAKE' : 'WAKE SILICON'}
        </button>

        <button
          onClick={runCompute}
          disabled={!powerOn || running}
          className="swiss-pill cursor-pointer py-2.5 px-2.5 bg-[#d9ff00] font-mono-tech text-xs font-bold disabled:bg-[#f2f2ef] disabled:text-[#888]"
        >
          {running ? `${Math.round((progress / 256) * 100)}%` : 'RUN 256 TASKS'}
        </button>
      </div>

      {/* CPU Serial vs GPU Parallel Toggle */}
      <div className="grid grid-cols-2 gap-1.5 border-[1.5px] border-[#0b0b0b] p-1.5 bg-[#f9f9f7]">
        {(['CPU', 'GPU'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`cursor-pointer py-2 font-mono-tech text-xs font-bold border border-[#0b0b0b] ${
              mode === m ? 'bg-[#d9ff00]' : 'bg-white'
            }`}
          >
            {m === 'CPU' ? '1 CORE (SERIAL)' : '256 CORES (GPU)'}
          </button>
        ))}
      </div>

      {elapsed !== null && (
        <div className="border-[1.5px] border-[#0b0b0b] bg-[#d9ff00] px-3 py-2 flex items-center justify-between font-mono-tech text-[13px] font-bold">
          <span>{mode === 'GPU' ? 'PARALLEL FLASH' : 'SERIAL FINISH'}</span>
          <span>{elapsed < 1 ? `${elapsed} ms` : `${(elapsed / 1000).toFixed(2)} s`}</span>
        </div>
      )}
    </div>
  );
}

export function ControlPanel() {
  const activeEra = useSimStore((s) => s.activeEra);
  const era = ERAS.find((e) => e.id === activeEra)!;

  return (
    <aside className="swiss-panel w-full md:w-[376px] p-5 flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto thin-scroll">
      {/* Header Attributes */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono-tech text-xs font-bold px-2.5 py-0.5 bg-[#d9ff00] border border-[#0b0b0b] whitespace-nowrap shrink-0">
            GEN {era.code} · {era.year}
          </span>
          <span className="font-mono-tech text-[11px] font-medium uppercase tracking-wider text-[#444] text-right leading-tight">
            {era.machineRef}
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold leading-tight text-[#0b0b0b]">
          {era.fullTitle}
        </h1>
        <p className="mt-2 font-mono-tech text-[13px] leading-snug text-[#0b0b0b] bg-[#f4f4f1] border-l-[3px] border-[#0b0b0b] pl-3 py-1.5">
          {era.powerRitual}
        </p>
      </div>

      {/* Interactive Era Controls */}
      {activeEra === 'mechanical' && <MechControls />}
      {activeEra === 'relay' && <RelayControls />}
      {activeEra === 'vacuum' && <VacuumControls />}
      {activeEra === 'transistor' && <TransistorControls />}
      {activeEra === 'micro8' && <Micro8Controls />}
      {activeEra === 'modern' && <ModernControls />}

      {/* Minimal 3-Cell Hardware Specs */}
      <div className="grid grid-cols-3 border-[1.5px] border-[#0b0b0b] divide-x-[1.5px] divide-[#0b0b0b] bg-white">
        <div className="p-2.5">
          <div className="font-mono-tech text-[11px] font-semibold uppercase text-[#555]">CLOCK</div>
          <div className="font-mono-tech text-[13px] font-bold mt-0.5 leading-tight">{era.specs.clock}</div>
        </div>
        <div className="p-2.5">
          <div className="font-mono-tech text-[11px] font-semibold uppercase text-[#555]">POWER</div>
          <div className="font-mono-tech text-[13px] font-bold mt-0.5 leading-tight">{era.specs.power}</div>
        </div>
        <div className="p-2.5">
          <div className="font-mono-tech text-[11px] font-semibold uppercase text-[#555]">ELEMENTS</div>
          <div className="font-mono-tech text-[13px] font-bold mt-0.5 leading-tight">{era.specs.switches}</div>
        </div>
      </div>

      {/* Concise Human Message */}
      <p className="text-sm leading-relaxed text-[#222] border-t border-[#e2e2de] pt-3">
        {era.story}
      </p>
    </aside>
  );
}
