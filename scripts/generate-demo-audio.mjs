import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const ROOT = process.cwd();
const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
const MANIFEST_PATH = path.join(ROOT, 'src', 'remotion', 'manifest.ts');

fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

const SEGMENTS = [
  {
    id: 'mechanical',
    code: '01',
    narration:
      'In 1842, turning on a computer meant cranking heavy brass gears with your own arm.',
  },
  {
    id: 'relay',
    code: '02',
    narration:
      'By 1941, electricity took over. Throw the knife switch, feed a punch card, and hear physical relays clatter.',
  },
  {
    id: 'vacuum',
    code: '03',
    narration:
      'Vacuum tubes removed moving parts, but cold glass cracked under high voltage. You waited for glowing filaments to warm up.',
  },
  {
    id: 'transistor',
    code: '04',
    narration:
      'Then silicon changed everything. Flip one chrome toggle: instant boot, dead silent, and a hundred times smaller.',
  },
  {
    id: 'micro8',
    code: '05',
    narration:
      'By 1981, an entire CPU fit onto one chip. Snap the red rocker switch, and watch the phosphor screen bloom.',
  },
  {
    id: 'modern',
    code: '06',
    narration:
      'Today, billions of switches wake instantly, splitting work across hundreds of parallel GPU cores. Try all six eras live.',
  },
];

// --- Pure PCM WAV writer (44.1kHz mono 16-bit) for crisp hardware SFX ---
const SAMPLE_RATE = 44100;

function writeWav(filePath, floatSamples) {
  const numSamples = floatSamples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM
  buffer.writeUInt16LE(1, 20); // Linear PCM
  buffer.writeUInt16LE(1, 22); // Mono
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
    const env = Math.sin(Math.min(1, i / (SAMPLE_RATE * 0.004)) * Math.PI * 0.5) * Math.pow(1 - t, 1.8);
    let sample = 0;
    if (wave === 'sine') sample = Math.sin(phase);
    else if (wave === 'triangle') sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else if (wave === 'square') sample = Math.sin(phase) >= 0 ? 1 : -1;
    else if (wave === 'saw') sample = 2 * ((phase / (2 * Math.PI)) % 1) - 1;
    buf[s0 + i] += sample * env * amp;
  }
}

function addHum(buf, startSec, durSec, freq, amp) {
  const s0 = Math.floor(startSec * SAMPLE_RATE);
  const len = Math.floor(durSec * SAMPLE_RATE);
  for (let i = 0; i < len && s0 + i < buf.length; i++) {
    const t = i / len;
    const fadeIn = Math.min(1, i / (SAMPLE_RATE * 0.3));
    const fadeOut = Math.min(1, (len - i) / (SAMPLE_RATE * 0.25));
    const ramp = 0.4 + 0.6 * t;
    const val = Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE) * 0.7 +
                Math.sin((2 * Math.PI * freq * 2 * i) / SAMPLE_RATE) * 0.3;
    buf[s0 + i] += val * fadeIn * fadeOut * ramp * amp;
  }
}

function generateSfxWav(id, durationSec, outPath) {
  const buf = new Float32Array(Math.ceil(durationSec * SAMPLE_RATE));

  if (id === 'mechanical') {
    // 5 crank ratchet clicks + heavy carry rollover thunk
    [0.8, 1.55, 2.3, 3.05, 3.8].forEach((t, idx) => {
      addTone(buf, t, 0.045, 260 + idx * 14, 75, 0.28, 'triangle');
    });
    addTone(buf, 4.35, 0.11, 165, 48, 0.36, 'sine');
  } else if (id === 'relay') {
    // Heavy knife switch slam + motor hum + 4 relay clacks
    addTone(buf, 1.35, 0.065, 420, 95, 0.32, 'square');
    addHum(buf, 1.45, Math.max(1, durationSec - 1.7), 68, 0.07);
    [2.6, 3.1, 3.6, 4.1, 4.6].forEach((t, idx) => {
      if (t < durationSec - 0.3) {
        addTone(buf, t, 0.032, 1180 + idx * 80, 220, 0.24, 'square');
      }
    });
  } else if (id === 'vacuum') {
    // Heater toggle + 60Hz hum swell + HV snap + tube pop!
    addTone(buf, 0.75, 0.055, 410, 95, 0.28, 'square');
    addHum(buf, 0.85, Math.max(1.5, durationSec - 1.2), 60, 0.11);
    addTone(buf, 3.45, 0.025, 920, 440, 0.24, 'triangle');
    const popTime = Math.min(durationSec - 0.9, 5.1);
    addTone(buf, popTime, 0.13, 690, 82, 0.35, 'sine');
  } else if (id === 'transistor') {
    // Single crisp chrome toggle click followed by dramatic solid-state silence
    addTone(buf, 1.85, 0.024, 940, 460, 0.26, 'triangle');
    addTone(buf, 2.35, 0.02, 860, 400, 0.18, 'triangle');
  } else if (id === 'micro8') {
    // Red rocker switch + classic 1046Hz POST beep + crisp clock ticks
    addTone(buf, 1.45, 0.055, 400, 95, 0.28, 'square');
    addTone(buf, 1.72, 0.14, 1046.5, 1046.5, 0.16, 'square');
    [3.1, 3.6, 4.1, 4.6].forEach((t) => {
      if (t < durationSec - 0.3) {
        addTone(buf, t, 0.015, 1600, 1450, 0.11, 'sine');
      }
    });
  } else if (id === 'modern') {
    // Precision wake click + parallel GPU flash chord
    addTone(buf, 1.0, 0.02, 920, 450, 0.2, 'triangle');
    const flashT = Math.min(durationSec - 1.8, 3.15);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      addTone(buf, flashT + idx * 0.014, 0.22, f, f, 0.14, 'sine');
    });
  }

  writeWav(outPath, buf);
}

