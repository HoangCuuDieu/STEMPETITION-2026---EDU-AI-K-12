import type { PhysicsSimulationSpec } from '../types/physics';
import { drawArrow, drawLabel, drawSpring, drawStageBackground } from './canvasHelpers';

export const GROUP_E_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-21',
    orderNumber: 21,
    name: 'Dao động điều hòa của con lắc lò xo',
    groupId: 'E',
    groupName: 'Dao động cơ học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'oscillation',
    status: 'implemented',
    parameters: [
      { key: 'A', label: 'Biên độ A', unit: 'cm', min: 2, max: 15, step: 1, defaultValue: 10 },
      { key: 'k', label: 'Độ cứng k', unit: 'N/m', min: 10, max: 100, step: 5, defaultValue: 40 },
      { key: 'm', label: 'Khối lượng m', unit: 'kg', min: 0.2, max: 4, step: 0.2, defaultValue: 1 },
    ],
    formulasLatex: ['x = A \\cos(\\omega t)', '\\omega = \\sqrt{\\frac{k}{m}}, \\quad T = 2\\pi\\sqrt{\\frac{m}{k}}'],
    explanationVi:
      'Con lắc lò xo dao động điều hòa quanh vị trí cân bằng dưới tác dụng của lực kéo về F_kv = -k·x tỉ lệ với li độ và luôn hướng về vị trí cân bằng.',
    assumptionsAndLimits: ['Dao động không ma sát trên phương ngang, lò xo nhẹ tuân theo định luật Hooke.'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const A = params.A ?? 10;
      const k = params.k ?? 40;
      const m = params.m ?? 1;
      const omega = Math.sqrt(k / m);
      const T = (2 * Math.PI) / omega;
      const x = A * Math.cos(omega * t);
      const v = -(A * 0.01) * omega * Math.sin(omega * t);
      const a = -(omega * omega) * (x * 0.01);

      const cx = w * 0.54;
      const cy = h * 0.55;
      drawStageBackground(ctx, w, h, cx, cy);
      ctx.fillStyle = '#475569';
      ctx.fillRect(40, cy - 50, 12, 100);
      const bx = cx + x * 10;
      drawSpring(ctx, 52, cy, bx - 20, cy, 12, 10, '#94a3b8');
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(bx - 20, cy - 22, 40, 44);
      drawArrow(ctx, bx, cy - 34, bx - x * 6, cy - 34, '#f43f5e', 'F_kv');

      history.push({ x: Number(t.toFixed(2)), y: Number(x.toFixed(2)) });
      return {
        readings: [
          { label: 'Li độ x', value: x.toFixed(2), unit: 'cm' },
          { label: 'Vận tốc v', value: v.toFixed(3), unit: 'm/s' },
          { label: 'Gia tốc a', value: a.toFixed(2), unit: 'm/s²' },
          { label: 'Chu kỳ T', value: T.toFixed(2), unit: 's' },
        ],
        graphSeries: { title: 'Đồ thị li độ x(t)', xLabel: 't (s)', yLabel: 'x (cm)', points: history.slice(-160) },
      };
    },
  },
  {
    id: 'phys-22',
    orderNumber: 22,
    name: 'Dao động con lắc đơn',
    groupId: 'E',
    groupName: 'Dao động cơ học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'oscillation',
    status: 'implemented',
    parameters: [
      { key: 'L', label: 'Chiều dài dây L', unit: 'm', min: 0.5, max: 4, step: 0.25, defaultValue: 1.5 },
      { key: 'theta0', label: 'Góc lệch đầu θ₀', unit: '°', min: 3, max: 60, step: 1, defaultValue: 10 },
      { key: 'g', label: 'Gia tốc g', unit: 'm/s²', min: 1.6, max: 15, step: 0.1, defaultValue: 9.8 },
    ],
    formulasLatex: [
      '\\frac{d^2\\theta}{dt^2} = -\\frac{g}{L}\\sin\\theta',
      'T \\approx 2\\pi\\sqrt{\\frac{L}{g}} \\; (\\text{khi } \\theta_0 \\le 10^\\circ)',
    ],
    explanationVi:
      'Chuyển động con lắc đơn được tích hợp trực tiếp từ phương trình phi tuyến θ\'\' = -(g/L)sinθ. Công thức chu kỳ T = 2π√(L/g) chỉ chính xác gần đúng trong giới hạn góc lệch nhỏ (θ₀ ≤ 10°).',
    assumptionsAndLimits: [
      'Dây mảnh không dãn, bỏ qua sức cản không khí.',
      'Công thức T_nhỏ = 2π√(L/g) chỉ đúng khi sinθ ≈ θ; khi θ₀ lớn hơn 10°, chu kỳ thực tế dài hơn.',
    ],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const L = params.L ?? 1.5;
      const theta0Deg = params.theta0 ?? 10;
      const g = params.g ?? 9.8;
      const isSmallAngle = theta0Deg <= 10;

      // Numerical integration of exact nonlinear ODE d2theta/dt2 = -(g/L)*sin(theta)
      let theta = (theta0Deg * Math.PI) / 180;
      let omega = 0;
      const dt = 0.005;
      const steps = Math.min(5000, Math.floor(t / dt));
      for (let i = 0; i < steps; i++) {
        const alpha = -(g / L) * Math.sin(theta);
        omega += alpha * dt;
        theta += omega * dt;
      }

      const pivotX = w * 0.5;
      const pivotY = 40;
      const pxL = 70 + L * 45;
      drawStageBackground(ctx, w, h, pivotX, pivotY, false);
      const bx = pivotX + pxL * Math.sin(theta);
      const by = pivotY + pxL * Math.cos(theta);

      ctx.strokeStyle = '#475569';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(pivotX, pivotY + pxL + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bx, by);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(bx, by, 13, 0, Math.PI * 2);
      ctx.fill();

      const Tsmall = 2 * Math.PI * Math.sqrt(L / g);
      const thetaDeg = (theta * 180) / Math.PI;
      history.push({ x: Number(t.toFixed(2)), y: Number(thetaDeg.toFixed(2)) });
      return {
        readings: [
          { label: 'Góc lệch θ(t)', value: thetaDeg.toFixed(2), unit: '°' },
          { label: 'Vận tốc góc ω', value: omega.toFixed(2), unit: 'rad/s' },
          { label: isSmallAngle ? 'Chu kỳ T (góc nhỏ)' : 'T gần đúng (ngoài góc nhỏ)', value: Tsmall.toFixed(2), unit: 's' },
        ],
        graphSeries: { title: 'Góc lệch θ(t)', xLabel: 't (s)', yLabel: 'θ (°)', points: history.slice(-160) },
      };
    },
  },
  {
    id: 'phys-23',
    orderNumber: 23,
    name: 'Dao động tắt dần',
    groupId: 'E',
    groupName: 'Dao động cơ học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'oscillation',
    status: 'implemented',
    parameters: [
      { key: 'A0', label: 'Biên độ ban đầu A₀', unit: 'cm', min: 4, max: 15, step: 1, defaultValue: 12 },
      { key: 'beta', label: 'Hệ số tắt dần β', unit: 's⁻¹', min: 0.05, max: 0.8, step: 0.05, defaultValue: 0.25 },
      { key: 'omega0', label: 'Tần số góc ω₀', unit: 'rad/s', min: 2, max: 8, step: 0.5, defaultValue: 4.5 },
    ],
    formulasLatex: ['x(t) = A_0 e^{-\\beta t} \\cos(\\omega t)', '\\omega = \\sqrt{\\omega_0^2 - \\beta^2}'],
    explanationVi:
      'Do lực cản môi trường tỉ lệ với vận tốc, cơ năng và biên độ dao động giảm dần theo quy luật hàm mũ e^(-βt) cho đến khi vật dừng lại.',
    assumptionsAndLimits: ['Chế độ tắt dần chậm (β < ω₀) với lực cản nhớt tuyến tính F_c = -b·v.'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const A0 = params.A0 ?? 12;
      const beta = params.beta ?? 0.25;
      const omega0 = params.omega0 ?? 4.5;
      const omega = Math.sqrt(Math.max(0.5, omega0 * omega0 - beta * beta));
      const amp = A0 * Math.exp(-beta * t);
      const x = amp * Math.cos(omega * t);

      const cx = w * 0.54;
      const cy = h * 0.55;
      drawStageBackground(ctx, w, h, cx, cy);
      const bx = cx + x * 11;
      drawSpring(ctx, 48, cy, bx - 18, cy, 12, 10, '#94a3b8');
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx - 18, cy - 20, 36, 40);

      history.push({ x: Number(t.toFixed(2)), y: Number(x.toFixed(2)) });
      return {
        readings: [
          { label: 'Li độ x(t)', value: x.toFixed(2), unit: 'cm' },
          { label: 'Biên độ tức thời', value: amp.toFixed(2), unit: 'cm' },
        ],
        graphSeries: { title: 'Dao động tắt dần x(t)', xLabel: 't (s)', yLabel: 'x (cm)', points: history.slice(-160) },
      };
    },
  },
  {
    id: 'phys-24',
    orderNumber: 24,
    name: 'Dao động cưỡng bức và hiện tượng cộng hưởng',
    groupId: 'E',
    groupName: 'Dao động cơ học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'oscillation',
    status: 'implemented',
    parameters: [
      { key: 'fDrive', label: 'Tần số ngoại lực f', unit: 'Hz', min: 0.2, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { key: 'f0', label: 'Tần số riêng f₀', unit: 'Hz', min: 0.5, max: 1.5, step: 0.1, defaultValue: 1.0 },
      { key: 'gamma', label: 'Hệ số cản γ', unit: 's⁻¹', min: 0.1, max: 0.8, step: 0.05, defaultValue: 0.2 },
    ],
    formulasLatex: ['A(f) = \\frac{F_0 / m}{\\sqrt{(\\omega_0^2 - \\omega^2)^2 + 4\\gamma^2\\omega^2}}'],
    explanationVi:
      'Vật dao động với tần số của ngoại lực cưỡng bức f. Khi f tiến gần tần số riêng f₀, biên độ dao động tăng vọt đạt cực đại gọi là hiện tượng cộng hưởng.',
    assumptionsAndLimits: ['Biểu diễn trạng thái dao động ổn định (steady-state).'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const f = params.fDrive ?? 1.0;
      const f0 = params.f0 ?? 1.0;
      const gamma = params.gamma ?? 0.2;
      const wD = 2 * Math.PI * f;
      const w0 = 2 * Math.PI * f0;
      const F0m = 8;
      const A = F0m / Math.sqrt((w0 * w0 - wD * wD) ** 2 + 4 * gamma * gamma * wD * wD);
      const x = Math.min(1.6, A) * Math.cos(wD * t);

      const cx = w * 0.52;
      const cy = h * 0.55;
      drawStageBackground(ctx, w, h, cx, cy);
      const bx = cx + x * 90;
      drawSpring(ctx, 48, cy, bx - 18, cy, 12, 10, '#38bdf8');
      ctx.fillStyle = Math.abs(f - f0) < 0.1 ? '#f43f5e' : '#0ea5e9';
      ctx.fillRect(bx - 18, cy - 22, 36, 44);
      drawLabel(ctx, Math.abs(f - f0) < 0.1 ? 'CỘNG HƯỞNG!' : `A = ${A.toFixed(2)} đv`, cx, 42, '#facc15', 'center');

      // Plot resonance curve in graph
      const curve: { x: number; y: number }[] = [];
      for (let fs = 0.2; fs <= 2.0; fs += 0.05) {
        const ws = 2 * Math.PI * fs;
        const ampS = F0m / Math.sqrt((w0 * w0 - ws * ws) ** 2 + 4 * gamma * gamma * ws * ws);
        curve.push({ x: Number(fs.toFixed(2)), y: Number(ampS.toFixed(2)) });
      }
      history.length = 0;
      history.push(...curve);

      return {
        readings: [
          { label: 'Tần số riêng f₀', value: f0.toFixed(2), unit: 'Hz' },
          { label: 'Tần số ngoại lực f', value: f.toFixed(2), unit: 'Hz' },
          { label: 'Biên độ cưỡng bức A', value: A.toFixed(2), unit: 'đv' },
        ],
        graphSeries: { title: 'Đường cong cộng hưởng A(f)', xLabel: 'f (Hz)', yLabel: 'A', points: curve },
      };
    },
  },
  {
    id: 'phys-25',
    orderNumber: 25,
    name: 'Tổng hợp hai dao động điều hòa cùng phương',
    groupId: 'E',
    groupName: 'Dao động cơ học',
    suggestedGrades: [11],
    isTimeDependent: true,
    previewType: 'oscillation',
    status: 'implemented',
    parameters: [
      { key: 'A1', label: 'Biên độ A₁', unit: 'cm', min: 1, max: 10, step: 0.5, defaultValue: 6 },
      { key: 'A2', label: 'Biên độ A₂', unit: 'cm', min: 1, max: 10, step: 0.5, defaultValue: 4 },
      { key: 'dphi', label: 'Độ lệch pha Δφ', unit: '°', min: 0, max: 180, step: 15, defaultValue: 60 },
      { key: 'omega', label: 'Tần số góc ω', unit: 'rad/s', min: 1, max: 6, step: 0.5, defaultValue: 3 },
    ],
    formulasLatex: ['A^2 = A_1^2 + A_2^2 + 2 A_1 A_2 \\cos(\\Delta\\varphi)', 'x = x_1 + x_2'],
    explanationVi:
      'Tổng hợp hai dao động điều hòa cùng phương, cùng tần số là một dao động điều hòa cùng phương, cùng tần số với biên độ phụ thuộc vào độ lệch pha Δφ (cực đại khi cùng pha, cực tiểu khi ngược pha).',
    assumptionsAndLimits: ['Hai dao động thành phần cùng phương và cùng tần số góc ω.'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const A1 = params.A1 ?? 6;
      const A2 = params.A2 ?? 4;
      const dphi = ((params.dphi ?? 60) * Math.PI) / 180;
      const omega = params.omega ?? 3;
      const x1 = A1 * Math.cos(omega * t);
      const x2 = A2 * Math.cos(omega * t + dphi);
      const xSum = x1 + x2;
      const ASum = Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(dphi));

      const cx = w * 0.5;
      const cy = h * 0.52;
      drawStageBackground(ctx, w, h, cx, cy);
      const sc = 11;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx + x1 * sc, cy - 60, 10, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, 'x₁', cx + x1 * sc, cy - 76, '#38bdf8', 'center');

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + x2 * sc, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, 'x₂', cx + x2 * sc, cy - 16, '#f59e0b', 'center');

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(cx + xSum * sc, cy + 60, 13, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, 'x = x₁+x₂', cx + xSum * sc, cy + 84, '#10b981', 'center');

      history.push({ x: Number(t.toFixed(2)), y: Number(xSum.toFixed(2)) });
      return {
        readings: [
          { label: 'Biên độ tổng hợp A', value: ASum.toFixed(2), unit: 'cm' },
          { label: 'Li độ x₁', value: x1.toFixed(2), unit: 'cm' },
          { label: 'Li độ x₂', value: x2.toFixed(2), unit: 'cm' },
          { label: 'Li độ tổng hợp x', value: xSum.toFixed(2), unit: 'cm' },
        ],
        graphSeries: { title: 'Dao động tổng hợp x(t)', xLabel: 't (s)', yLabel: 'x (cm)', points: history.slice(-160) },
      };
    },
  },
];
