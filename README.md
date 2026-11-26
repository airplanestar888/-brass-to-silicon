# POWER ON — Computing Generations (1842 — 2026)

An interactive 3D hardware showcase exploring **what it actually felt like to turn on and operate a computer** across six generations — from hand-cranked brass gears to modern parallel GPUs.

Built with a minimalist Swiss drafting UI (dominant white, crisp black ink lines, and acid lemon-neon attributes) paired with realistic 3D PBR hardware materials and procedural Web Audio sound effects.

---

## The 6 Interactive Generations

1. **01 · 1842 — Mechanical Adding Engine**
   - No power button: turn the brass crank yourself (`CRANK +1` or `COMPUTE 5+3`), watch interlocking spur gears spin the ivory digit drums, and trigger a mechanical jam if forced too fast.
2. **02 · 1941 — Electromechanical Relay**
   - Throw the copper knife switch, load the punched cardstock, hear physical relays clatter, and trigger the **"First Computer Bug"** (a moth wedged in Relay #1 corrupting the output until cleared).
3. **03 · 1945 — Thermionic Vacuum Array**
   - Two-stage startup ritual: cold tubes reject high voltage. Warm the tungsten filaments past `480°C`, watch the analog kW meter climb and filaments glow orange, or overload a tube until it burns out and replace it.
4. **04 · 1958 — Discrete Solid-State Transistor**
   - Flip the chrome toggle for an instant, silent boot. Toggle live 4-bit binary inputs (`A + B`) and compare the tiny TO-18 metal-can transistor side-by-side against a full-size vacuum tube.
5. **05 · 1981 — 8-Bit Microprocessor & CRT**
   - Snap the red rocker switch, hear the classic `1046 Hz` POST beep, watch the green P31 phosphor CRT bloom, step visual clock rates (`1 Hz / 8 Hz / 64 Hz`), and toggle **X-RAY** to reveal the green motherboard and 40-pin DIP CPU.
6. **06 · 2026 — Modern Multicore & Parallel GPU**
   - Tap the anodized power ring for instant wake and compare **1 Core (Serial)** vs **256 Cores (GPU Parallel)** illuminating the nanometer silicon die grid.

---

## Tech Stack

- **Web App:** React 19, TypeScript, Vite, Tailwind CSS v4
- **3D Graphics:** Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`
- **State & Audio:** Zustand, Procedural Web Audio API (`src/audio/soundEngine.ts`)
- **Demo Video Pipeline:** Remotion (`remotion`, `@remotion/three`), `msedge-tts` voiceover + word-timed subtitles, offline PCM WAV hardware SFX

---

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

### Render the 1080p Demo Video (Remotion)

```bash
# Regenerate English narration audio, word timestamps, and hardware SFX
npm run audio:gen

# Open Remotion Studio preview
npm run video:studio

# Render 1920x1080 MP4 to out/power-on-demo.mp4
npm run video:render
```

---

Built with **GMI Cloud**
