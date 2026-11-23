import type { PhysicsSimulationSpec } from '../types/physics';
import { drawArrow, drawLabel, drawSpring, drawStageBackground } from './canvasHelpers';

export const GROUP_C_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-11',
    orderNumber: 11,
    name: 'Chuyển hóa giữa động năng và thế năng',
    groupId: 'C',
    groupName: 'Năng lượng và động lượng',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'energy',
    status: 'implemented',
    parameters: [
      { key: 'm', label: 'Khối lượng m', unit: 'kg', min: 1, max: 10, step: 0.5, defaultValue: 2 },
      { key: 'h0', label: 'Độ cao ban đầu h₀', unit: 'm', min: 5, max: 40, step: 1, defaultValue: 25 },
    ],
    formulasLatex: ['W_đ = \\frac{1}{2} m v^2', 'W_t = m g h', 'W = W_đ + W_t = \\text{const}'],
    explanationVi:
      'Trong trường trọng lực không có ma sát, khi vật đi xuống thế năng giảm dần và chuyển hóa hoàn toàn thành động năng, giữ cho tổng cơ năng bảo toàn.',
    assumptionsAndLimits: [
      'Bỏ qua lực cản không khí; mô phỏng nảy đàn hồi lý tưởng tại mặt đất để quan sát chu trình hai chiều.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const m = params.m ?? 2;
      const h0 = params.h0 ?? 25;
      const g = 9.8;
      const tHalf = Math.sqrt((2 * h0) / g);
      const tMod = t % (2 * tHalf);
      const fallT = tMod <= tHalf ? tMod : 2 * tHalf - tMod;
      const y = Math.max(0, h0 - 0.5 * g * fallT * fallT);
      const v = g * fallT;
      const Wt = m * g * y;
      const Wd = 0.5 * m * v * v;
      const W = m * g * h0;

      const groundY = h - 32;
      drawStageBackground(ctx, w, h, w * 0.35, groundY);
      const scale = (h - 72) / 45;
      const ballY = groundY - y * scale;
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(w * 0.35, ballY - 12, 12, 0, Math.PI * 2);
      ctx.fill();

      const barH = 190;
      const bx = w * 0.62;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(bx, groundY - (Wd / W) * barH, 36, (Wd / W) * barH);
      drawLabel(ctx, 'W_đ', bx + 18, groundY + 16, '#10b981', 'center');
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx + 54, groundY - (Wt / W) * barH, 36, (Wt / W) * barH);
      drawLabel(ctx, 'W_t', bx + 72, groundY + 16, '#f59e0b', 'center');
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(bx + 108, groundY - barH, 36, barH);
      drawLabel(ctx, 'W', bx + 126, groundY + 16, '#a855f7', 'center');

      history.push({ x: Number(t.toFixed(2)), y: Number(Wd.toFixed(1)) });
      return {
        readings: [
          { label: 'Động năng W_đ', value: Wd.toFixed(1), unit: 'J' },
          { label: 'Thế năng W_t', value: Wt.toFixed(1), unit: 'J' },
          { label: 'Cơ năng W', value: W.toFixed(1), unit: 'J' },
        ],
        graphSeries: { title: 'Động năng W_đ(t)', xLabel: 't (s)', yLabel: 'W_đ (J)', points: history.slice(-150) },
      };
    },
  },
  {
    id: 'phys-12',
    orderNumber: 12,
    name: 'Thế năng đàn hồi và năng lượng của lò xo',
    groupId: 'C',
    groupName: 'Năng lượng và động lượng',
    suggestedGrades: [10, 12],
    isTimeDependent: true,
    previewType: 'energy',
    status: 'implemented',
    parameters: [
      { key: 'k', label: 'Độ cứng lò xo k', unit: 'N/m', min: 10, max: 120, step: 5, defaultValue: 40 },
      { key: 'm', label: 'Khối lượng m', unit: 'kg', min: 0.5, max: 5, step: 0.25, defaultValue: 1 },
      { key: 'A', label: 'Biên độ kéo A', unit: 'm', min: 0.1, max: 0.8, step: 0.05, defaultValue: 0.4 },
    ],
    formulasLatex: ['W_{t,\\text{đh}} = \\frac{1}{2} k x^2', 'W = \\frac{1}{2} k A^2'],
    explanationVi:
      'Thế năng đàn hồi tỉ lệ với bình phương độ biến dạng x của lò xo, đạt cực đại ở hai biên và bằng 0 tại vị trí cân bằng, nơi động năng đạt cực đại.',
    assumptionsAndLimits: [
      'Lò xo nhẹ, biến dạng trong giới hạn đàn hồi (định luật Hooke).',
      'Bỏ qua ma sát với mặt đỡ.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const k = params.k ?? 40;
      const m = params.m ?? 1;
      const A = params.A ?? 0.4;
      const omega = Math.sqrt(k / m);
      const x = A * Math.cos(omega * t);
      const v = -A * omega * Math.sin(omega * t);
      const Wt = 0.5 * k * x * x;
      const Wd = 0.5 * m * v * v;
      const W = 0.5 * k * A * A;

      const cx = w * 0.52;
      const cy = h * 0.58;
      drawStageBackground(ctx, w, h, cx, cy);
      ctx.fillStyle = '#475569';
      ctx.fillRect(36, cy - 50, 12, 100);
      const bx = cx + x * 210;
      drawSpring(ctx, 48, cy, bx - 20, cy, 12, 11, '#94a3b8');
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(bx - 20, cy - 22, 40, 44);
      drawLabel(ctx, `x=${x.toFixed(2)}m`, bx, cy - 30, '#e2e8f0', 'center');

      history.push({ x: Number(t.toFixed(2)), y: Number(Wt.toFixed(2)) });
      return {
        readings: [
          { label: 'Độ biến dạng x', value: x.toFixed(3), unit: 'm' },
          { label: 'Thế năng đàn hồi', value: Wt.toFixed(2), unit: 'J' },
          { label: 'Động năng', value: Wd.toFixed(2), unit: 'J' },
          { label: 'Cơ năng tổng', value: W.toFixed(2), unit: 'J' },
        ],
        graphSeries: { title: 'Thế năng đàn hồi W_t(t)', xLabel: 't (s)', yLabel: 'W_t (J)', points: history.slice(-150) },
      };
    },
  },
  {
    id: 'phys-13',
    orderNumber: 13,
    name: 'Va chạm đàn hồi một chiều',
    groupId: 'C',
    groupName: 'Năng lượng và động lượng',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'energy',
    status: 'implemented',
    parameters: [
      { key: 'm1', label: 'Khối lượng m₁', unit: 'kg', min: 1, max: 10, step: 0.5, defaultValue: 4 },
      { key: 'v1', label: 'Vận tốc đầu v₁', unit: 'm/s', min: 1, max: 10, step: 0.5, defaultValue: 6 },
      { key: 'm2', label: 'Khối lượng m₂', unit: 'kg', min: 1, max: 10, step: 0.5, defaultValue: 2 },
      { key: 'v2', label: 'Vận tốc đầu v₂', unit: 'm/s', min: -8, max: 4, step: 0.5, defaultValue: -2 },
    ],
    formulasLatex: ["v_1' = \\frac{(m_1 - m_2)v_1 + 2m_2 v_2}{m_1 + m_2}", "v_2' = \\frac{(m_2 - m_1)v_2 + 2m_1 v_1}{m_1 + m_2}"],
    explanationVi:
      'Trong va chạm đàn hồi xuyên tâm một chiều, cả tổng động lượng và tổng động năng của hệ hai vật đều được bảo toàn.',
    assumptionsAndLimits: [
      'Hệ cô lập theo phương ngang, bỏ qua ma sát và biến dạng vĩnh viễn.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const m1 = params.m1 ?? 4;
      const v1 = params.v1 ?? 6;
      const m2 = params.m2 ?? 2;
      const v2 = params.v2 ?? -2;
      const x10 = -6;
      const x20 = 4;
      const tColl = v1 > v2 ? (x20 - x10) / (v1 - v2) : 999;
      const v1p = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
      const v2p = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
      const collided = t >= tColl;
      const x1 = collided ? x10 + v1 * tColl + v1p * (t - tColl) : x10 + v1 * t;
      const x2 = collided ? x20 + v2 * tColl + v2p * (t - tColl) : x20 + v2 * t;

      const ox = w * 0.5;
      const oy = h * 0.65;
      drawStageBackground(ctx, w, h, ox, oy);
      const r1 = 12 + m1 * 1.4;
      const r2 = 12 + m2 * 1.4;
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(ox + x1 * 20, oy - r1, r1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(ox + x2 * 20, oy - r2, r2, 0, Math.PI * 2);
      ctx.fill();

      const pTot = m1 * v1 + m2 * v2;
      history.push({ x: Number(t.toFixed(2)), y: Number(pTot.toFixed(2)) });
      return {
        readings: [
          { label: "v₁' sau va chạm", value: v1p.toFixed(2), unit: 'm/s' },
          { label: "v₂' sau va chạm", value: v2p.toFixed(2), unit: 'm/s' },
          { label: 'Tổng động lượng', value: pTot.toFixed(2), unit: 'kg·m/s' },
        ],
        graphSeries: { title: 'Tổng động lượng hệ p(t)', xLabel: 't (s)', yLabel: 'p (kg·m/s)', points: history.slice(-150) },
      };
    },
  },
  {
    id: 'phys-14',
    orderNumber: 14,
    name: 'Va chạm mềm một chiều',
    groupId: 'C',
    groupName: 'Năng lượng và động lượng',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'energy',
    status: 'implemented',
    parameters: [
      { key: 'm1', label: 'Khối lượng m₁', unit: 'kg', min: 1, max: 10, step: 0.5, defaultValue: 3 },
      { key: 'v1', label: 'Vận tốc đầu v₁', unit: 'm/s', min: 1, max: 10, step: 0.5, defaultValue: 6 },
      { key: 'm2', label: 'Khối lượng m₂ (đứng yên)', unit: 'kg', min: 1, max: 10, step: 0.5, defaultValue: 5 },
    ],
    formulasLatex: ["v' = \\frac{m_1 v_1}{m_1 + m_2}", '\\Delta W_đ = W_{đ0} - W_đ\' > 0'],
    explanationVi:
      'Sau va chạm mềm, hai vật dính vào nhau và chuyển động với cùng vận tốc v\'. Động lượng bảo toàn nhưng một phần động năng bị tiêu hao chuyển thành nhiệt và công biến dạng.',
    assumptionsAndLimits: [
      'Vật m₂ đứng yên trước va chạm, bỏ qua ma sát mặt sàn.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const m1 = params.m1 ?? 3;
      const v1 = params.v1 ?? 6;
      const m2 = params.m2 ?? 5;
      const x10 = -6;
      const x20 = 2;
      const tColl = (x20 - x10) / v1;
      const vp = (m1 * v1) / (m1 + m2);
      const loss = 0.5 * m1 * v1 * v1 - 0.5 * (m1 + m2) * vp * vp;
      const collided = t >= tColl;
      const x1 = collided ? x20 + vp * (t - tColl) - 0.8 : x10 + v1 * t;
      const x2 = collided ? x20 + vp * (t - tColl) + 0.8 : x20;

      const ox = w * 0.5;
      const oy = h * 0.65;
      drawStageBackground(ctx, w, h, ox, oy);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(ox + x1 * 22 - 16, oy - 32, 32, 32);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ox + x2 * 22 - 16, oy - 32, 32, 32);

      history.push({ x: Number(t.toFixed(2)), y: Number((collided ? vp : v1).toFixed(2)) });
      return {
        readings: [
          { label: "Vận tốc chung v'", value: vp.toFixed(2), unit: 'm/s' },
          { label: 'Động năng mất đi', value: loss.toFixed(2), unit: 'J' },
        ],
        graphSeries: { title: 'Vận tốc vật 1 v₁(t)', xLabel: 't (s)', yLabel: 'v (m/s)', points: history.slice(-150) },
      };
    },
  },
  {
    id: 'phys-15',
    orderNumber: 15,
    name: 'Chuyển động giật lùi do bảo toàn động lượng',
    groupId: 'C',
    groupName: 'Năng lượng và động lượng',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'energy',
    status: 'implemented',
    parameters: [
      { key: 'M', label: 'Khối lượng xe/pháo M', unit: 'kg', min: 5, max: 30, step: 1, defaultValue: 15 },
      { key: 'm', label: 'Khối lượng vật phóng m', unit: 'kg', min: 0.2, max: 4, step: 0.1, defaultValue: 1 },
      { key: 'v', label: 'Vận tốc vật phóng v', unit: 'm/s', min: 5, max: 30, step: 1, defaultValue: 18 },
    ],
    formulasLatex: ['M\\vec{V} + m\\vec{v} = \\vec{0} \\implies V = -\\frac{m}{M} v'],
    explanationVi:
      'Từ trạng thái nghỉ (tổng động lượng bằng 0), khi vật nhỏ phóng về phía trước với vận tốc v thì vật lớn phải giật lùi theo chiều ngược lại với vận tốc V sao cho M·V + m·v = 0.',
    assumptionsAndLimits: [
      'Hệ kín theo phương ngang, không ma sát.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const M = params.M ?? 15;
      const m = params.m ?? 1;
      const v = params.v ?? 18;
      const V = -(m / M) * v;
      const ox = w * 0.5;
      const oy = h * 0.65;
      drawStageBackground(ctx, w, h, ox, oy);
      const xGun = Math.max(30, ox + V * t * 18);
      const xBul = Math.min(w - 20, ox + v * t * 9);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(xGun - 32, oy - 32, 56, 32);
      drawArrow(ctx, xGun - 32, oy - 16, xGun - 32 + V * 12, oy - 16, '#38bdf8', `V=${V.toFixed(2)}`);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(xBul, oy - 18, 7, 0, Math.PI * 2);
      ctx.fill();

      history.push({ x: Number(t.toFixed(2)), y: Number(V.toFixed(2)) });
      return {
        readings: [
          { label: 'Vận tốc giật lùi V', value: V.toFixed(2), unit: 'm/s' },
          { label: 'Động lượng tổng', value: (M * V + m * v).toFixed(3), unit: 'kg·m/s' },
        ],
        graphSeries: { title: 'Vận tốc giật lùi V(t)', xLabel: 't (s)', yLabel: 'V (m/s)', points: history.slice(-150) },
      };
    },
  },
];
