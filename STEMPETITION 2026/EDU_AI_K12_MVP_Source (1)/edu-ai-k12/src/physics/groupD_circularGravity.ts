import type { PhysicsSimulationSpec } from '../types/physics';
import { drawArrow, drawLabel, drawStageBackground } from './canvasHelpers';

export const GROUP_D_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-16',
    orderNumber: 16,
    name: 'Chuyển động tròn đều',
    groupId: 'D',
    groupName: 'Chuyển động tròn và hấp dẫn',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'orbit',
    status: 'implemented',
    parameters: [
      { key: 'R', label: 'Bán kính quỹ đạo R', unit: 'm', min: 1, max: 6, step: 0.5, defaultValue: 3 },
      { key: 'omega', label: 'Tốc độ góc ω', unit: 'rad/s', min: 0.5, max: 6, step: 0.2, defaultValue: 2 },
    ],
    formulasLatex: ['v = \\omega R', 'T = \\frac{2\\pi}{\\omega}', 'f = \\frac{1}{T}'],
    explanationVi:
      'Chất điểm chuyển động trên đường tròn bán kính R với tốc độ góc ω không đổi. Vectơ vận tốc dài luôn tiếp tuyến với quỹ đạo và có độ lớn không đổi v = ωR.',
    assumptionsAndLimits: ['Chuyển động tròn phẳng lý tưởng.', 'Tốc độ góc không đổi theo thời gian.'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const R = params.R ?? 3;
      const omega = params.omega ?? 2;
      const v = omega * R;
      const T = (2 * Math.PI) / omega;
      const theta = omega * t;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const pxR = R * 22;
      drawStageBackground(ctx, w, h, cx, cy);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, pxR, 0, Math.PI * 2);
      ctx.stroke();

      const bx = cx + pxR * Math.cos(theta);
      const by = cy - pxR * Math.sin(theta);
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(bx, by);
      ctx.stroke();

      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fill();

      const vx = -Math.sin(theta) * v * 6;
      const vy = -Math.cos(theta) * v * 6;
      drawArrow(ctx, bx, by, bx + vx, by + vy, '#f59e0b', 'v');

      history.push({ x: Number(t.toFixed(2)), y: Number((R * Math.cos(theta)).toFixed(2)) });
      return {
        readings: [
          { label: 'Tốc độ dài v', value: v.toFixed(2), unit: 'm/s' },
          { label: 'Chu kỳ T', value: T.toFixed(2), unit: 's' },
          { label: 'Tần số f', value: (1 / T).toFixed(2), unit: 'Hz' },
        ],
        graphSeries: { title: 'Hình chiếu x(t) = R·cos(ωt)', xLabel: 't (s)', yLabel: 'x (m)', points: history },
      };
    },
  },
  {
    id: 'phys-17',
    orderNumber: 17,
    name: 'Lực hướng tâm và gia tốc hướng tâm',
    groupId: 'D',
    groupName: 'Chuyển động tròn và hấp dẫn',
    suggestedGrades: [10],
    isTimeDependent: true,
    previewType: 'orbit',
    status: 'implemented',
    parameters: [
      { key: 'm', label: 'Khối lượng m', unit: 'kg', min: 0.5, max: 10, step: 0.5, defaultValue: 2 },
      { key: 'v', label: 'Tốc độ dài v', unit: 'm/s', min: 1, max: 12, step: 0.5, defaultValue: 6 },
      { key: 'R', label: 'Bán kính R', unit: 'm', min: 1, max: 6, step: 0.5, defaultValue: 3 },
    ],
    formulasLatex: ['a_{ht} = \\frac{v^2}{R}', 'F_{ht} = m \\frac{v^2}{R}'],
    explanationVi:
      'Trong chuyển động tròn đều, lực hướng tâm luôn hướng vào tâm quỹ đạo, đóng vai trò làm đổi hướng vectơ vận tốc và gây ra gia tốc hướng tâm a_ht = v²/R.',
    assumptionsAndLimits: ['Chuyển động tròn đều trên mặt phẳng ngang không ma sát.', 'Bán kính quay cố định.'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const m = params.m ?? 2;
      const v = params.v ?? 6;
      const R = params.R ?? 3;
      const omega = v / R;
      const aht = (v * v) / R;
      const Fht = m * aht;
      const theta = omega * t;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const pxR = R * 22;
      drawStageBackground(ctx, w, h, cx, cy);

      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx, cy, pxR, 0, Math.PI * 2);
      ctx.stroke();

      const bx = cx + pxR * Math.cos(theta);
      const by = cy - pxR * Math.sin(theta);
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(bx, by, 11, 0, Math.PI * 2);
      ctx.fill();

      // Arrow pointing towards center
      const ux = (cx - bx) / pxR;
      const uy = (cy - by) / pxR;
      const arrowLen = Math.min(pxR * 0.9, 24 + Fht * 1.1);
      drawArrow(ctx, bx, by, bx + ux * arrowLen, by + uy * arrowLen, '#f43f5e', 'F_ht');
      drawArrow(ctx, bx, by, bx - Math.sin(theta) * v * 5, by - Math.cos(theta) * v * 5, '#38bdf8', 'v');

      history.push({ x: Number(t.toFixed(2)), y: Number(Fht.toFixed(2)) });
      return {
        readings: [
          { label: 'Gia tốc hướng tâm a_ht', value: aht.toFixed(2), unit: 'm/s²' },
          { label: 'Lực hướng tâm F_ht', value: Fht.toFixed(2), unit: 'N' },
          { label: 'Tốc độ góc ω', value: omega.toFixed(2), unit: 'rad/s' },
        ],
        graphSeries: { title: 'Độ lớn lực hướng tâm F_ht', xLabel: 't (s)', yLabel: 'F_ht (N)', points: history },
      };
    },
  },
  {
    id: 'phys-18',
    orderNumber: 18,
    name: 'Mômen lực và đòn bẩy',
    groupId: 'D',
    groupName: 'Chuyển động tròn và hấp dẫn',
    suggestedGrades: [8, 10],
    isTimeDependent: false,
    previewType: 'force',
    status: 'implemented',
    parameters: [
      { key: 'F1', label: 'Lực bên trái F₁', unit: 'N', min: 5, max: 50, step: 1, defaultValue: 20 },
      { key: 'd1', label: 'Cánh tay đòn d₁', unit: 'm', min: 0.5, max: 4, step: 0.25, defaultValue: 2 },
      { key: 'F2', label: 'Lực bên phải F₂', unit: 'N', min: 5, max: 50, step: 1, defaultValue: 25 },
      { key: 'd2', label: 'Cánh tay đòn d₂', unit: 'm', min: 0.5, max: 4, step: 0.25, defaultValue: 1.6 },
    ],
    formulasLatex: ['M = F \\cdot d', '\\sum M = M_1 - M_2 = 0 \\text{ (cân bằng)}'],
    explanationVi:
      'Quy tắc mômen lực: Thanh đòn bẩy cân bằng nằm ngang khi tổng mômen làm quay ngược chiều kim đồng hồ (M₁ = F₁d₁) bằng tổng mômen làm quay cùng chiều kim đồng hồ (M₂ = F₂d₂).',
    assumptionsAndLimits: [
      'Thanh đồng chất có trục quay tại trọng tâm nên bỏ qua mômen trọng lực thanh.',
      'Hai lực tác dụng vuông góc với thanh đòn bẩy.',
    ],
    stepAndRender: (ctx, w, h, _t, params) => {
      const F1 = params.F1 ?? 20;
      const d1 = params.d1 ?? 2;
      const F2 = params.F2 ?? 25;
      const d2 = params.d2 ?? 1.6;
      const M1 = F1 * d1;
      const M2 = F2 * d2;
      const netM = M2 - M1;
      const tiltRad = Math.max(-0.32, Math.min(0.32, netM * 0.008));

      const cx = w * 0.5;
      const cy = h * 0.56;
      drawStageBackground(ctx, w, h, cx, cy, false);

      // Fulcrum triangle
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 22, cy + 44);
      ctx.lineTo(cx + 22, cy + 44);
      ctx.closePath();
      ctx.fill();

      const scale = 58;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tiltRad);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-250, -5, 500, 10);

      const x1 = -d1 * scale;
      const x2 = d2 * scale;
      drawArrow(ctx, x1, 5, x1, 5 + F1 * 1.4, '#0ea5e9', `F₁=${F1}N`);
      drawArrow(ctx, x2, 5, x2, 5 + F2 * 1.4, '#f43f5e', `F₂=${F2}N`);
      ctx.restore();

      const state = Math.abs(netM) < 0.5 ? 'Cân bằng' : netM > 0 ? 'Nghiêng phải' : 'Nghiêng trái';
      return {
        readings: [
          { label: 'Mômen trái M₁', value: M1.toFixed(1), unit: 'N·m' },
          { label: 'Mômen phải M₂', value: M2.toFixed(1), unit: 'N·m' },
          { label: 'Hiệu mômen ΔM', value: Math.abs(netM).toFixed(1), unit: 'N·m' },
          { label: 'Trạng thái', value: state, unit: '' },
        ],
      };
    },
  },
  {
    id: 'phys-19',
    orderNumber: 19,
    name: 'Chuyển động quay dưới tác dụng của mômen lực',
    groupId: 'D',
    groupName: 'Chuyển động tròn và hấp dẫn',
    suggestedGrades: [10, 12],
    isTimeDependent: true,
    previewType: 'orbit',
    status: 'implemented',
    parameters: [
      { key: 'M', label: 'Mômen lực tác dụng M', unit: 'N·m', min: 0.5, max: 20, step: 0.5, defaultValue: 6 },
      { key: 'I', label: 'Mômen quán tính I', unit: 'kg·m²', min: 0.5, max: 10, step: 0.5, defaultValue: 2 },
    ],
    formulasLatex: ['\\gamma = \\frac{M}{I}', '\\omega = \\gamma t', '\\varphi = \\frac{1}{2} \\gamma t^2'],
    explanationVi:
      'Phương trình động lực học vật rắn quay quanh trục cố định: M = I·γ. Với mômen lực không đổi, vật quay nhanh dần đều với gia tốc góc γ = M/I.',
    assumptionsAndLimits: ['Trục quay cố định, bỏ qua ma sát ổ trục.', 'Vật rắn là đĩa tròn đồng chất.'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const M = params.M ?? 6;
      const I = params.I ?? 2;
      const gamma = M / I;
      const omega = gamma * t;
      const phi = 0.5 * gamma * t * t;
      const cx = w * 0.5;
      const cy = h * 0.5;
      drawStageBackground(ctx, w, h, cx, cy);

      const radius = 82;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(phi);
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius, 0);
      ctx.stroke();
      ctx.restore();

      drawArrow(ctx, cx, cy - radius, cx + M * 4, cy - radius, '#f43f5e', `M=${M}N·m`);
      history.push({ x: Number(t.toFixed(2)), y: Number(omega.toFixed(2)) });
      return {
        readings: [
          { label: 'Gia tốc góc γ', value: gamma.toFixed(2), unit: 'rad/s²' },
          { label: 'Tốc độ góc ω', value: omega.toFixed(2), unit: 'rad/s' },
          { label: 'Góc quay φ', value: phi.toFixed(2), unit: 'rad' },
        ],
        graphSeries: { title: 'Tốc độ góc ω(t)', xLabel: 't (s)', yLabel: 'ω (rad/s)', points: history },
      };
    },
  },
  {
    id: 'phys-20',
    orderNumber: 20,
    name: 'Chuyển động quỹ đạo dưới tác dụng lực hấp dẫn Newton',
    groupId: 'D',
    groupName: 'Chuyển động tròn và hấp dẫn',
    suggestedGrades: [10, 11],
    isTimeDependent: true,
    previewType: 'orbit',
    status: 'implemented',
    parameters: [
      { key: 'vFactor', label: 'Tỉ số tốc độ đầu v/v_tròn', unit: '', min: 0.7, max: 1.25, step: 0.05, defaultValue: 1.0 },
      { key: 'GM', label: 'Tham số hấp dẫn μ = GM (quy chuẩn)', unit: 'AU³/y²', min: 100, max: 500, step: 20, defaultValue: 250 },
    ],
    formulasLatex: ['F = G\\frac{M m}{r^2}', 'v_{\\text{tròn}} = \\sqrt{\\frac{GM}{r}}'],
    explanationVi:
      'Dưới lực hấp dẫn tỉ lệ nghịch bình phương khoảng cách, vật chuyển động theo quỹ đạo tròn khi v = v_tròn và chuyển thành quỹ đạo elip khi v ≠ v_tròn (v < v_thoát).',
    assumptionsAndLimits: [
      'Tích hợp số Velocity-Verlet 2D trong hệ tọa độ chuẩn hóa (m_vật ≪ M_trung tâm).',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const GM = params.GM ?? 250;
      const vFactor = params.vFactor ?? 1.0;
      const r0 = 100;
      const vCirc = Math.sqrt(GM / r0);
      const dt = 0.08;
      const steps = Math.min(800, Math.floor(t / 0.015));

      let x = r0;
      let y = 0;
      let vx = 0;
      let vy = vCirc * vFactor;
      const trail: { x: number; y: number }[] = [{ x, y }];

      for (let i = 0; i < steps; i++) {
        const r2 = x * x + y * y;
        const r = Math.max(18, Math.sqrt(r2));
        const ax = (-GM * x) / (r * r * r);
        const ay = (-GM * y) / (r * r * r);
        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;
        if (i % 3 === 0) trail.push({ x, y });
      }

      const cx = w * 0.5;
      const cy = h * 0.5;
      drawStageBackground(ctx, w, h, cx, cy);

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      trail.forEach((pt, idx) => {
        const px = cx + pt.x;
        const py = cy - pt.y;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const curPx = cx + x;
      const curPy = cy - y;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(curPx, curPy, 7, 0, Math.PI * 2);
      ctx.fill();

      const curR = Math.hypot(x, y);
      const curV = Math.hypot(vx, vy);
      history.push({ x: Number(t.toFixed(2)), y: Number(curR.toFixed(1)) });
      return {
        readings: [
          { label: 'Bán kính r(t)', value: curR.toFixed(1), unit: 'đv' },
          { label: 'Tốc độ quỹ đạo v', value: curV.toFixed(2), unit: 'đv/s' },
          { label: 'v / v_tròn', value: vFactor.toFixed(2), unit: '' },
        ],
        graphSeries: { title: 'Khoảng cách tới tâm r(t)', xLabel: 't (s)', yLabel: 'r', points: history },
      };
    },
  },
];
