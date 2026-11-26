import '../index.css';
import { Composition } from 'remotion';
import { PowerOnVideo } from './PowerOnVideo';
import { DEMO_FPS, DEMO_TOTAL_FRAMES } from './manifest';

export const DEMO_OUTRO_FRAMES = 66; // ~2.2s white sponsor end-card

export function RemotionRoot() {
  return (
    <Composition
      id="PowerOnDemo"
      component={PowerOnVideo}
      durationInFrames={DEMO_TOTAL_FRAMES + DEMO_OUTRO_FRAMES}
      fps={DEMO_FPS}
      width={1920}
      height={1080}
    />
  );
}
