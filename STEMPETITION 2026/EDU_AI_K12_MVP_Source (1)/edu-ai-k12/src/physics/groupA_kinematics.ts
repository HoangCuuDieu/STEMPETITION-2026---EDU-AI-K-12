import type { PhysicsSimulationSpec } from '../types/physics';
import { drawArrow, drawLabel, drawStageBackground } from './canvasHelpers';

export const GROUP_A_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-01',
    orderNumber: 1,
    name: 'Chuyển động thẳng đều',
    groupId: 'A',
    groupName: 'Động học',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'motion',
    status: 'implemented',
    parameters: [
      { key: 'x0', label: 'Tọa độ ban đầu x₀', unit: 'm', min: -20, max: 20, step: 1, defaultValue: 0 },
      { key: 'v', label: 'Vận tốc v', unit: 'm/s', min: -12, max: 15, step: 0.5, defaultValue: 5 },
    ],
    formulasLatex: ['x = x_0 + v \\cdot t', 's = |v| \\cdot t'],
    explanationVi:
      'Chất điểm chuyển động trên một đường thẳng với vectơ vận tốc không đổi theo thời gian. Tọa độ x là hàm bậc nhất của thời gian t.',
    assumptionsAndLimits: [
      'Coi vật là chất điểm, bỏ qua kích thước và hình dạng.',
      'Chuyển động 1 chiều dọc theo trục tọa độ Ox.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const x0 = params.x0 ?? 0;
      const v = params.v ?? 5;
      const x = x0 + v * t;
      const s = Math.abs(v) * t;
      const ox = w * 0.25;
      const oy = h * 0.65;
      drawStageBackground(ctx, w, h, ox, oy);
      drawLabel(ctx, 'O', ox - 14, oy + 16, '#94a3b8');
      drawLabel(ctx, 'x (m)', w - 45, oy + 16, '#94a3b8');

      // Ticks every 10 m (1 m = 8 px)
      const scale = 8;
      for (let m = -20; m <= 60; m += 10) {
        const tx = ox + m * scale;
        if (tx > 20 && tx < w - 20) {
          ctx.strokeStyle = '#475569';
          ctx.beginPath();
          ctx.moveTo(tx, oy - 4);
          ctx.lineTo(tx, oy + 4);
          ctx.stroke();
          drawLabel(ctx, `${m}`, tx, oy + 18, '#64748b', 'center');
        }
      }

      const px = Math.max(24, Math.min(w - 24, ox + x * scale));
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(px, oy - 16, 13, 0, Math.PI * 2);
      ctx.fill();
      drawArrow(ctx, px, oy - 16, px + v * 5, oy - 16, '#f59e0b', `v=${v.toFixed(1)} m/s`);

      history.push({ x: Number(t.toFixed(2)), y: Number(x.toFixed(2)) });
      return {
        readings: [
          { label: 'Thời gian t', value: t.toFixed(2), unit: 's' },
          { label: 'Tọa độ x', value: x.toFixed(2), unit: 'm' },
          { label: 'Quãng đường s', value: s.toFixed(2), unit: 'm' },
        ],
        graphSeries: { title: 'Đồ thị tọa độ x(t)', xLabel: 't (s)', yLabel: 'x (m)', points: history },
      };
    },
  },
  {
    id: 'phys-02',
    orderNumber: 2,
    name: 'Chuyển động thẳng biến đổi đều',
    groupId: 'A',
    groupName: 'Động học',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'motion',
    status: 'implemented',
    parameters: [
      { key: 'v0', label: 'Vận tốc đầu v₀', unit: 'm/s', min: -10, max: 15, step: 0.5, defaultValue: 2 },
      { key: 'a', label: 'Gia tốc a', unit: 'm/s²', min: -5, max: 8, step: 0.2, defaultValue: 2 },
    ],
    formulasLatex: ['v = v_0 + a t', 'x = v_0 t + \\frac{1}{2} a t^2', 'v^2 - v_0^2 = 2 a s'],
    explanationVi:
      'Chuyển động thẳng có gia tốc không đổi theo thời gian. Khi a và v cùng dấu, vật chuyển động nhanh dần đều; khi a và v trái dấu, vật chuyển động chậm dần đều.',
    assumptionsAndLimits: [
      'Gia tốc a giữ nguyên giá trị và hướng trong suốt quá trình khảo sát.',
      'Bỏ qua lực cản môi trường thay đổi theo vận tốc.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const v0 = params.v0 ?? 2;
      const a = params.a ?? 2;
      const v = v0 + a * t;
      const x = v0 * t + 0.5 * a * t * t;
      const ox = w * 0.22;
      const oy = h * 0.65;
      drawStageBackground(ctx, w, h, ox, oy);
      const px = Math.max(24, Math.min(w - 24, ox + x * 4.5));
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - 16, oy - 26, 32, 26);
      drawArrow(ctx, px, oy - 13, px + Math.max(-90, Math.min(90, v * 4)), oy - 13, '#38bdf8', 'v');
      drawArrow(ctx, px, oy - 36, px + a * 12, oy - 36, '#f43f5e', 'a');

      history.push({ x: Number(t.toFixed(2)), y: Number(v.toFixed(2)) });
      return {
        readings: [
          { label: 'Thời gian t', value: t.toFixed(2), unit: 's' },
          { label: 'Vận tốc v', value: v.toFixed(2), unit: 'm/s' },
          { label: 'Độ dịch chuyển Δx', value: x.toFixed(2), unit: 'm' },
        ],
        graphSeries: { title: 'Đồ thị vận tốc v(t)', xLabel: 't (s)', yLabel: 'v (m/s)', points: history },
      };
    },
  },
  {
    id: 'phys-03',
    orderNumber: 3,
    name: 'Chuyển động rơi tự do',
    groupId: 'A',
    groupName: 'Động học',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'motion',
    status: 'implemented',
    parameters: [
      { key: 'h0', label: 'Độ cao thả h₀', unit: 'm', min: 5, max: 100, step: 1, defaultValue: 50 },
      { key: 'g', label: 'Gia tốc trọng trường g', unit: 'm/s²', min: 1.6, max: 15, step: 0.1, defaultValue: 9.8 },
    ],
    formulasLatex: ['h(t) = h_0 - \\frac{1}{2} g t^2', 'v = g t', 't_{\\text{chạm đất}} = \\sqrt{\\frac{2 h_0}{g}}'],
    explanationVi:
      'Rơi tự do là chuyển động thẳng nhanh dần đều theo phương thẳng đứng từ trạng thái nghỉ (v₀ = 0) chỉ dưới tác dụng của trọng lực.',
    assumptionsAndLimits: [
      'Bỏ qua hoàn toàn lực cản của không khí.',
      'Gia tốc trọng trường g không đổi theo độ cao.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const h0 = params.h0 ?? 50;
      const g = params.g ?? 9.8;
      const tHit = Math.sqrt((2 * h0) / g);
      const tEff = Math.min(t, tHit);
      const y = Math.max(0, h0 - 0.5 * g * tEff * tEff);
      const v = g * tEff;

      const groundY = h - 32;
      drawStageBackground(ctx, w, h, w * 0.5, groundY);
      const scale = (h - 68) / 100;
      const ballY = groundY - y * scale;

      ctx.strokeStyle = '#334155';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - 60, groundY - h0 * scale);
      ctx.lineTo(w * 0.5 + 60, groundY - h0 * scale);
      ctx.stroke();
      ctx.setLineDash([]);
      drawLabel(ctx, `h₀ = ${h0} m`, w * 0.5 + 68, groundY - h0 * scale + 4, '#94a3b8');

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(w * 0.5, ballY - 10, 11, 0, Math.PI * 2);
      ctx.fill();
      if (y>0) drawArrow(ctx,w*.5,ballY,w*.5,ballY+2*g,"#fb7185","P");
      if (y > 0) drawArrow(ctx, w * 0.5, ballY - 10, w * 0.5, ballY - 10 + Math.min(60, v * 1.5), '#f59e0b', 'v');

      history.push({ x: Number(tEff.toFixed(2)), y: Number(y.toFixed(2)) });
      return {
        readings: [
          { label: 'Thời gian t', value: tEff.toFixed(2), unit: 's' },
          { label: 'Độ cao h', value: y.toFixed(2), unit: 'm' },
          { label: 'Vận tốc v', value: v.toFixed(2), unit: 'm/s' },
          { label: 'Thời gian chạm đất', value: tHit.toFixed(2), unit: 's' },
        ],
        graphSeries: { title: 'Đồ thị độ cao h(t)', xLabel: 't (s)', yLabel: 'h (m)', points: history },
      };
    },
  },
  {
    id: 'phys-04',
    orderNumber: 4,
    name: 'Chuyển động ném ngang',
    groupId: 'A',
    groupName: 'Động học',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'projectile',
    status: 'implemented',
    parameters: [
      { key: 'h0', label: 'Độ cao ném h₀', unit: 'm', min: 5, max: 80, step: 1, defaultValue: 30 },
      { key: 'v0', label: 'Vận tốc đầu v₀', unit: 'm/s', min: 2, max: 35, step: 1, defaultValue: 15 },
      { key: 'g', label: 'Gia tốc g', unit: 'm/s²', min: 1.6, max: 15, step: 0.1, defaultValue: 9.8 },
    ],
    formulasLatex: ['x = v_0 t', 'y = h_0 - \\frac{1}{2} g t^2', 'L = v_0 \\sqrt{\\frac{2 h_0}{g}}'],
    explanationVi:
      'Vật chuyển động đồng thời theo hai thành phần độc lập: thẳng đều theo phương ngang (Ox) và rơi tự do theo phương thẳng đứng (Oy), tạo quỹ đạo nửa parabol.',
    assumptionsAndLimits: [
      'Bỏ qua lực cản không khí và sự thay đổi của g.',
      'Mặt đất phẳng nằm ngang.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const h0 = params.h0 ?? 30;
      const v0 = params.v0 ?? 15;
      const g = params.g ?? 9.8;
      const tHit = Math.sqrt((2 * h0) / g);
      const tEff = Math.min(t, tHit);
      const x = v0 * tEff;
      const y = Math.max(0, h0 - 0.5 * g * tEff * tEff);
      const vy = g * tEff;
      const vMag = Math.hypot(v0, vy);

      const scale = Math.min((w-100)/110,(h-70)/80);
      const ox = 48 - Math.max(0,x*scale-(w-100));
      const oy = h-32 + Math.max(0,y*scale-(h-70));
      drawStageBackground(ctx, w, h, ox, oy);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let ts = 0; ts <= tEff; ts += 0.03) {
        const px = ox + v0 * ts * scale;
        const py = oy - Math.max(0, h0 - 0.5 * g * ts * ts) * scale;
        if (ts === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const bx = ox + x * scale;
      const by = oy - y * scale;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();
      if(tEff<tHit) drawArrow(ctx,bx,by,bx,by+2*g,"#fb7185","P");
      if (y > 0) drawArrow(ctx, bx, by, bx + v0 * 1.5, by + vy * 1.5, '#facc15', 'v');

      history.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
      return {
        readings: [
          { label: 'Thời gian t', value: tEff.toFixed(2), unit: 's' },
          { label: 'Vị trí x', value: x.toFixed(2), unit: 'm' },
          { label: 'Độ cao y', value: y.toFixed(2), unit: 'm' },
          { label: 'Tốc độ |v|', value: vMag.toFixed(2), unit: 'm/s' },
          { label: 'Tầm bay xa L', value: (v0 * tHit).toFixed(2), unit: 'm' },
        ],
        graphSeries: { title: 'Quỹ đạo y(x)', xLabel: 'x (m)', yLabel: 'y (m)', points: history },
      };
    },
  },
  {
    id: 'phys-05',
    orderNumber: 5,
    name: 'Chuyển động ném xiên',
    groupId: 'A',
    groupName: 'Động học',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'projectile',
    status: 'implemented',
    parameters: [
      { key: 'v0', label: 'Vận tốc đầu v₀', unit: 'm/s', min: 5, max: 40, step: 1, defaultValue: 22 },
      { key: 'angle', label: 'Góc ném α', unit: '°', min: 5, max: 85, step: 1, defaultValue: 45 },
      { key: 'g', label: 'Gia tốc trọng trường g', unit: 'm/s²', min: 1.6, max: 15, step: 0.1, defaultValue: 9.8 },
    ],
    formulasLatex: [
      'x = v_0 \\cos\\alpha \\cdot t',
      'y = v_0 \\sin\\alpha \\cdot t - \\frac{1}{2} g t^2',
      'H_{\\max} = \\frac{v_0^2 \\sin^2\\alpha}{2g}, \\quad R = \\frac{v_0^2 \\sin(2\\alpha)}{g}',
    ],
    explanationVi:
      'Khi ném vật lên xiên góc α so với phương ngang, vật chuyển động đều theo phương ngang và biến đổi đều theo phương thẳng đứng, tạo quỹ đạo parabol. Tầm xa đạt cực đại ở α = 45° khi điểm ném và điểm rơi cùng độ cao.',
    assumptionsAndLimits: [
      'Bỏ qua lực cản không khí và lực đẩy Archimedes.',
      'Vị trí ném ban đầu ở độ cao y₀ = 0, g không đổi.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const v0 = params.v0 ?? 22;
      const rad = ((params.angle ?? 45) * Math.PI) / 180;
      const g = params.g ?? 9.8;
      const vx = v0 * Math.cos(rad);
      const vy0 = v0 * Math.sin(rad);
      const tFlight = (2 * vy0) / g;
      const tEff = Math.min(t, tFlight);
      const x = vx * tEff;
      const y = Math.max(0, vy0 * tEff - 0.5 * g * tEff * tEff);
      const vy = vy0 - g * tEff;
      const R = vx * tFlight;
      const Hmax = (vy0 * vy0) / (2 * g);

      const scale = Math.min((w-100)/110,(h-70)/80);
      const ox = 48 - Math.max(0,x*scale-(w-100));
      const oy = h-32 + Math.max(0,y*scale-(h-70));
      drawStageBackground(ctx, w, h, ox, oy);

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let ts = 0; ts <= tEff; ts += 0.03) {
        const px = ox + vx * ts * scale;
        const py = oy - Math.max(0, vy0 * ts - 0.5 * g * ts * ts) * scale;
        if (ts === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const bx = ox + x * scale;
      const by = oy - y * scale;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();
      if(tEff<tFlight) drawArrow(ctx,bx,by,bx,by+2*g,"#fb7185","P");
      if (tEff < tFlight) drawArrow(ctx, bx, by, bx + vx * 1.4, by - vy * 1.4, '#38bdf8', 'v');

      history.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
      return {
        readings: [
          { label: 'Thời gian t', value: tEff.toFixed(2), unit: 's' },
          { label: 'Vị trí (x, y)', value: `(${x.toFixed(1)}, ${y.toFixed(1)})`, unit: 'm' },
          { label: 'Tốc độ |v|', value: Math.hypot(vx, vy).toFixed(2), unit: 'm/s' },
          { label:'Vận tốc ngang',value:vx.toFixed(2),unit:'m/s' },
          {label:'Vận tốc đứng',value:vy.toFixed(2),unit:'m/s' },
          { label: 'Độ cao cực đại H', value: Hmax.toFixed(2), unit: 'm' },
          { label: 'Tầm bay xa R', value: R.toFixed(2), unit: 'm' },
        ],
        graphSeries: { title: 'Quỹ đạo y(x)', xLabel: 'x (m)', yLabel: 'y (m)', points: history },
      };
    },
  },
];
