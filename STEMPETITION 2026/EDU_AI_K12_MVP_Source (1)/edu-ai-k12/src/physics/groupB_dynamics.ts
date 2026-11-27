import type { PhysicsSimulationSpec } from '../types/physics';
import { drawArrow, drawLabel, drawStageBackground } from './canvasHelpers';

export const GROUP_B_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-06',
    orderNumber: 6,
    name: 'Định luật II Newton – Lực, khối lượng và gia tốc',
    groupId: 'B',
    groupName: 'Động lực học',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'force',
    status: 'implemented',
    parameters: [
      { key: 'F', label: 'Hợp lực kéo F', unit: 'N', min: 0, max: 60, step: 1, defaultValue: 24 },
      { key: 'm', label: 'Khối lượng m', unit: 'kg', min: 1, max: 20, step: 0.5, defaultValue: 4 },
    ],
    formulasLatex: ['\\vec{a} = \\frac{\\vec{F}}{m}', 'v = a t'],
    explanationVi:
      'Gia tốc của một vật cùng hướng với hợp lực tác dụng lên vật. Độ lớn của gia tốc tỉ lệ thuận với độ lớn hợp lực và tỉ lệ nghịch với khối lượng của vật.',
    assumptionsAndLimits: [
      'Mặt phẳng ngang hoàn toàn nhẵn, bỏ qua lực ma sát.',
      'Khối lượng vật không đổi trong quá trình chuyển động.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const F = params.F ?? 24;
      const m = params.m ?? 4;
      const a = F / m;
      const v = a * t;
      const x = 0.5 * a * t * t;
      const ox = 54;
      const oy = h * 0.68;
      drawStageBackground(ctx, w, h, ox, oy);
      const px = Math.min(w - 90, ox + x * 3.5);
      const size = 24 + m * 1.4;
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(px, oy - size, size, size);
      drawLabel(ctx, `${m} kg`, px + size / 2, oy - size / 2 + 4, '#ffffff', 'center');
      drawArrow(ctx, px + size, oy - size / 2, px + size + F * 2, oy - size / 2, '#f43f5e', `F=${F}N`);
      drawArrow(ctx, px + size / 2, oy - size - 16, px + size / 2 + a * 8, oy - size - 16, '#10b981', `a=${a.toFixed(1)}`);

      history.push({ x: Number(t.toFixed(2)), y: Number(v.toFixed(2)) });
      return {
        readings: [
          { label: 'Gia tốc a', value: a.toFixed(2), unit: 'm/s²' },
          { label: 'Vận tốc v', value: v.toFixed(2), unit: 'm/s' },
          { label: 'Độ dịch chuyển x', value: x.toFixed(2), unit: 'm' },
        ],
        graphSeries: { title: 'Đồ thị vận tốc v(t)', xLabel: 't (s)', yLabel: 'v (m/s)', points: history },
      };
    },
  },
  {
    id: 'phys-07',
    orderNumber: 7,
    name: 'Chuyển động của vật trên mặt phẳng nghiêng',
    groupId: 'B',
    groupName: 'Động lực học',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'force',
    status: 'implemented',
    parameters: [
      { key: 'alpha', label: 'Góc nghiêng α', unit: '°', min: 5, max: 60, step: 1, defaultValue: 30 },
      { key: 'mu', label: 'Hệ số ma sát μ', unit: '', min: 0, max: 0.7, step: 0.02, defaultValue: 0.15 },
      { key: 'm', label: 'Khối lượng m', unit: 'kg', min: 1, max: 15, step: 0.5, defaultValue: 4 },
    ],
    formulasLatex: ['a = g(\\sin\\alpha - \\mu\\cos\\alpha)', 'N = m g \\cos\\alpha', 'F_{ms} = \\mu N'],
    explanationVi:
      'Thành phần trọng lực dọc mặt phẳng nghiêng P·sinα kéo vật trượt xuống, bị cản trở bởi lực ma sát F_ms = μ·m·g·cosα. Vật chỉ tự trượt khi tanα > μ.',
    assumptionsAndLimits: [
      'Vật thả không vận tốc đầu từ đỉnh dốc.',
      'Chiều dài mặt phẳng nghiêng giới hạn trong khung quan sát.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const g = 9.8;
      const rad = ((params.alpha ?? 30) * Math.PI) / 180;
      const mu = params.mu ?? 0.15;
      const m = params.m ?? 4;
      const willSlide = Math.tan(rad) > mu;
      const a = willSlide ? g * (Math.sin(rad) - mu * Math.cos(rad)) : 0;
      const maxLenMeters = 14;
      const s = Math.min(maxLenMeters, 0.5 * a * t * t);
      const v = s < maxLenMeters ? a * t : Math.sqrt(2 * a * maxLenMeters);

      drawStageBackground(ctx, w, h, 40, h - 28, false);
      const sx = 130;
      const sy = 56;
      const pxLen = 360;
      const ex = sx + pxLen * Math.cos(rad);
      const ey = sy + pxLen * Math.sin(rad);
      ctx.strokeStyle = '#64748b';
      ctx.fillStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.lineTo(sx, ey);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const distPx = (s / maxLenMeters) * (pxLen - 40);
      const bx = sx + distPx * Math.cos(rad);
      const by = sy + distPx * Math.sin(rad);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(rad);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, -26, 32, 26);
      ctx.restore();

      const N = m * g * Math.cos(rad);
      const fms = willSlide ? mu * N : m * g * Math.sin(rad);
      history.push({ x: Number(t.toFixed(2)), y: Number(v.toFixed(2)) });
      return {
        readings: [
          { label: 'Trạng thái', value: willSlide ? 'Trượt xuống' : 'Đứng yên', unit: '' },
          { label: 'Gia tốc a', value: a.toFixed(2), unit: 'm/s²' },
          { label: 'Phản lực N', value: N.toFixed(1), unit: 'N' },
          { label: 'Lực ma sát F_ms', value: fms.toFixed(1), unit: 'N' },
        ],
        graphSeries: { title: 'Vận tốc dọc dốc v(t)', xLabel: 't (s)', yLabel: 'v (m/s)', points: history },
      };
    },
  },
  {
    id: 'phys-08',
    orderNumber: 8,
    name: 'Lực ma sát nghỉ và lực ma sát trượt',
    groupId: 'B',
    groupName: 'Động lực học',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'force',
    status: 'implemented',
    parameters: [
      { key: 'F', label: 'Lực kéo F', unit: 'N', min: 0, max: 60, step: 1, defaultValue: 22 },
      { key: 'm', label: 'Khối lượng m', unit: 'kg', min: 1, max: 15, step: 0.5, defaultValue: 5 },
      { key: 'mun', label: 'Hệ số ma sát nghỉ μ_n', unit: '', min: 0.1, max: 0.8, step: 0.05, defaultValue: 0.4 },
      { key: 'mut', label: 'Hệ số ma sát trượt μ_t', unit: '', min: 0.05, max: 0.7, step: 0.05, defaultValue: 0.3 },
    ],
    formulasLatex: ['F_{ms,\\text{nghỉ}\\max} = \\mu_n N', 'F_{ms,\\text{trượt}} = \\mu_t N'],
    explanationVi:
      'Khi ngoại lực kéo nhỏ hơn hoặc bằng ma sát nghỉ cực đại, vật đứng yên và lực ma sát nghỉ cân bằng với lực kéo. Khi vượt ngưỡng, vật trượt và chịu ma sát trượt không đổi (μ_t ≤ μ_n).',
    assumptionsAndLimits: [
      'Nếu người dùng đặt μ_t > μ_n, hệ thống tự giới hạn μ_t = min(μ_t, μ_n) theo tính chất vật lý.',
      'Mặt tiếp xúc phẳng ngang, N = m·g.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const m = params.m ?? 5;
      const F = params.F ?? 22;
      const mun = params.mun ?? 0.4;
      const mut = Math.min(params.mut ?? 0.3, mun);
      const N = m * 9.8;
      const fMax = mun * N;
      const fSlide = mut * N;
      const moving = F > fMax;
      const fFric = moving ? fSlide : F;
      const a = moving ? (F - fSlide) / m : 0;
      const x = 0.5 * a * t * t;

      const ox = 80;
      const oy = h * 0.68;
      drawStageBackground(ctx, w, h, ox, oy);
      const px = Math.min(w - 90, ox + x * 6);
      ctx.fillStyle = moving ? '#10b981' : '#64748b';
      ctx.fillRect(px, oy - 36, 48, 36);
      drawArrow(ctx, px + 48, oy - 18, px + 48 + F * 2, oy - 18, '#38bdf8', `F=${F}N`);
      drawArrow(ctx, px, oy - 8, px - fFric * 2, oy - 8, '#f43f5e', `Fms=${fFric.toFixed(1)}N`);

      history.push({ x: Number(t.toFixed(2)), y: Number(fFric.toFixed(2)) });
      return {
        readings: [
          { label: 'Trạng thái', value: moving ? 'Đang trượt' : 'Đứng yên', unit: '' },
          { label: 'F_ms nghỉ cực đại', value: fMax.toFixed(1), unit: 'N' },
          { label: 'F_ms hiện tại', value: fFric.toFixed(1), unit: 'N' },
          { label: 'Gia tốc a', value: a.toFixed(2), unit: 'm/s²' },
        ],
        graphSeries: { title: 'Độ lớn lực ma sát theo thời gian', xLabel: 't (s)', yLabel: 'F_ms (N)', points: history },
      };
    },
  },
  {
    id: 'phys-09',
    orderNumber: 9,
    name: 'Hệ hai vật nối bằng dây qua ròng rọc lý tưởng',
    groupId: 'B',
    groupName: 'Động lực học',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'force',
    status: 'implemented',
    parameters: [
      { key: 'm1', label: 'Khối lượng m₁ (trái)', unit: 'kg', min: 1, max: 15, step: 0.5, defaultValue: 3 },
      { key: 'm2', label: 'Khối lượng m₂ (phải)', unit: 'kg', min: 1, max: 15, step: 0.5, defaultValue: 5 },
    ],
    formulasLatex: ['a = \\frac{m_2 - m_1}{m_1 + m_2} g', 'T = \\frac{2 m_1 m_2}{m_1 + m_2} g'],
    explanationVi:
      'Máy Atwood gồm hai vật nối qua ròng rọc cố định. Vật có khối lượng lớn hơn đi xuống với cùng độ lớn gia tốc với vật nhẹ hơn đi lên; lực căng dây T giống nhau ở hai nhánh.',
    assumptionsAndLimits: [
      'Dây mảnh không dãn, khối lượng không đáng kể.',
      'Ròng rọc lý tưởng, bỏ qua ma sát trục quay và khối lượng ròng rọc.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const m1 = params.m1 ?? 3;
      const m2 = params.m2 ?? 5;
      const g = 9.8;
      const a = ((m2 - m1) / (m1 + m2)) * g;
      const T = ((2 * m1 * m2) / (m1 + m2)) * g;
      const dispMeters = 0.5 * a * t * t;
      const dispPx = Math.max(-72, Math.min(72, dispMeters * 16));

      drawStageBackground(ctx, w, h, w / 2, h - 20, false);
      const cx = w / 2;
      const py = 58;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, py, 28, 0, Math.PI * 2);
      ctx.stroke();

      const y1 = 155 - dispPx;
      const y2 = 155 + dispPx;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 28, py);
      ctx.lineTo(cx - 28, y1);
      ctx.moveTo(cx + 28, py);
      ctx.lineTo(cx + 28, y2);
      ctx.stroke();

      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(cx - 48, y1, 40, 40);
      drawLabel(ctx, `${m1}kg`, cx - 28, y1 + 24, '#ffffff', 'center');
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(cx + 8, y2, 40, 40);
      drawLabel(ctx, `${m2}kg`, cx + 28, y2 + 24, '#ffffff', 'center');

      history.push({ x: Number(t.toFixed(2)), y: Number((Math.abs(a) * t).toFixed(2)) });
      return {
        readings: [
          { label: 'Gia tốc |a|', value: Math.abs(a).toFixed(2), unit: 'm/s²' },
          { label: 'Lực căng dây T', value: T.toFixed(1), unit: 'N' },
          { label: 'Chiều chuyển động', value: m2 > m1 ? 'm₂ xuống' : m1 > m2 ? 'm₁ xuống' : 'Cân bằng', unit: '' },
        ],
        graphSeries: { title: 'Tốc độ hệ |v|(t)', xLabel: 't (s)', yLabel: 'v (m/s)', points: history },
      };
    },
  },
  {
    id: 'phys-10',
    orderNumber: 10,
    name: 'Lực đẩy Archimedes và sự nổi – chìm của vật',
    groupId: 'B',
    groupName: 'Động lực học',
    suggestedGrades: [8, 10],
    isTimeDependent: true,
    previewType: 'force',
    status: 'implemented',
    parameters: [
      { key: 'rhoObj', label: 'KLR vật ρ_vật', unit: 'kg/m³', min: 200, max: 2500, step: 50, defaultValue: 750 },
      { key: 'rhoLiq', label: 'KLR chất lỏng ρ_lỏng', unit: 'kg/m³', min: 600, max: 1600, step: 50, defaultValue: 1000 },
      { key: 'V', label: 'Thể tích vật V', unit: 'dm³', min: 1, max: 10, step: 0.5, defaultValue: 4 },
    ],
    formulasLatex: ['F_A = \\rho_{\\text{lỏng}} \\cdot g \\cdot V_{\\text{chìm}}', 'P = \\rho_{\\text{vật}} \\cdot g \\cdot V'],
    explanationVi:
      'Vật chìm hoàn toàn khi ρ_vật > ρ_lỏng (P > F_A max), lơ lửng khi ρ_vật = ρ_lỏng, và nổi một phần trên mặt thoáng với tỉ lệ thể tích chìm V_chìm / V = ρ_vật / ρ_lỏng khi ρ_vật < ρ_lỏng.',
    assumptionsAndLimits: [
      'Vật khối hộp đồng chất, không thấm chất lỏng.',
      'Chuyển động tiếp cận vị trí cân bằng được mô phỏng êm có giảm chấn.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const rhoObj = params.rhoObj ?? 750;
      const rhoLiq = params.rhoLiq ?? 1000;
      const Vdm3 = params.V ?? 4;
      const g = 9.8;
      const Vm3 = Vdm3 * 0.001;
      const P = rhoObj * g * Vm3;
      const ratioSub = Math.min(1, rhoObj / rhoLiq);
      const FA = rhoLiq * g * Vm3 * ratioSub;

      drawStageBackground(ctx, w, h, 40, h - 24, false);
      const tankLeft = 150;
      const tankW = w - 300;
      const waterTop = 120;
      const tankBottom = h - 28;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
      ctx.fillRect(tankLeft, waterTop, tankW, tankBottom - waterTop);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(tankLeft, 70, tankW, tankBottom - 70);

      const boxSize = 54 + Vdm3 * 2;
      const eqY = rhoObj > rhoLiq ? tankBottom - boxSize : waterTop - boxSize * (1 - ratioSub);
      const startY = 76;
      const settle = 1 - Math.exp(-t * 2.2);
      const curY = startY + (eqY - startY) * settle;
      const bx = w / 2 - boxSize / 2;

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx, curY, boxSize, boxSize);
      drawArrow(ctx, w / 2 - 12, curY + boxSize / 2, w / 2 - 12, curY + boxSize / 2 + Math.min(70, P * 0.7), '#f43f5e', 'P');
      drawArrow(ctx, w / 2 + 12, curY + boxSize / 2, w / 2 + 12, curY + boxSize / 2 - Math.min(70, FA * 0.7), '#10b981', 'F_A');

      history.push({ x: Number(t.toFixed(2)), y: Number(FA.toFixed(2)) });
      return {
        readings: [
          { label: 'Trọng lượng P', value: P.toFixed(2), unit: 'N' },
          { label: 'Lực đẩy F_A', value: FA.toFixed(2), unit: 'N' },
          { label: 'Tỉ lệ chìm', value: (ratioSub * 100).toFixed(0), unit: '%' },
          { label: 'Trạng thái', value: rhoObj > rhoLiq ? 'Chìm' : rhoObj < rhoLiq ? 'Nổi' : 'Lơ lửng', unit: '' },
        ],
        graphSeries: { title: 'Lực đẩy Archimedes cân bằng', xLabel: 't (s)', yLabel: 'F_A (N)', points: history },
      };
    },
  },
];
