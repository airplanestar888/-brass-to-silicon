import { WordTiming } from './manifest';

interface SubtitleBarProps {
  words: WordTiming[];
  localMs: number;
}

/**
 * Pure TV broadcast-style yellow subtitles rendered as a separate overlay layer
 * on top of the 1920x1080 video (no panel, no box, crisp black outline).
 */
export function SubtitleBar({ words, localMs }: SubtitleBarProps) {
  if (!words.length) return null;

  // Split into balanced phrases of up to 8 words (standard 1-2 line TV subtitle pacing)
  const chunkCount = Math.max(1, Math.ceil(words.length / 8));
  const perChunk = Math.ceil(words.length / chunkCount);
  const chunks: WordTiming[][] = [];
  for (let i = 0; i < words.length; i += perChunk) {
    chunks.push(words.slice(i, i + perChunk));
  }

  let activeChunk = chunks[0];
  for (const chunk of chunks) {
    const start = chunk[0].startMs - 80;
    const end = chunk[chunk.length - 1].endMs + 220;
    if (localMs >= start && localMs <= end) {
      activeChunk = chunk;
      break;
    }
    if (localMs > end) {
      activeChunk = chunk;
    }
  }

  const firstStart = words[0].startMs - 120;
  const lastEnd = words[words.length - 1].endMs + 550;
  if (localMs < firstStart || localMs > lastEnd) {
    return null;
  }

  const lineText = activeChunk.map((w) => w.text).join(' ');

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 36,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        width: 1280,
        maxWidth: '72%',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          fontFamily: '"IBM Plex Sans", "Space Grotesk", Arial, sans-serif',
          fontSize: 44,
          fontWeight: 700,
          lineHeight: 1.24,
          letterSpacing: '-0.01em',
          color: '#FFE600',
          WebkitTextStroke: '7px #0B0B0B',
          paintOrder: 'stroke fill',
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.38)',
        }}
      >
        {lineText}
      </span>
    </div>
  );
}
