import * as THREE from 'three';

/**
 * Generates an extruded spur gear geometry with authentic teeth and hub cutout.
 */
export function createGearGeometry(
  teeth: number,
  outerRadius: number,
  innerRadius: number,
  thickness: number,
  boreRadius = 0.14
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const rootRadius = outerRadius - (outerRadius * 1.45) / teeth;
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.18;
    const a2 = a0 + step * 0.34;
    const a3 = a0 + step * 0.56;
    const a4 = a0 + step * 0.72;

    const p0x = Math.cos(a0) * rootRadius;
    const p0y = Math.sin(a0) * rootRadius;
    if (i === 0) shape.moveTo(p0x, p0y);
    else shape.lineTo(p0x, p0y);

    shape.lineTo(Math.cos(a1) * rootRadius, Math.sin(a1) * rootRadius);
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
    shape.lineTo(Math.cos(a4) * rootRadius, Math.sin(a4) * rootRadius);
  }
  shape.closePath();

  // Center shaft bore
  const hole = new THREE.Path();
  hole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  // Lightening holes if large gear
  if (innerRadius > boreRadius * 2.2) {
    const holeCount = 4;
    const orbitR = (innerRadius + boreRadius) * 0.54;
    const cutR = (innerRadius - boreRadius) * 0.24;
    for (let j = 0; j < holeCount; j++) {
      const ang = (j * Math.PI * 2) / holeCount;
      const cut = new THREE.Path();
      cut.absarc(Math.cos(ang) * orbitR, Math.sin(ang) * orbitR, cutR, 0, Math.PI * 2, true);
      shape.holes.push(cut);
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 16,
  });
  geo.center();
  return geo;
}

/**
 * Creates a crisp 0-9 cylindrical number drum texture (aged ivory & dark engraved ink).
 */
export function createDigitWheelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#EFE9DA';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top & bottom subtle metallic bevel bands
  ctx.fillStyle = '#C6B999';
  ctx.fillRect(0, 0, canvas.width, 18);
  ctx.fillRect(0, canvas.height - 18, canvas.width, 18);

  const cellW = canvas.width / 10;
  for (let i = 0; i < 10; i++) {
    const x = i * cellW;
    ctx.strokeStyle = '#9C9076';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 18, cellW, canvas.height - 36);

    ctx.fillStyle = '#181818';
    ctx.font = 'bold 124px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i), x + cellW * 0.5, canvas.height * 0.52);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Creates an authentic IBM-style 80-column buff punch card texture.
 */
export function createPunchCardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#DFD1AE';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Corner cut mark visual
  ctx.strokeStyle = '#9B8E6E';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  // Header text
  ctx.fillStyle = '#534A34';
  ctx.font = 'bold 14px "IBM Plex Mono", monospace';
  ctx.fillText('COMPUTE CARD · OP: ADD 05 + 03', 20, 26);

  // Tiny grid digits + punched rectangular holes
  ctx.font = '10px "IBM Plex Mono", monospace';
  const punchedCols = [
    [2, 2],
    [4, 5],
    [5, 3],
    [7, 7],
    [9, 1],
    [11, 4],
    [13, 6],
    [15, 2],
    [17, 5],
    [19, 8],
  ];

  for (let col = 0; col < 22; col++) {
    for (let row = 0; row < 9; row++) {
      const px = 22 + col * 21;
      const py = 46 + row * 21;
      const isPunched = punchedCols.some(([c, r]) => c === col && r === row);
      if (isPunched) {
        ctx.fillStyle = '#2A251D';
        ctx.fillRect(px, py - 5, 8, 14);
      } else {
        ctx.fillStyle = '#8F8264';
        ctx.fillText(String(row), px + 1, py + 5);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Vintage ivory-face panel ammeter / power gauge texture.
 */
export function createGaugeFaceTexture(label = 'kW LOAD'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F2ECD9';
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Arc ticks
  const startA = Math.PI * 0.78;
  const endA = Math.PI * 2.22;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const ang = startA + (endA - startA) * t;
    const rOut = 98;
    const rIn = i % 2 === 0 ? 80 : 88;
    ctx.strokeStyle = t > 0.75 ? '#C42B1C' : '#1E1E1E';
    ctx.lineWidth = i % 2 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(ang) * rIn, 128 + Math.sin(ang) * rIn);
    ctx.lineTo(128 + Math.cos(ang) * rOut, 128 + Math.sin(ang) * rOut);
    ctx.stroke();
  }

  ctx.fillStyle = '#1E1E1E';
  ctx.font = 'bold 20px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, 128, 178);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
