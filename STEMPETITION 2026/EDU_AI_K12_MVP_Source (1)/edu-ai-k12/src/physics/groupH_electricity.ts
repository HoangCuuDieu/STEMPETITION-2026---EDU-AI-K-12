import type { PhysicsSimulationSpec } from '../types/physics';
import { drawArrow, drawLabel, drawStageBackground } from './canvasHelpers';

export const GROUP_H_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-36',
    orderNumber: 36,
    name: 'Lực tương tác Coulomb giữa hai điện tích điểm',
    groupId: 'H',
    groupName: 'Điện học',
    suggestedGrades: [11],
    isTimeDependent: false,
    previewType: 'electric',
    status: 'implemented',
    parameters: [
      { key: 'q1', label: 'Điện tích q₁', unit: 'μC', min: -10, max: 10, step: 1, defaultValue: 4 },
      { key: 'q2', label: 'Điện tích q₂', unit: 'μC', min: -10, max: 10, step: 1, defaultValue: -3 },
      { key: 'r', label: 'Khoảng cách r', unit: 'm', min: 0.2, max: 3, step: 0.1, defaultValue: 1.0 },
    ],
    formulasLatex: ['F = k \\frac{|q_1 q_2|}{\\varepsilon r^2}', 'k = 9 \\times 10^9\\; \\text{N}\\cdot\\text{m}^2/\\text{C}^2'],
    explanationVi:
      'Hai điện tích điểm đứng yên trong chân không hút nhau nếu trái dấu và đẩy nhau nếu cùng dấu. Độ lớn lực tỉ lệ thuận với tích |q₁q₂| và tỉ lệ nghịch với bình phương khoảng cách r.',
    assumptionsAndLimits: ['Điện tích điểm đặt trong chân không (ε = 1).'],
    stepAndRender: (ctx, w, h, _t, params, history) => {
      const q1 = params.q1 ?? 4;
      const q2 = params.q2 ?? -3;
      const r = params.r ?? 1.0;
      const k = 9e9;
      const F = (k * Math.abs(q1 * 1e-6 * q2 * 1e-6)) / (r * r);
      const attract = q1 * q2 < 0;

      const cx = w * 0.5;
      const cy = h * 0.52;
      drawStageBackground(ctx, w, h, cx, cy);
      const sep = r * 110;
      const x1 = cx - sep / 2;
      const x2 = cx + sep / 2;

      ctx.fillStyle = q1 >= 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(x1, cy, 16, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, `${q1 > 0 ? '+' : ''}${q1}μC`, x1, cy - 24, '#e2e8f0', 'center');

      ctx.fillStyle = q2 >= 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(x2, cy, 16, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, `${q2 > 0 ? '+' : ''}${q2}μC`, x2, cy - 24, '#e2e8f0', 'center');

      const len = Math.min(90, 20 + F * 120);
      if (q1 !== 0 && q2 !== 0) {
        const dir1 = attract ? 1 : -1;
        const dir2 = attract ? -1 : 1;
        drawArrow(ctx, x1, cy, x1 + dir1 * len, cy, '#facc15', 'F₂₁');
        drawArrow(ctx, x2, cy, x2 + dir2 * len, cy, '#facc15', 'F₁₂');
      }

      const pts: { x: number; y: number }[] = [];
      for (let rs = 0.2; rs <= 3.0; rs += 0.2) {
        pts.push({ x: Number(rs.toFixed(1)), y: Number(((k * Math.abs(q1 * q2) * 1e-12) / (rs * rs)).toFixed(4)) });
      }
      history.length = 0;
      history.push(...pts);

      return {
        readings: [
          { label: 'Lực tĩnh điện F', value: F.toExponential(2), unit: 'N' },
          { label: 'Tính chất', value: q1 === 0 || q2 === 0 ? 'Không tương tác' : attract ? 'Hút nhau' : 'Đẩy nhau', unit: '' },
        ],
        graphSeries: { title: 'Đồ thị F(r)', xLabel: 'r (m)', yLabel: 'F (N)', points: pts },
      };
    },
  },
  {
    id: 'phys-37',
    orderNumber: 37,
    name: 'Đường sức điện trường của các điện tích điểm',
    groupId: 'H',
    groupName: 'Điện học',
    suggestedGrades: [11],
    isTimeDependent: false,
    previewType: 'electric',
    status: 'implemented',
    parameters: [
      { key: 'q1', label: 'Điện tích trái q₁', unit: 'μC', min: -5, max: 5, step: 1, defaultValue: 3 },
      { key: 'q2', label: 'Điện tích phải q₂', unit: 'μC', min: -5, max: 5, step: 1, defaultValue: -3 },
    ],
    formulasLatex: ['\\vec{E} = \\vec{E}_1 + \\vec{E}_2', 'E = k \\frac{|q|}{r^2}'],
    explanationVi:
      'Đường sức điện xuất phát từ điện tích dương và kết thúc ở điện tích âm (hoặc ra vô cực). Vectơ cường độ điện trường tại mỗi điểm tiếp tuyến với đường sức điện.',
    assumptionsAndLimits: ['Biểu diễn lưới vectơ chuẩn hóa hướng trường tĩnh điện 2D trong mặt phẳng chứa hai điện tích.'],
    stepAndRender: (ctx, w, h, _t, params) => {
      const q1 = params.q1 ?? 3;
      const q2 = params.q2 ?? -3;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const x1 = cx - 120;
      const x2 = cx + 120;
      drawStageBackground(ctx, w, h, cx, cy, false);

      for (let gx = 40; gx < w - 30; gx += 36) {
        for (let gy = 30; gy < h - 25; gy += 36) {
          const r1 = Math.max(22, Math.hypot(gx - x1, gy - cy));
          const r2 = Math.max(22, Math.hypot(gx - x2, gy - cy));
          const ex = (q1 * (gx - x1)) / (r1 * r1 * r1) + (q2 * (gx - x2)) / (r2 * r2 * r2);
          const ey = (q1 * (gy - cy)) / (r1 * r1 * r1) + (q2 * (gy - cy)) / (r2 * r2 * r2);
          const mag = Math.hypot(ex, ey);
          if (mag > 1e-8) {
            const dx = (ex / mag) * 14;
            const dy = (ey / mag) * 14;
            drawArrow(ctx, gx - dx * 0.5, gy - dy * 0.5, gx + dx * 0.5, gy + dy * 0.5, '#38bdf8', undefined, 1.4);
          }
        }
      }

      ctx.fillStyle = q1 >= 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(x1, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, `${q1}`, x1, cy + 4, '#fff', 'center');

      ctx.fillStyle = q2 >= 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(x2, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, `${q2}`, x2, cy + 4, '#fff', 'center');

      const Ecenter = Math.abs(9e9 * ((q1 * 1e-6) / 1 - (q2 * 1e-6) / 1));
      return {
        readings: [
          { label: 'Cường độ E tại trung điểm', value: Ecenter.toExponential(2), unit: 'V/m' },
          { label: 'Cấu hình điện tích', value: q1 * q2 < 0 ? 'Trái dấu (hút)' : q1 * q2 > 0 ? 'Cùng dấu (đẩy)' : 'Đơn cực', unit: '' },
        ],
      };
    },
  },
  {
    id: 'phys-38',
    orderNumber: 38,
    name: 'Điện thế và đường đẳng thế',
    groupId: 'H',
    groupName: 'Điện học',
    suggestedGrades: [11],
    isTimeDependent: false,
    previewType: 'electric',
    status: 'implemented',
    parameters: [
      { key: 'q', label: 'Điện tích điểm q', unit: 'nC', min: -10, max: 10, step: 1, defaultValue: 5 },
      { key: 'rTest', label: 'Vị trí điểm đo M (cách q)', unit: 'm', min: 0.2, max: 3, step: 0.1, defaultValue: 1.0 },
    ],
    formulasLatex: ['V = k \\frac{q}{r}', 'A_{MN} = q_0 (V_M - V_N)'],
    explanationVi:
      'Mặt đẳng thế là tập hợp các điểm có cùng điện thế V. Đường sức điện luôn vuông góc với các đường đẳng thế và hướng theo chiều giảm điện thế.',
    assumptionsAndLimits: ['Chọn mốc điện thế bằng 0 ở vô cực.'],
    stepAndRender: (ctx, w, h, _t, params) => {
      const q = params.q ?? 5;
      const rTest = params.rTest ?? 1.0;
      const k = 9e9;
      const V = (k * q * 1e-9) / rTest;
      const cx = w * 0.5;
      const cy = h * 0.5;
      drawStageBackground(ctx, w, h, cx, cy, false);

      [40, 80, 120, 160].forEach((rad, i) => {
        ctx.strokeStyle = q >= 0 ? 'rgba(239,68,68,0.55)' : 'rgba(59,130,246,0.55)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        const vRing = (k * q * 1e-9) / ((i + 1) * 0.5);
        drawLabel(ctx, `${vRing.toFixed(0)}V`, cx + rad + 4, cy - 4, '#94a3b8');
      });

      ctx.fillStyle = q >= 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();

      const mx = cx + rTest * 60;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(mx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, 'M', mx, cy + 18, '#facc15', 'center');

      return {
        readings: [
          { label: 'Điện thế tại M', value: V.toFixed(1), unit: 'V' },
          { label: 'Khoảng cách r', value: rTest.toFixed(1), unit: 'm' },
        ],
      };
    },
  },
  {
    id: 'phys-39',
    orderNumber: 39,
    name: 'Mạch điện một chiều có các điện trở mắc nối tiếp',
    groupId: 'H',
    groupName: 'Điện học',
    suggestedGrades: [9, 11],
    isTimeDependent: true,
    previewType: 'electric',
    status: 'implemented',
    parameters: [
      { key: 'U', label: 'Hiệu điện thế nguồn U', unit: 'V', min: 3, max: 24, step: 1, defaultValue: 12 },
      { key: 'R1', label: 'Điện trở R₁', unit: 'Ω', min: 1, max: 20, step: 1, defaultValue: 4 },
      { key: 'R2', label: 'Điện trở R₂', unit: 'Ω', min: 1, max: 20, step: 1, defaultValue: 8 },
    ],
    formulasLatex: ['R_{\\text{tđ}} = R_1 + R_2', 'I = I_1 = I_2 = \\frac{U}{R_{\\text{tđ}}}', 'U = U_1 + U_2'],
    explanationVi:
      'Trong mạch nối tiếp, cường độ dòng điện qua các điện trở là như nhau; điện trở tương đương bằng tổng các điện trở thành phần và hiệu điện thế phân chia tỉ lệ thuận với điện trở.',
    assumptionsAndLimits: ['Nguồn điện lý tưởng có điện trở trong không đáng kể, dây dẫn lý tưởng.'],
    stepAndRender: (ctx, w, h, t, params) => {
      const U = params.U ?? 12;
      const R1 = params.R1 ?? 4;
      const R2 = params.R2 ?? 8;
      const Req = R1 + R2;
      const I = U / Req;
      const U1 = I * R1;
      const U2 = I * R2;

      drawStageBackground(ctx, w, h, w / 2, h / 2, false);
      const xL = 160;
      const xR = w - 160;
      const yT = 80;
      const yB = 240;

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(xL, yT, xR - xL, yB - yT);

      // Source at bottom
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(w / 2 - 35, yB - 15, 70, 30);
      drawLabel(ctx, `U=${U}V`, w / 2, yB + 26, '#facc15', 'center');

      // Resistors on top
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(xL + 60, yT - 14, 90, 28);
      drawLabel(ctx, `R₁=${R1}Ω`, xL + 105, yT + 4, '#fff', 'center');

      ctx.fillStyle = '#a855f7';
      ctx.fillRect(xR - 150, yT - 14, 90, 28);
      drawLabel(ctx, `R₂=${R2}Ω`, xR - 105, yT + 4, '#fff', 'center');

      // Animated current charges
      const perim = 2 * (xR - xL + (yB - yT));
      for (let i = 0; i < 8; i++) {
        const d = ((i / 8) * perim + t * I * 65) % perim;
        let cx = xL;
        let cy = yT;
        const topW = xR - xL;
        const sideH = yB - yT;
        if (d < topW) { cx = xL + d; cy = yT; }
        else if (d < topW + sideH) { cx = xR; cy = yT + (d - topW); }
        else if (d < 2 * topW + sideH) { cx = xR - (d - topW - sideH); cy = yB; }
        else { cx = xL; cy = yB - (d - 2 * topW - sideH); }
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      return {
        readings: [
          { label: 'R tương đương', value: Req.toFixed(1), unit: 'Ω' },
          { label: 'Cường độ dòng I', value: I.toFixed(2), unit: 'A' },
          { label: 'U₁', value: U1.toFixed(2), unit: 'V' },
          { label: 'U₂', value: U2.toFixed(2), unit: 'V' },
        ],
      };
    },
  },
  {
    id: 'phys-40',
    orderNumber: 40,
    name: 'Mạch điện một chiều có các điện trở mắc song song',
    groupId: 'H',
    groupName: 'Điện học',
    suggestedGrades: [9, 11],
    isTimeDependent: true,
    previewType: 'electric',
    status: 'implemented',
    parameters: [
      { key: 'U', label: 'Hiệu điện thế nguồn U', unit: 'V', min: 3, max: 24, step: 1, defaultValue: 12 },
      { key: 'R1', label: 'Điện trở R₁', unit: 'Ω', min: 2, max: 24, step: 1, defaultValue: 6 },
      { key: 'R2', label: 'Điện trở R₂', unit: 'Ω', min: 2, max: 24, step: 1, defaultValue: 12 },
    ],
    formulasLatex: ['\\frac{1}{R_{\\text{tđ}}} = \\frac{1}{R_1} + \\frac{1}{R_2}', 'I = I_1 + I_2', 'U = U_1 = U_2'],
    explanationVi:
      'Trong mạch song song, hiệu điện thế trên hai nhánh bằng nhau và bằng hiệu điện thế nguồn; cường độ dòng điện mạch chính bằng tổng cường độ qua từng nhánh.',
    assumptionsAndLimits: ['Nguồn điện và dây dẫn lý tưởng.'],
    stepAndRender: (ctx, w, h, t, params) => {
      const U = params.U ?? 12;
      const R1 = params.R1 ?? 6;
      const R2 = params.R2 ?? 12;
      const Req = (R1 * R2) / (R1 + R2);
      const I1 = U / R1;
      const I2 = U / R2;
      const Itot = I1 + I2;

      drawStageBackground(ctx, w, h, w / 2, h / 2, false);
      const xL = 170;
      const xR = w - 170;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      // Branch 1 (y=75), Branch 2 (y=155), Source (y=245)
      ctx.strokeRect(xL, 75, xR - xL, 170);
      ctx.beginPath();
      ctx.moveTo(xL, 155);
      ctx.lineTo(xR, 155);
      ctx.stroke();

      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(w / 2 - 48, 61, 96, 28);
      drawLabel(ctx, `R₁=${R1}Ω (I₁=${I1.toFixed(1)}A)`, w / 2, 79, '#fff', 'center');

      ctx.fillStyle = '#10b981';
      ctx.fillRect(w / 2 - 48, 141, 96, 28);
      drawLabel(ctx, `R₂=${R2}Ω (I₂=${I2.toFixed(1)}A)`, w / 2, 159, '#fff', 'center');

      drawLabel(ctx, `U = ${U}V | I_tổng = ${Itot.toFixed(2)}A`, w / 2, 268, '#facc15', 'center');

      // Moving charge dots on both branches
      for (let i = 0; i < 4; i++) {
        const px1 = xL + ((i / 4) * (xR - xL) + t * I1 * 50) % (xR - xL);
        const px2 = xL + ((i / 4) * (xR - xL) + t * I2 * 50) % (xR - xL);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(px1, 75, 4, 0, Math.PI * 2);
        ctx.arc(px2, 155, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      return {
        readings: [
          { label: 'R tương đương', value: Req.toFixed(2), unit: 'Ω' },
          { label: 'Dòng chính I', value: Itot.toFixed(2), unit: 'A' },
          { label: 'I₁', value: I1.toFixed(2), unit: 'A' },
          { label: 'I₂', value: I2.toFixed(2), unit: 'A' },
        ],
      };
    },
  },
];
