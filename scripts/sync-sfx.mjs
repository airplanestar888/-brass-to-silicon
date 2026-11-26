import fs from 'node:fs';
import path from 'node:path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const SAMPLE_RATE = 44100;

function writeWav(filePath, floatSamples) {
  const numSamples = floatSamples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, floatSamples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

function addTone(buf, startSec, durSec, freqStart, freqEnd, amp, wave = 'sine') {
  const s0 = Math.floor(startSec * SAMPLE_RATE);
  const len = Math.floor(durSec * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < len && s0 + i < buf.length; i++) {
    const t = i / len;
    const freq = freqStart + (freqEnd - freqStart) * t;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const env =
      Math.sin(Math.min(1, i / (SAMPLE_RATE * 0.004)) * Math.PI * 0.5) * Math.pow(1 - t, 1.8);
    let sample = 0;
    if (wave === 'sine') sample = Math.sin(phase);
    else if (wave === 'triangle') sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else if (wave === 'square') sample = Math.sin(phase) >= 0 ? 1 : -1;
    buf[s0 + i] += sample * env * amp;
  }
}

function addHum(buf, startSec, durSec, freq, amp) {
  const s0 = Math.floor(startSec * SAMPLE_RATE);
  const len = Math.floor(durSec * SAMPLE_RATE);
  for (let i = 0; i < len && s0 + i < buf.length; i++) {
    const t = i / len;
    const fadeIn = Math.min(1, i / (SAMPLE_RATE * 0.25));
    const fadeOut = Math.min(1, (len - i) / (SAMPLE_RATE * 0.25));
    const ramp = 0.45 + 0.55 * t;
    const val =
      Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE) * 0.7 +
      Math.sin((2 * Math.PI * freq * 2 * i) / SAMPLE_RATE) * 0.3;
    buf[s0 + i] += val * fadeIn * fadeOut * ramp * amp;
  }
}

// Durations matching src/remotion/manifest.ts at 30fps
const SPECS = [
  { id: 'mechanical', code: '01', dur: 181 / 30 },
  { id: 'relay', code: '02', dur: 235 / 30 },
  { id: 'vacuum', code: '03', dur: 244 / 30 },
  { id: 'transistor', code: '04', dur: 236 / 30 },
  { id: 'micro8', code: '05', dur: 253 / 30 },
  { id: 'modern', code: '06', dur: 261 / 30 },
];

for (const s of SPECS) {
  const buf = new Float32Array(Math.ceil(s.dur * SAMPLE_RATE));

  if (s.id === 'mechanical') {
    // Word "cranking" starts ~2.7s -> 5 crank steps -> carry rollover at 4.55s
    [2.75, 3.2, 3.65, 4.1, 4.55].forEach((t, idx) => {
      addTone(buf, t, 0.045, 250 + idx * 14, 75, 0.28, 'triangle');
    });
    addTone(buf, 5.0, 0.11, 165, 48, 0.36, 'sine');
  } else if (s.id === 'relay') {
    // "Throw the knife switch" (~3.05s) -> "feed a punch card" (~4.1s) -> "relays clatter" (~5.5s)
    addTone(buf, 3.15, 0.065, 420, 95, 0.32, 'square');
    addHum(buf, 3.2, s.dur - 3.4, 68, 0.065);
    addTone(buf, 4.3, 0.025, 620, 290, 0.16, 'triangle');
    [5.45, 5.75, 6.05, 6.35, 6.65].forEach((t, idx) => {
      addTone(buf, t, 0.032, 1180 + idx * 80, 220, 0.25, 'square');
    });
  } else if (s.id === 'vacuum') {
    // Cold HV warning clank (~3.15s), Heater ON (~4.5s), Hum swell, HV ON (~6.6s)
    addTone(buf, 3.2, 0.09, 210, 110, 0.22, 'square');
    addTone(buf, 4.55, 0.055, 410, 95, 0.26, 'square');
    addHum(buf, 4.6, s.dur - 4.8, 60, 0.095);
    addTone(buf, 6.55, 0.025, 920, 440, 0.22, 'triangle');
  } else if (s.id === 'transistor') {
    // "Flip one chrome toggle" (~2.0s) -> crisp snap -> dramatic dead silence!
    addTone(buf, 2.25, 0.025, 940, 460, 0.28, 'triangle');
    addTone(buf, 5.65, 0.02, 760, 380, 0.14, 'triangle');
  } else if (s.id === 'micro8') {
    // "Snap the red rocker switch" (~4.1s) -> classic 1046.5Hz POST beep (~4.55s) -> clock ticks
    addTone(buf, 4.25, 0.055, 400, 95, 0.28, 'square');
    addTone(buf, 4.55, 0.14, 1046.5, 1046.5, 0.17, 'square');
    [6.1, 6.6, 7.1].forEach((t) => {
      addTone(buf, t, 0.015, 1600, 1450, 0.11, 'sine');
    });
  } else if (s.id === 'modern') {
    // Wake click (~1.2s) -> Parallel GPU flash chord ("parallel GPU cores" ~4.3s)
    addTone(buf, 1.25, 0.02, 920, 450, 0.22, 'triangle');
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      addTone(buf, 4.35 + idx * 0.015, 0.24, f, f, 0.14, 'sine');
    });
  }

  writeWav(path.join(AUDIO_DIR, `sfx-${s.code}.wav`), buf);
  console.log(`Synced SFX -> sfx-${s.code}.wav (${s.dur.toFixed(2)}s)`);
}
