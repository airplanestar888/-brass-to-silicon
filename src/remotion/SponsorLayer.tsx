import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { DEMO_TOTAL_FRAMES } from './manifest';

/**
 * Minimalist full-white end scene showcasing plain "BUILT WITH" text + GMI Cloud logo.
 */
export function SponsorWhiteOutroLayer() {
  const frame = useCurrentFrame();
  if (frame < DEMO_TOTAL_FRAMES - 4) return null;

  const opacity = interpolate(frame, [DEMO_TOTAL_FRAMES - 4, DEMO_TOTAL_FRAMES + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(frame, [DEMO_TOTAL_FRAMES - 4, DEMO_TOTAL_FRAMES + 12], [0.97, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#FFFFFF',
        zIndex: 80,
        opacity,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <span
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#555555',
          }}
        >
          BUILT WITH
        </span>

        <img
          src={staticFile('sponsor/gmi-cloud.svg')}
          alt="GMI Cloud"
          style={{
            height: 148,
            width: 'auto',
            display: 'block',
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
