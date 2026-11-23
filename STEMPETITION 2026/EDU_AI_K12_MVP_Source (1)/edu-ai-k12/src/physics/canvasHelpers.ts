export function drawStageBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  originX: number,
  originY: number,
  showAxes = true,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#172033';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = originX % step; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = originY % step; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  if (showAxes) {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(w, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, h);
    ctx.stroke();
  }
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  label?: string,
  lineWidth = 2.5,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const angle = Math.atan2(dy, dx);
  const head = Math.min(10, Math.max(6, len * 0.25));

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.fillText(label, x2 + 6, y2 - 6);
  }
  ctx.restore();
}

export function drawSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  coils = 10,
  amplitude = 10,
  color = '#94a3b8',
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 4) return;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const lead = 12;
  const bodyLen = Math.max(10, len - 2 * lead);
  ctx.lineTo(x1 + ux * lead, y1 + uy * lead);
  for (let i = 1; i <= coils * 2 - 1; i++) {
    const frac = i / (coils * 2);
    const s = lead + frac * bodyLen;
    const sign = i % 2 === 1 ? 1 : -1;
    ctx.lineTo(x1 + ux * s + nx * amplitude * sign, y1 + uy * s + ny * amplitude * sign);
  }
  ctx.lineTo(x2 - ux * lead, y2 - uy * lead);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#e2e8f0',
  align: CanvasTextAlign = 'left',
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '500 12px "IBM Plex Mono", monospace';
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}
