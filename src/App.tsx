import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { ControlPanel } from './components/ControlPanel';
import { SceneStage } from './scene/SceneStage';
import { ERAS } from './data/eras';
import { useSimStore } from './store/simStore';

export function App() {
  const activeEra = useSimStore((s) => s.activeEra);
  const setEra = useSimStore((s) => s.setEra);
  const idx = ERAS.findIndex((e) => e.id === activeEra);

  const prevEra = () => setEra(ERAS[(idx - 1 + ERAS.length) % ERAS.length].id);
  const nextEra = () => setEra(ERAS[(idx + 1) % ERAS.length].id);

  return (
    <div className="w-screen h-screen flex flex-col drafting-bg overflow-hidden">
      <TopBar />

      <main className="relative flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Dominant Realistic 3D Object Stage (dedicated open space — never overlapped by panel) */}
        <div className="relative flex-1 min-w-0 min-h-0">
          <SceneStage />

          {/* Bottom-Left Subtle Interaction Hint & Era Stepper */}
          <div className="hidden md:flex items-center gap-2.5 absolute bottom-5 left-5 z-20">
            <button
              onClick={prevEra}
              className="swiss-pill cursor-pointer flex items-center gap-1.5 px-3.5 py-2 bg-white font-mono-tech text-xs md:text-[13px] font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              PREV
            </button>
            <button
              onClick={nextEra}
              className="swiss-pill cursor-pointer flex items-center gap-1.5 px-3.5 py-2 bg-[#d9ff00] font-mono-tech text-xs md:text-[13px] font-bold"
            >
              NEXT ERA
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="ml-1 px-3 py-2 bg-white/95 border-[1.5px] border-[#0b0b0b] font-mono-tech text-xs font-medium uppercase tracking-wider text-[#222]">
              DRAG TO ORBIT · SCROLL TO ZOOM · CLICK PARTS
            </span>
          </div>
        </div>

        {/* Dedicated Right Inspector Column */}
        <div className="z-20 shrink-0 p-3 md:py-5 md:pr-5 md:pl-0 flex items-start md:items-center">
          <ControlPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
