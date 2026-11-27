// Stop at the first boundary reached, including motion that reverses direction.
export function observationTime(id: string | undefined, p: Record<string, number>, width: number) {
  function crossing(boundaries: number[], velocity: number, acceleration: number) {
    const times = boundaries.flatMap(distance => {
      if (!acceleration) return velocity ? [distance / velocity] : [];
      const root = Math.sqrt(velocity ** 2 + 2 * acceleration * distance);
      return [(-velocity + root) / acceleration, (-velocity - root) / acceleration];
    }).filter(t => t > 0 && Number.isFinite(t));
    return times.length ? Math.min(...times) : 0;
  }
  switch (id) {
    case 'phys-01': return crossing([24, width - 24].map(px => (px-width*0.25)/8-p.x0), p.v, 0);
    case 'phys-02': return crossing([24, width - 24].map(px => (px-width*0.22)/4.5), p.v0, p.a);
    case 'phys-03':
    case 'phys-04': return Math.sqrt(2*p.h0/p.g);
    case 'phys-05': return 2*p.v0*Math.sin(p.angle*Math.PI/180)/p.g;
    case 'phys-06': return crossing([(width-54-185)/3.5], 0, p.F/p.m);
    case 'phys-07': {
      const angle = p.alpha*Math.PI/180;
      return crossing([14], 0, Math.max(0, 9.8*(Math.sin(angle)-p.mu*Math.cos(angle))));
    }
    case 'phys-08': {
      const acceleration = p.F > p.m*9.8*p.mun ? p.F/p.m-9.8*Math.min(p.mut,p.mun) : 0;
      return crossing([(width-80-150)/6], 0, acceleration);
    }
    case 'phys-09': return crossing([4.5], 0, 9.8*Math.abs(p.m2-p.m1)/(p.m1+p.m2));
    case 'phys-28': return (2*(width-100)+90)/(75*p.speed);
    default: return 30;
  }
}

export function interferenceAt(x: number, y: number, separation: number, wavelength: number, cycles: number) {
  const r1 = Math.hypot(x + separation/2, y);
  const r2 = Math.hypot(x - separation/2, y);
  const k = 2*Math.PI/wavelength;
  const phase = 2*Math.PI*cycles;
  return { r1, r2, amplitude: 2*Math.abs(Math.cos(k*(r1-r2)/2)),
    u: Math.cos(k*r1-phase) + Math.cos(k*r2-phase) };
}