// --- Edge TTS Synthesis with Windows SAPI fallback ---
async function synthWithEdgeTts(seg, outMp3Path) {
  const tempDir = fs.mkdtempSync(path.join(AUDIO_DIR, `tmp-${seg.code}-`));
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata('en-US-AndrewNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
      wordBoundaryEnabled: true,
    });
    const { audioFilePath, metadataFilePath } = await tts.toFile(tempDir, seg.narration, {
      rate: '+2%',
    });
    fs.copyFileSync(audioFilePath, outMp3Path);
    const metaRaw = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8'));
    tts.close();

    const words = (metaRaw.Metadata || [])
      .filter((m) => m.Type === 'WordBoundary')
      .map((m) => ({
        text: m.Data.text.Text,
        startMs: Math.round(m.Data.Offset / 10000),
        endMs: Math.round((m.Data.Offset + m.Data.Duration) / 10000),
      }));

    // 96 kbps MP3 = 12000 bytes/sec
    const bytes = fs.statSync(outMp3Path).size;
    const audioMs = Math.round((bytes / 12000) * 1000);
    const lastWordMs = words.length ? words[words.length - 1].endMs : 0;
    const durationMs = Math.max(audioMs, lastWordMs) + 750;

    return {
      audioFile: `audio/${path.basename(outMp3Path)}`,
      durationMs,
      words,
      engine: 'edge-neural',
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function synthWithWindowsSapi(seg, outWavPath) {
  const safeText = seg.narration.replace(/'/g, "''");
  const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft David Desktop')
$synth.Rate = 1
$words = New-Object System.Collections.ArrayList
$synth.add_SpeakProgress({
  param($s, $e)
  [void]$words.Add(@{ text = $e.Text; startMs = [int]$e.AudioPosition.TotalMilliseconds })
})
$synth.SetOutputToWaveFile('${outWavPath.replace(/\\/g, '\\\\')}')
$synth.Speak('${safeText}')
$synth.SetOutputToNull()
$synth.Dispose()
$words | ConvertTo-Json -Compress
`;
  const jsonOut = execFileSync('powershell', ['-NoProfile', '-Command', psScript], {
    encoding: 'utf8',
  }).trim();

  const parsed = JSON.parse(jsonOut || '[]');
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  const wavBuf = fs.readFileSync(outWavPath);
  const byteRate = wavBuf.readUInt32LE(28);
  const dataBytes = wavBuf.length - 44;
  const audioMs = Math.round((dataBytes / byteRate) * 1000);

  const words = arr.map((w, idx) => ({
    text: w.text,
    startMs: w.startMs,
    endMs: idx < arr.length - 1 ? arr[idx + 1].startMs : audioMs - 120,
  }));

  return {
    audioFile: `audio/${path.basename(outWavPath)}`,
    durationMs: audioMs + 650,
    words,
    engine: 'windows-sapi',
  };
}

async function main() {
  const FPS = 30;
  const entries = [];
  let cursorFrame = 0;

  for (const seg of SEGMENTS) {
    const mp3Path = path.join(AUDIO_DIR, `narration-${seg.code}.mp3`);
    const wavPath = path.join(AUDIO_DIR, `narration-${seg.code}.wav`);
    const sfxPath = path.join(AUDIO_DIR, `sfx-${seg.code}.wav`);

    let result;
    try {
      result = await synthWithEdgeTts(seg, mp3Path);
      console.log(`[${seg.code}] Edge TTS ok (${result.words.length} words, ${result.durationMs}ms)`);
    } catch (err) {
      console.warn(`[${seg.code}] Edge TTS unavailable (${err.message}); falling back to Windows SAPI`);
      result = synthWithWindowsSapi(seg, wavPath);
      console.log(`[${seg.code}] Windows SAPI ok (${result.words.length} words, ${result.durationMs}ms)`);
    }

    const durationInFrames = Math.ceil((result.durationMs / 1000) * FPS);
    generateSfxWav(seg.id, durationInFrames / FPS, sfxPath);

    entries.push({
      id: seg.id,
      code: seg.code,
      narration: seg.narration,
      audioFile: result.audioFile,
      sfxFile: `audio/${path.basename(sfxPath)}`,
      startFrame: cursorFrame,
      durationInFrames,
      words: result.words,
    });

    cursorFrame += durationInFrames;
  }

  const tsContent = `// Auto-generated by scripts/generate-demo-audio.mjs
import { EraId } from '../types/era';

export interface WordTiming {
  text: string;
  startMs: number;
  endMs: number;
}

export interface DemoSegment {
  id: EraId;
  code: string;
  narration: string;
  audioFile: string;
  sfxFile: string;
  startFrame: number;
  durationInFrames: number;
  words: WordTiming[];
}

export const DEMO_FPS = ${FPS};
export const DEMO_TOTAL_FRAMES = ${cursorFrame};

export const DEMO_SEGMENTS: DemoSegment[] = ${JSON.stringify(entries, null, 2)};
`;

  fs.writeFileSync(MANIFEST_PATH, tsContent, 'utf8');
  console.log(`\nGenerated manifest (${cursorFrame} frames / ${(cursorFrame / FPS).toFixed(1)}s) -> ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
