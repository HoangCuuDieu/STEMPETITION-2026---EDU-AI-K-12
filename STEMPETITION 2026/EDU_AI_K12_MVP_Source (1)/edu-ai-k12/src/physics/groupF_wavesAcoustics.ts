import type { PhysicsSimulationSpec } from '../types/physics';
import { drawArrow, drawLabel, drawStageBackground } from './canvasHelpers';

export const GROUP_F_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-26',
    orderNumber: 26,
    name: 'Sóng ngang truyền trên dây',
    groupId: 'F',
    groupName: 'Sóng cơ và âm học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'wave',
    status: 'implemented',
    parameters: [
      { key: 'A', label: 'Biên độ sóng A', unit: 'cm', min: 1, max: 6, step: 0.5, defaultValue: 3.5 },
      { key: 'f', label: 'Tần số f', unit: 'Hz', min: 0.5, max: 3, step: 0.25, defaultValue: 1.5 },
      { key: 'v', label: 'Tốc độ truyền sóng v', unit: 'm/s', min: 1, max: 8, step: 0.5, defaultValue: 4 },
    ],
    formulasLatex: ['u(x,t) = A \\cos\\left(2\\pi f t - \\frac{2\\pi x}{\\lambda}\\right)', '\\lambda = \\frac{v}{f}'],
    explanationVi:
      'Trong sóng ngang, các phần tử môi trường dao động theo phương vuông góc với phương truyền sóng. Bước sóng λ = v/f là khoảng cách giữa hai đỉnh sóng liên tiếp.',
    assumptionsAndLimits: ['Sóng hình sin truyền trong môi trường đàn hồi đồng nhất, không suy giảm biên độ.'],
    stepAndRender: (ctx, w, h, t, params) => {
      const A = params.A ?? 3.5;
      const f = params.f ?? 1.5;
      const v = params.v ?? 4;
      const lambda = v / f;
      const ox = 40;
      const cy = h * 0.5;
      drawStageBackground(ctx, w, h, ox, cy);

      const pxPerM = 75;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = ox; px <= w - 20; px += 4) {
        const xm = (px - ox) / pxPerM;
        const u = A * Math.cos(2 * Math.PI * (f * t - xm / lambda));
        const py = cy - u * 16;
        if (px === ox) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Highlight individual oscillating particle at x = 2 m
      const xmDot = 2;
      const uDot = A * Math.cos(2 * Math.PI * (f * t - xmDot / lambda));
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(ox + xmDot * pxPerM, cy - uDot * 16, 6, 0, Math.PI * 2);
      ctx.fill();

      if(Math.abs(uDot)>0.02)drawArrow(ctx,ox+xmDot*pxPerM,cy-uDot*16,ox+xmDot*pxPerM,cy-uDot*16+Math.max(-50,Math.min(50,uDot*f*f*3)),"#fbbf24","F");
      return {
        readings: [
          { label: 'Bước sóng λ', value: lambda.toFixed(2), unit: 'm' },
          { label: 'Chu kỳ T', value: (1 / f).toFixed(2), unit: 's' },
          { label: 'Li độ tại x=2m', value: uDot.toFixed(2), unit: 'cm' },
        ],
      };
    },
  },
  {
    id: 'phys-27',
    orderNumber: 27,
    name: 'Sóng dọc và sự lan truyền âm',
    groupId: 'F',
    groupName: 'Sóng cơ và âm học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'wave',
    status: 'implemented',
    parameters: [
      { key: 'A', label: 'Biên độ dịch chuyển', unit: 'đv', min: 4, max: 18, step: 1, defaultValue: 12 },
      { key: 'f', label: 'Tần số âm f', unit: 'Hz', min: 0.5, max: 3, step: 0.25, defaultValue: 1.2 },
      { key: 'v', label: 'Tốc độ truyền âm (tỉ lệ)', unit: 'm/s', min: 2, max: 8, step: 0.5, defaultValue: 4 },
    ],
    formulasLatex: ['u(x,t) = A\\cos\\left(2\\pi f t - \\frac{2\\pi x}{\\lambda}\\right)', '\\lambda = \\frac{v}{f}'],
    explanationVi:
      'Trong sóng dọc (như sóng âm truyền trong không khí), các phần tử dao động dọc theo đúng phương truyền sóng, tạo ra các vùng nén và vùng dãn xen kẽ lan truyền đi.',
    assumptionsAndLimits: ['Tốc độ hiển thị được làm chậm để mắt thường quan sát rõ vùng nén/dãn.'],
    stepAndRender: (ctx, w, h, t, params) => {
      const A = params.A ?? 12;
      const f = params.f ?? 1.2;
      const v = params.v ?? 4;
      const lambda = v / f;
      const cy = h * 0.5;
      drawStageBackground(ctx, w, h, 40, cy, false);

      const cols = 38;
      const rows = 5;
      for (let i = 0; i < cols; i++) {
        const xEq = 50 + i * 18;
        const xm = i * 0.25;
        const disp = A * Math.cos(2 * Math.PI * (f * t - xm / lambda));
        for (let r = 0; r < rows; r++) {
          const py = cy + (r - 2) * 28;
          ctx.fillStyle = disp > 0 ? '#38bdf8' : '#0ea5e9';
          ctx.beginPath();
          ctx.arc(xEq + disp, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return {
        readings: [
          { label: 'Bước sóng λ', value: lambda.toFixed(2), unit: 'm' },
          { label: 'Tần số f', value: f.toFixed(2), unit: 'Hz' },
          { label: 'Biên độ dịch chuyển A', value: A.toFixed(1), unit: 'px' },
        ],
      };
    },
  },
  {
    id: 'phys-28',
    orderNumber: 28,
    name: 'Hiện tượng phản xạ sóng',
    groupId: 'F',
    groupName: 'Sóng cơ và âm học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'wave',
    status: 'implemented',
    parameters: [
      { key: 'fixedEnd', label: 'Đầu phản xạ (1: Cố định, 0: Tự do)', unit: '', min: 0, max: 1, step: 1, defaultValue: 1 },
      { key: 'speed', label: 'Tốc độ xung sóng', unit: 'm/s', min: 1, max: 6, step: 0.5, defaultValue: 3 },
    ],
    formulasLatex: [
      '\\text{Đầu cố định: } \\Delta\\varphi_{\\text{phản xạ}} = \\pi \\text{ (ngược pha)}',
      '\\text{Đầu tự do: } \\Delta\\varphi_{\\text{phản xạ}} = 0 \\text{ (cùng pha)}',
    ],
    explanationVi:
      'Khi gặp vật cản cố định, sóng phản xạ luôn ngược pha với sóng tới tại điểm phản xạ (lật ngược đỉnh xung). Khi gặp đầu tự do, sóng phản xạ cùng pha với sóng tới.',
    assumptionsAndLimits: ['Xung sóng Gauss đơn lẻ truyền trên dây lý tưởng không tiêu hao năng lượng.'],
    stepAndRender: (ctx, w, h, t, params) => {
      const fixed = (params.fixedEnd ?? 1) >= 0.5;
      const speed = params.speed ?? 3;
      const ox = 40;
      const wallX = w - 60;
      const cy = h * 0.55;
      drawStageBackground(ctx, w, h, ox, cy);

      const L = wallX - ox;
      const travel = (t * speed * 75) % (2 * L);
      const sign = fixed ? -1 : 1;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = ox; px <= wallX; px += 3) {
        const dIn = px - (ox + travel);
        const dRef = px - (wallX - (travel - L));
        const yIn = travel <= L ? 60 * Math.exp(-(dIn * dIn) / 600) : 0;
        const yRef = travel > L ? sign * 60 * Math.exp(-(dRef * dRef) / 600) : 0;
        const py = cy - (yIn + yRef);
        if (px === ox) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = fixed ? '#f43f5e' : '#10b981';
      ctx.beginPath();
      ctx.arc(wallX, fixed ? cy : cy - (travel > L - 25 && travel < L + 25 ? 50 : 0), 7, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, fixed ? 'Đầu cố định (Ngược pha)' : 'Đầu tự do (Cùng pha)', wallX - 180, 40, '#e2e8f0');

      return {
        readings: [
          { label: 'Chế độ đầu dây', value: fixed ? 'Cố định' : 'Tự do', unit: '' },
          { label: 'Pha sóng phản xạ', value: fixed ? 'Ngược pha (π)' : 'Cùng pha (0)', unit: '' },
        ],
      };
    },
  },
  {
    id: 'phys-29',
    orderNumber: 29,
    name: 'Sóng dừng trên dây',
    groupId: 'F',
    groupName: 'Sóng cơ và âm học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'wave',
    status: 'implemented',
    parameters: [
      { key: 'n', label: 'Số bó sóng n', unit: 'bó', min: 1, max: 6, step: 1, defaultValue: 3 },
      { key: 'A', label: 'Biên độ bụng sóng', unit: 'cm', min: 1, max: 5, step: 0.5, defaultValue: 3 },
      { key: 'f', label: 'Tần số dao động f', unit: 'Hz', min: 0.5, max: 3, step: 0.25, defaultValue: 1.5 },
    ],
    formulasLatex: ['L = k \\frac{\\lambda}{2}', 'u(x,t) = 2A\\sin\\left(\\frac{2\\pi x}{\\lambda}\\right)\\cos(2\\pi f t)'],
    explanationVi:
      'Sóng dừng hình thành từ sự giao thoa của sóng tới và sóng phản xạ trên dây hai đầu cố định, tạo nên các nút sóng đứng yên và các bụng sóng dao động với biên độ cực đại.',
    assumptionsAndLimits: ['Dây hai đầu cố định, thỏa điều kiện cộng hưởng L = n·(λ/2).'],
    stepAndRender: (ctx, w, h, t, params) => {
      const n = Math.round(params.n ?? 3);
      const A = params.A ?? 3;
      const f = params.f ?? 1.5;
      const ox = 50;
      const endX = w - 50;
      const Lpx = endX - ox;
      const cy = h * 0.52;
      drawStageBackground(ctx, w, h, ox, cy);

      // Envelope
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([4, 4]);
      for (const s of [1, -1]) {
        ctx.beginPath();
        for (let px = ox; px <= endX; px += 4) {
          const frac = (px - ox) / Lpx;
          const py = cy - s * A * 20 * Math.sin(n * Math.PI * frac);
          if (px === ox) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Instantaneous wave
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const osc = Math.cos(2 * Math.PI * f * t);
      for (let px = ox; px <= endX; px += 3) {
        const frac = (px - ox) / Lpx;
        const py = cy - A * 20 * Math.sin(n * Math.PI * frac) * osc;
        if (px === ox) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      return {
        readings: [
          { label: 'Số bó sóng (bụng)', value: `${n}`, unit: 'bụng' },
          { label: 'Số nút sóng', value: `${n + 1}`, unit: 'nút' },
        ],
      };
    },
  },
  {
    id: 'phys-30',
    orderNumber: 30,
    name: 'Giao thoa sóng từ hai nguồn kết hợp',
    groupId: 'F',
    groupName: 'Sóng cơ và âm học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'wave',
    status: 'implemented',
    parameters: [
      { key: 'd', label: 'Khoảng cách 2 nguồn S₁S₂', unit: 'm', min: 2, max: 6, step: 0.5, defaultValue: 3.5 },
      {key:'v', label:'Tốc độ truyền sóng',unit:'m/s',min:0.5,max:3,step:0.1,defaultValue:1.2},
      { key: 'f', label: 'Tần số sóng f', unit: 'Hz', min: 0.5, max: 2.5, step: 0.25, defaultValue: 1.2 },
    ],
    formulasLatex: ['d_2 - d_1 = k\\lambda \\text{ (cực đại)}', 'd_2 - d_1 = (k + 0.5)\\lambda \\text{ (cực tiểu)}'],
    explanationVi:
      'Hai nguồn kết hợp cùng pha tạo ra các vân cực đại (biên độ tăng cường) và cực tiểu (triệt tiêu) xen kẽ nhau thành các đường hypebol ổn định trên mặt thoáng.',
    assumptionsAndLimits: ['Hai nguồn đồng bộ, cùng pha, cùng biên độ trên mặt chất lỏng đồng nhất.'],
    stepAndRender: (ctx, w, h, t, params) => {
      const separation = params.d ?? 3.5;
      const f = params.f ?? 1.2;
      const speed=params.v??1.2;
      const lambdaPx = 46*speed/f;
      const dPx = separation*46;
      const dLambda=separation*f/speed;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const s1x = cx - dPx / 2;
      const s2x = cx + dPx / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, w, h);

      const cell = 8;
      const phaseShift = 2 * Math.PI * f * t;
      for (let px = 40; px < w - 40; px += cell) {
        for (let py = 20; py < h - 20; py += cell) {
          const r1 = Math.hypot(px - s1x, py - cy);
          const r2 = Math.hypot(px - s2x, py - cy);
          const u =
            Math.cos((2 * Math.PI * r1) / lambdaPx - phaseShift) +
            Math.cos((2 * Math.PI * r2) / lambdaPx - phaseShift);
          const intensity = Math.max(0, Math.min(255, Math.round(128 + u * 62)));
          ctx.fillStyle = `rgb(${Math.round(intensity * 0.15)}, ${Math.round(intensity * 0.65)}, ${intensity})`;
          ctx.fillRect(px, py, cell, cell);
        }
      }

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(s1x, cy, 6, 0, Math.PI * 2);
      ctx.arc(s2x, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      const kMax = Math.floor(dLambda - 0.01);
      return {
        readings: [
          { label: 'Khoảng cách S₁S₂', value: dLambda.toFixed(1), unit: 'λ' },
          { label: 'Số cực đại trên S₁S₂', value: `${2 * kMax + 1}`, unit: 'điểm' },
        ],
      };
    },
  },
];
