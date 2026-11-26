import { Eye, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { ERAS } from '../data/eras';
import { useSimStore } from '../store/simStore';

export function TopBar() {
  const activeEra = useSimStore((s) => s.activeEra);
  const xray = useSimStore((s) => s.xray);
  const soundEnabled = useSimStore((s) => s.soundEnabled);
  const setEra = useSimStore((s) => s.setEra);
  const toggleXray = useSimStore((s) => s.toggleXray);
  const toggleSound = useSimStore((s) => s.toggleSound);
  const resetActiveEra = useSimStore((s) => s.resetActiveEra);

  return (
    <header className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white border-b-[1.5px] border-[#0b0b0b]">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <span className="font-display font-bold text-xl md:text-2xl tracking-tight uppercase text-[#0b0b0b]">
          POWER ON
        </span>
        <span className="font-mono-tech text-xs font-bold px-2.5 py-1 bg-[#d9ff00] border-[1.5px] border-[#0b0b0b] text-[#0b0b0b] whitespace-nowrap">
          1842 — 2026
        </span>
      </div>

      {/* Generation Pill Switcher */}
      <nav
        aria-label="Computing generations"
        className="flex items-center gap-1.5 overflow-x-auto md:overflow-visible max-w-full py-0.5"
      >
        {ERAS.map((era) => {
          const active = era.id === activeEra;
          return (
            <button
              key={era.id}
              onClick={() => setEra(era.id)}
              className={`swiss-pill cursor-pointer px-3 py-1.5 font-mono-tech text-xs md:text-[13px] font-bold whitespace-nowrap ${
                active
                  ? 'bg-[#d9ff00] text-[#0b0b0b] shadow-[2px_2px_0_#0b0b0b]'
                  : 'bg-white text-[#0b0b0b] hover:bg-[#f5f5f3]'
              }`}
            >
              <span className="opacity-65 mr-1.5">{era.code}</span>
              {era.shortTitle}
            </button>
          );
        })}
      </nav>

      {/* Utility Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleXray}
          title="Toggle cutaway / X-ray view"
          className={`swiss-pill cursor-pointer flex items-center gap-1.5 px-3 py-1.5 font-mono-tech text-xs md:text-[13px] font-bold ${
            xray ? 'bg-[#d9ff00] text-[#0b0b0b] shadow-[2px_2px_0_#0b0b0b]' : 'bg-white text-[#0b0b0b]'
          }`}
        >
          <Eye className="w-4 h-4" />
          X-RAY
        </button>

        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          className={`swiss-pill cursor-pointer flex items-center gap-1.5 px-3 py-1.5 font-mono-tech text-xs md:text-[13px] font-bold ${
            soundEnabled ? 'bg-[#d9ff00] text-[#0b0b0b]' : 'bg-white text-[#0b0b0b]'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {soundEnabled ? 'SFX' : 'MUTED'}
        </button>

        <button
          onClick={resetActiveEra}
          title="Reset current machine"
          className="swiss-pill cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0b0b0b] font-mono-tech text-xs md:text-[13px] font-bold"
        >
          <RotateCcw className="w-4 h-4" />
          RESET
        </button>
      </div>
    </header>
  );
}
